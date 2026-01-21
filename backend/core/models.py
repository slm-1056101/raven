import uuid

from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone


class Company(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'Active'
        PENDING = 'Pending'
        INACTIVE = 'Inactive'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    logo = models.CharField(max_length=32, blank=True)
    primary_color = models.CharField(max_length=16, blank=True)

    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    registered_date = models.DateField(default=timezone.now)

    subscription_plan = models.CharField(max_length=64, blank=True, default='Starter')
    max_plots = models.PositiveIntegerField(default=10)

    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=64, blank=True)
    address = models.CharField(max_length=255, blank=True)

    def __str__(self) -> str:
        return self.name


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra_fields):
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        SUPER_ADMIN = 'SuperAdmin'
        ADMIN = 'Admin'
        CLIENT = 'Client'

    class Status(models.TextChoices):
        ACTIVE = 'Active'
        INACTIVE = 'Inactive'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=64, blank=True)

    role = models.CharField(max_length=16, choices=Role.choices)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    registered_date = models.DateField(default=timezone.now)

    company = models.ForeignKey(Company, null=True, blank=True, on_delete=models.SET_NULL, related_name='users')

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS: list[str] = ['name']

    objects = UserManager()

    def __str__(self) -> str:
        return self.email


class CompanyMembership(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='company_memberships')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='memberships')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('user', 'company')

    def __str__(self) -> str:
        return f"{self.user.email} -> {self.company.name}"


class Property(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'Available'
        RESERVED = 'Reserved'
        SOLD = 'Sold'

    class Type(models.TextChoices):
        RESIDENTIAL = 'Residential'
        COMMERCIAL = 'Commercial'
        AGRICULTURAL = 'Agricultural'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='properties')

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255)

    plot_number = models.CharField(max_length=64, blank=True, null=True)
    room_number = models.CharField(max_length=64, blank=True, null=True)

    price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    size = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    status = models.CharField(max_length=16, choices=Status.choices, default=Status.AVAILABLE)
    type = models.CharField(max_length=16, choices=Type.choices, default=Type.RESIDENTIAL)

    image = models.ImageField(upload_to='properties/', blank=True, null=True)
    features = models.JSONField(default=list, blank=True)

    def __str__(self) -> str:
        return self.title


class Application(models.Model):
    class Status(models.TextChoices):
        PENDING = 'Pending'
        APPROVED = 'Approved'
        REJECTED = 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='applications')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='applications')

    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='applications')

    applicant_name = models.CharField(max_length=255)
    applicant_email = models.EmailField()
    applicant_phone = models.CharField(max_length=64, blank=True)
    applicant_address = models.CharField(max_length=255, blank=True)

    offer_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    financing_method = models.CharField(max_length=64, blank=True)
    intended_use = models.CharField(max_length=255, blank=True)

    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    date_applied = models.DateField(default=timezone.now)

    id_document = models.FileField(upload_to='applications/id_documents/', blank=True, null=True)
    proof_of_funds = models.FileField(upload_to='applications/proof_of_funds/', blank=True, null=True)

    documents = models.JSONField(default=dict, blank=True)

    def __str__(self) -> str:
        return f"{self.applicant_email} - {self.property_id}"
