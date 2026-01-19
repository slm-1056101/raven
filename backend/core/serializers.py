from rest_framework import serializers

from .models import Application, Company, Property, User


class CompanySerializer(serializers.ModelSerializer):
    primaryColor = serializers.CharField(source='primary_color', required=False, allow_blank=True)
    contactEmail = serializers.EmailField(source='contact_email', required=False, allow_blank=True)
    contactPhone = serializers.CharField(source='contact_phone', required=False, allow_blank=True)
    registeredDate = serializers.DateField(source='registered_date', required=False)

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


class UserSerializer(serializers.ModelSerializer):
    companyId = serializers.UUIDField(source='company.id', read_only=True)
    registeredDate = serializers.DateField(source='registered_date', read_only=True)

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
        )


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    companyId = serializers.UUIDField(required=False, allow_null=True)
    registeredDate = serializers.DateField(source='registered_date', required=False)

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
    companyId = serializers.UUIDField(write_only=True, required=False)
    imageUrl = serializers.URLField(source='image_url', required=False, allow_blank=True)

    class Meta:
        model = Property
        fields = (
            'id',
            'company',
            'companyId',
            'title',
            'description',
            'location',
            'price',
            'size',
            'status',
            'type',
            'imageUrl',
            'features',
        )
        extra_kwargs = {
            'company': {'read_only': True},
        }

    def create(self, validated_data):
        company_id = validated_data.pop('companyId', None)
        if company_id:
            validated_data['company'] = Company.objects.get(id=company_id)
        return super().create(validated_data)


class ApplicationSerializer(serializers.ModelSerializer):
    companyId = serializers.UUIDField(write_only=True, required=False)
    propertyId = serializers.UUIDField(write_only=True, required=False)
    userId = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    applicantName = serializers.CharField(source='applicant_name')
    applicantEmail = serializers.EmailField(source='applicant_email')
    applicantPhone = serializers.CharField(source='applicant_phone', required=False, allow_blank=True)
    applicantAddress = serializers.CharField(source='applicant_address', required=False, allow_blank=True)
    offerAmount = serializers.DecimalField(source='offer_amount', max_digits=14, decimal_places=2)
    financingMethod = serializers.CharField(source='financing_method', required=False, allow_blank=True)
    intendedUse = serializers.CharField(source='intended_use', required=False, allow_blank=True)
    dateApplied = serializers.DateField(source='date_applied', required=False)

    class Meta:
        model = Application
        fields = (
            'id',
            'company',
            'companyId',
            'property',
            'propertyId',
            'user',
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
            'documents',
        )
        extra_kwargs = {
            'company': {'read_only': True},
            'property': {'read_only': True},
            'user': {'read_only': True},
        }

    def create(self, validated_data):
        company_id = validated_data.pop('companyId', None)
        property_id = validated_data.pop('propertyId', None)
        user_id = validated_data.pop('userId', None)

        if company_id:
            validated_data['company'] = Company.objects.get(id=company_id)
        if property_id:
            validated_data['property'] = Property.objects.get(id=property_id)
        if user_id:
            validated_data['user'] = User.objects.get(id=user_id)

        return super().create(validated_data)
