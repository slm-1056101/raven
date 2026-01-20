import datetime

from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.db import transaction

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
    registeredDate = serializers.SerializerMethodField()

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
        allow_empty=False,
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
        company_ids = self.validated_data['companyIds']

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

        companies = list(Company.objects.filter(id__in=company_ids))
        for company in companies:
            CompanyMembership.objects.get_or_create(user=user, company=company)

        if not user.company_id and companies:
            user.company = companies[0]
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
    image = serializers.ImageField(required=False, allow_null=True, write_only=True)
    imageUrl = serializers.SerializerMethodField()

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
            'features',
        )

    def create(self, validated_data):
        company_id = validated_data.pop('company_id', None)
        if company_id:
            validated_data['company'] = Company.objects.get(id=company_id)
        return super().create(validated_data)


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
