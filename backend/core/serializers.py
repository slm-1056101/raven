import datetime
import json

from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.db import transaction
from django.http import QueryDict

from .models import Application, Company, CompanyMembership, Property, User


class CoerceDateField(serializers.DateField):
    def to_representation(self, value):
        if isinstance(value, datetime.datetime):
            value = value.date()
        return super().to_representation(value)


class CompanySerializer(serializers.ModelSerializer):
    primaryColor = serializers.CharField(source='primary_color', required=False, allow_blank=True)
    contactEmail = serializers.EmailField(source='contact_email', required=False, allow_blank=True)
    contactPhone = serializers.CharField(source='contact_phone', required=False, allow_blank=True)
    subscriptionPlan = serializers.CharField(source='subscription_plan', required=False, allow_blank=True)
    maxPlots = serializers.IntegerField(source='max_plots', required=False)
    registeredDate = serializers.SerializerMethodField()

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        if instance is not None and 'max_plots' in attrs:
            next_max_plots = attrs.get('max_plots')
            if next_max_plots is not None:
                current_count = Property.objects.filter(company_id=instance.id).count()
                if next_max_plots < current_count:
                    raise ValidationError(
                        {
                            'maxPlots': (
                                f"Cannot downgrade maxPlots to {next_max_plots}. "
                                f"This company already has {current_count} properties."
                            )
                        }
                    )
        return super().validate(attrs)

    def get_registeredDate(self, obj):
        value = getattr(obj, 'registered_date', None)
        if isinstance(value, datetime.datetime):
            return value.date()
        return value

    class Meta:
        model = Company
        fields = (
            'id',
            'name',
            'description',
            'logo',
            'primaryColor',
            'status',
            'registeredDate',
            'subscriptionPlan',
            'maxPlots',
            'contactEmail',
            'contactPhone',
            'address',
        )


class CompanyCreateSerializer(CompanySerializer):
    adminName = serializers.CharField(write_only=True, max_length=255)
    adminEmail = serializers.EmailField(write_only=True)
    adminPassword = serializers.CharField(write_only=True, min_length=6)

    class Meta(CompanySerializer.Meta):
        fields = CompanySerializer.Meta.fields + (
            'adminName',
            'adminEmail',
            'adminPassword',
        )

    def validate_adminEmail(self, value):
        email = value.lower()
        if User.objects.filter(email=email).exists():
            raise ValidationError('A user with this email already exists')
        return email

    @transaction.atomic
    def create(self, validated_data):
        admin_name = validated_data.pop('adminName')
        admin_email = validated_data.pop('adminEmail').lower()
        admin_password = validated_data.pop('adminPassword')

        company = super().create(validated_data)

        admin_user = User.objects.create_user(
            email=admin_email,
            password=admin_password,
            name=admin_name,
            phone='',
            role=User.Role.ADMIN,
            status=User.Status.ACTIVE,
            company=company,
            is_staff=True,
        )
        CompanyMembership.objects.get_or_create(user=admin_user, company=company)
        return company


class UserSerializer(serializers.ModelSerializer):
    companyId = serializers.UUIDField(source='company.id', read_only=True)
    companyIds = serializers.SerializerMethodField()
    registeredDate = serializers.SerializerMethodField()

    def get_registeredDate(self, obj):
        value = getattr(obj, 'registered_date', None)
        if isinstance(value, datetime.datetime):
            return value.date()
        return value

    def get_companyIds(self, obj):
        return [str(cid) for cid in obj.company_memberships.values_list('company_id', flat=True)]

    class Meta:
        model = User
        fields = (
            'id',
            'name',
            'email',
            'phone',
            'role',
            'status',
            'registeredDate',
            'companyId',
            'companyIds',
        )


class ClientSignupSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=64, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6)
    companyIds = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=True,
        required=False,
    )

    def validate_companyIds(self, value):
        companies = Company.objects.filter(id__in=value)
        if companies.count() != len(set(value)):
            raise ValidationError('One or more companyIds are invalid')
        return value

    def save(self, **kwargs):
        name = self.validated_data['name']
        email = self.validated_data['email'].lower()
        phone = self.validated_data.get('phone', '')
        password = self.validated_data['password']
        company_ids = self.validated_data.get('companyIds') or []

        user = User.objects.filter(email=email).first()

        if user:
            if not user.check_password(password):
                raise ValidationError({'password': 'Invalid password for existing user'})
            if user.role != User.Role.CLIENT:
                raise ValidationError({'email': 'This email is already used by a non-client account'})
            user.name = user.name or name
            if phone:
                user.phone = phone
            user.save(update_fields=['name', 'phone'])
        else:
            user = User.objects.create_user(
                email=email,
                password=password,
                name=name,
                phone=phone,
                role=User.Role.CLIENT,
                status=User.Status.ACTIVE,
            )

        # Clients are platform-wide and are not linked to any single company.
        # We intentionally do not create CompanyMembership links and do not set user.company.
        user.company = None
        user.save(update_fields=['company'])

        return user


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    companyId = serializers.UUIDField(required=False, allow_null=True)
    registeredDate = CoerceDateField(source='registered_date', required=False)

    class Meta:
        model = User
        fields = (
            'id',
            'name',
            'email',
            'phone',
            'role',
            'status',
            'registeredDate',
            'companyId',
            'password',
        )

    def create(self, validated_data):
        password = validated_data.pop('password')
        company_id = validated_data.pop('companyId', None)
        company = None
        if company_id:
            company = Company.objects.get(id=company_id)
        user = User.objects.create_user(company=company, **validated_data, password=password)
        return user


class PropertySerializer(serializers.ModelSerializer):
    companyId = serializers.UUIDField(source='company_id', required=False, allow_null=True)
    plotNumber = serializers.CharField(source='plot_number', required=False, allow_blank=True, allow_null=True)
    roomNumber = serializers.CharField(source='room_number', required=False, allow_blank=True, allow_null=True)
    financingMethods = serializers.JSONField(
        source='financing_methods',
        required=False,
    )
    image = serializers.ImageField(required=False, allow_null=True, write_only=True)
    imageUrl = serializers.SerializerMethodField()
    layoutImage = serializers.FileField(source='layout_image', required=False, allow_null=True, write_only=True)
    layoutImageUrl = serializers.SerializerMethodField()

    def to_internal_value(self, data):
        is_querydict = isinstance(data, QueryDict)
        if is_querydict:
            data = data.copy()
        elif not isinstance(data, dict):
            data = dict(data)

        raw = data.get('financingMethods')

        def coerce_string_list(value):
            if value is None:
                return None

            # If a single value arrives, allow treating it as a one-item list.
            if isinstance(value, str):
                # Often arrives as a JSON string when sent via multipart.
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, list):
                        return parsed
                except Exception:
                    pass
                return [value]

            if isinstance(value, dict):
                try:
                    items = list(value.items())
                    items.sort(key=lambda kv: int(kv[0]) if str(kv[0]).isdigit() else str(kv[0]))
                    ordered_values = [v for _, v in items]
                except Exception:
                    ordered_values = list(value.values())
                return coerce_string_list(ordered_values)

            if isinstance(value, (list, tuple)):
                out = []
                for item in value:
                    if isinstance(item, str):
                        # Sometimes we get a list of JSON strings.
                        try:
                            parsed = json.loads(item)
                            if isinstance(parsed, list):
                                out.extend(parsed)
                                continue
                        except Exception:
                            pass
                        out.append(item)
                        continue
                    if isinstance(item, (list, tuple, dict)):
                        nested = coerce_string_list(item)
                        if nested is not None:
                            out.extend(nested)
                        continue
                    out.append(item)
                return out

            return value

        coerced = coerce_string_list(raw)
        if coerced is not None:
            # When data is a QueryDict (multipart/form-data), assigning Python lists can
            # get stringified in a non-JSON way. Keep it as a JSON string for JSONField.
            if is_querydict:
                try:
                    data['financingMethods'] = json.dumps(coerced)
                except Exception:
                    data['financingMethods'] = coerced
            else:
                data['financingMethods'] = coerced

        return super().to_internal_value(data)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        methods = attrs.get('financing_methods', None)

        # financing_methods is required on create. On update, if provided, it cannot be emptied.
        if getattr(self, 'instance', None) is None and methods is None:
            raise ValidationError({'financingMethods': 'At least one financing method is required'})

        if methods is None:
            return attrs

        if not isinstance(methods, list):
            raise ValidationError({'financingMethods': 'Expected a list of strings'})

        if len(methods) == 0:
            raise ValidationError({'financingMethods': 'At least one financing method is required'})

        for idx, m in enumerate(methods):
            if not isinstance(m, str):
                raise ValidationError({'financingMethods': {str(idx): ['Not a valid string.']}})

        return attrs

    def get_imageUrl(self, obj):
        image = getattr(obj, 'image', None)
        if not image:
            return ''
        try:
            url = image.url
        except Exception:
            return ''
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_layoutImageUrl(self, obj):
        image = getattr(obj, 'layout_image', None)
        if not image:
            return ''
        try:
            url = image.url
        except Exception:
            return ''
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return url

    class Meta:
        model = Property
        fields = (
            'id',
            'companyId',
            'title',
            'description',
            'location',
            'plotNumber',
            'roomNumber',
            'price',
            'size',
            'status',
            'type',
            'image',
            'imageUrl',
            'layoutImage',
            'layoutImageUrl',
            'features',
            'financingMethods',
        )

    def create(self, validated_data):
        company_id = validated_data.pop('company_id', None)
        if company_id:
            company = Company.objects.get(id=company_id)
            current_count = Property.objects.filter(company_id=company.id).count()
            max_plots = getattr(company, 'max_plots', None)
            if isinstance(max_plots, int) and max_plots >= 0 and current_count >= max_plots:
                raise ValidationError({'detail': f"Subscription limit reached: maxPlots={max_plots}. Upgrade plan to add more plots."})
            validated_data['company'] = company

        # Per-company shared layout image by location:
        # If no layout image is uploaded, try to auto-populate from another property in the same company+location.
        location = validated_data.get('location')
        if company_id and location and not validated_data.get('layout_image'):
            existing = (
                Property.objects.filter(
                    company_id=company_id,
                    location=location,
                    layout_image__isnull=False,
                    deleted_at__isnull=True,
                )
                .exclude(layout_image='')
                .order_by('-id')
                .first()
            )
            if existing and getattr(existing, 'layout_image', None):
                validated_data['layout_image'] = existing.layout_image

        instance = super().create(validated_data)

        # Overwrite all properties in the same company+location to share this uploaded/populated layout image.
        if instance.location and getattr(instance, 'layout_image', None):
            Property.objects.filter(
                company_id=instance.company_id,
                location=instance.location,
                deleted_at__isnull=True,
            ).update(
                layout_image=instance.layout_image
            )

        return instance

    def update(self, instance, validated_data):
        # Track target location post-update (location could be patched).
        location = validated_data.get('location', instance.location)

        # If no layout is provided and this property has none, auto-populate from another property in same company+location.
        if location and not validated_data.get('layout_image') and not getattr(instance, 'layout_image', None):
            existing = (
                Property.objects.filter(
                    company_id=instance.company_id,
                    location=location,
                    layout_image__isnull=False,
                    deleted_at__isnull=True,
                )
                .exclude(id=instance.id)
                .exclude(layout_image='')
                .order_by('-id')
                .first()
            )
            if existing and getattr(existing, 'layout_image', None):
                validated_data['layout_image'] = existing.layout_image

        updated = super().update(instance, validated_data)

        # If a layout exists after update, overwrite all properties in same company+location to share it.
        if updated.location and getattr(updated, 'layout_image', None):
            Property.objects.filter(
                company_id=updated.company_id,
                location=updated.location,
                deleted_at__isnull=True,
            ).update(
                layout_image=updated.layout_image
            )

        return updated


class PublicPropertySerializer(PropertySerializer):
    companyName = serializers.CharField(source='company.name', read_only=True)

    class Meta(PropertySerializer.Meta):
        fields = PropertySerializer.Meta.fields + (
            'companyName',
        )


class ApplicationSerializer(serializers.ModelSerializer):
    companyId = serializers.UUIDField(source='company_id', required=False, allow_null=True)
    propertyId = serializers.UUIDField(source='property_id', required=False, allow_null=True)
    userId = serializers.UUIDField(source='user_id', required=False, allow_null=True)
    applicantName = serializers.CharField(source='applicant_name')
    applicantEmail = serializers.EmailField(source='applicant_email')
    applicantPhone = serializers.CharField(source='applicant_phone', required=False, allow_blank=True)
    applicantAddress = serializers.CharField(source='applicant_address', required=False, allow_blank=True)
    offerAmount = serializers.DecimalField(source='offer_amount', max_digits=14, decimal_places=2)
    financingMethod = serializers.CharField(source='financing_method', required=False, allow_blank=True)
    intendedUse = serializers.CharField(source='intended_use', required=False, allow_blank=True)
    dateApplied = serializers.SerializerMethodField()
    idDocument = serializers.FileField(source='id_document', required=False, allow_null=True, write_only=True)
    proofOfFunds = serializers.FileField(source='proof_of_funds', required=False, allow_null=True, write_only=True)

    def to_internal_value(self, data):
        if isinstance(data, QueryDict):
            data = data.copy()
        elif not isinstance(data, dict):
            data = dict(data)

        if 'financing_method' in data and 'financingMethod' not in data:
            data['financingMethod'] = data.get('financing_method')
        if 'intended_use' in data and 'intendedUse' not in data:
            data['intendedUse'] = data.get('intended_use')

        # Some clients accidentally send the literal string 'undefined'/'null'.
        # Treat these as empty so we don't persist bad values.
        fm = data.get('financingMethod')
        if isinstance(fm, str) and fm.strip().lower() in ('undefined', 'null'):
            data['financingMethod'] = ''

        return super().to_internal_value(data)

    def validate(self, attrs):
        attrs = super().validate(attrs)

        property_obj = attrs.get('property')

        # Require financing method on create.
        if getattr(self, 'instance', None) is None:
            fm = attrs.get('financing_method')
            if not fm:
                raise ValidationError({'financingMethod': 'Financing method is required'})

        financing_method = attrs.get('financing_method')
        if financing_method and property_obj is not None:
            allowed = getattr(property_obj, 'financing_methods', None) or []
            if isinstance(allowed, list) and len(allowed) > 0 and financing_method not in allowed:
                raise ValidationError({'financingMethod': 'Selected financing method is not allowed for this property'})

        return attrs

    def get_dateApplied(self, obj):
        value = getattr(obj, 'date_applied', None)
        if isinstance(value, datetime.datetime):
            return value.date()
        return value

    def _file_url(self, file_field):
        if not file_field:
            return ''
        try:
            url = file_field.url
        except Exception:
            return ''
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return url

    def to_representation(self, instance):
        data = super().to_representation(instance)
        docs = data.get('documents') or {}
        if not isinstance(docs, dict):
            docs = {}
        docs['idDocument'] = self._file_url(getattr(instance, 'id_document', None)) or docs.get('idDocument') or ''
        docs['proofOfFunds'] = self._file_url(getattr(instance, 'proof_of_funds', None)) or docs.get('proofOfFunds') or ''
        data['documents'] = docs
        return data

    class Meta:
        model = Application
        fields = (
            'id',
            'companyId',
            'propertyId',
            'userId',
            'applicantName',
            'applicantEmail',
            'applicantPhone',
            'applicantAddress',
            'offerAmount',
            'financingMethod',
            'intendedUse',
            'status',
            'dateApplied',
            'idDocument',
            'proofOfFunds',
            'documents',
        )
        extra_kwargs = {
            'company': {'read_only': True},
            'property': {'read_only': True},
            'user': {'read_only': True},
        }

    def create(self, validated_data):
        company_id = validated_data.pop('company_id', None)
        property_id = validated_data.pop('property_id', None)
        user_id = validated_data.pop('user_id', None)

        id_doc = validated_data.get('id_document')
        pof = validated_data.get('proof_of_funds')
        if id_doc:
            validated_data.setdefault('documents', {})
            if isinstance(validated_data['documents'], dict):
                validated_data['documents']['idDocumentName'] = getattr(id_doc, 'name', '')
        if pof:
            validated_data.setdefault('documents', {})
            if isinstance(validated_data['documents'], dict):
                validated_data['documents']['proofOfFundsName'] = getattr(pof, 'name', '')

        if company_id:
            validated_data['company'] = Company.objects.get(id=company_id)
        if property_id:
            validated_data['property'] = Property.objects.get(id=property_id)
        if user_id:
            validated_data['user'] = User.objects.get(id=user_id)

        return super().create(validated_data)
