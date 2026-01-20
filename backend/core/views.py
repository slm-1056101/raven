from django.db.models import QuerySet
from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Application, Company, Property, User
from .permissions import IsAdminOrSuperAdmin, IsAuthenticatedUser, IsSuperAdmin
from .serializers import (
    ApplicationSerializer,
    ClientSignupSerializer,
    CompanyCreateSerializer,
    CompanySerializer,
    PropertySerializer,
    UserCreateSerializer,
    UserSerializer,
)


class RavenTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['company_id'] = str(user.company_id) if user.company_id else None
        token['name'] = user.name
        return token


class RavenTokenObtainPairView(TokenObtainPairView):
    serializer_class = RavenTokenObtainPairSerializer

    @extend_schema(
        summary='Login (JWT token obtain)',
        description='Authenticate with email/password and receive JWT access/refresh tokens.',
        responses={
            200: OpenApiResponse(description='Access and refresh tokens'),
            401: OpenApiResponse(description='Invalid credentials'),
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class MeView(APIView):
    @extend_schema(
        summary='Get current user',
        description='Returns the authenticated user profile, including active company (companyId) and all memberships (companyIds).',
        responses={200: UserSerializer},
    )
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class SignupView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Client signup (multi-company)',
        description=(
            'Creates or updates a Client user and associates them to one or more companies via CompanyMembership. '
            'Also sets the user\'s active company to the first selected company and returns JWT tokens.'
        ),
        request=ClientSignupSerializer,
        responses={
            200: OpenApiResponse(
                description='JWT tokens and the created/updated user payload.'
            ),
            400: OpenApiResponse(description='Validation error'),
        },
    )
    def post(self, request):
        serializer = ClientSignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data,
            }
        )


class ActiveCompanyView(APIView):
    @extend_schema(
        summary='Set active company',
        description=(
            'Switches the authenticated user\'s active company (used for tenant scoping). '
            'For Clients/Admins, the target company must be one the user is a member of. '
            'SuperAdmin can set any company.'
        ),
        request={
            'application/json': {
                'type': 'object',
                'properties': {'companyId': {'type': 'string', 'format': 'uuid'}},
                'required': ['companyId'],
            }
        },
        responses={
            200: UserSerializer,
            400: OpenApiResponse(description='companyId is required'),
            403: OpenApiResponse(description='Not a member of this company'),
        },
    )
    def post(self, request):
        company_id = request.data.get('companyId')
        if not company_id:
            return Response({'detail': 'companyId is required'}, status=400)

        user = request.user

        if getattr(user, 'role', None) == 'SuperAdmin':
            company = Company.objects.get(id=company_id)
            user.company = company
            user.save(update_fields=['company'])
            return Response(UserSerializer(user).data)

        is_member = user.company_memberships.filter(company_id=company_id).exists()
        if not is_member:
            return Response({'detail': 'Not a member of this company'}, status=403)

        company = Company.objects.get(id=company_id)
        user.company = company
        user.save(update_fields=['company'])
        return Response(UserSerializer(user).data)


class PublicCompaniesView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Public companies list',
        description='Public endpoint used during signup to allow selecting companies. Returns all companies.',
        responses={200: CompanySerializer(many=True)},
    )
    def get(self, request):
        companies = Company.objects.all().order_by('name')
        return Response(CompanySerializer(companies, many=True).data)


class TenantScopedViewSetMixin:
    def _tenant_company_id(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'SuperAdmin':
            return None
        return user.company_id


@extend_schema_view(
    list=extend_schema(
        summary='List companies',
        description=(
            'Returns companies visible to the current user. SuperAdmin sees all companies. '
            'Other roles only see companies where they have a CompanyMembership.'
        ),
    ),
    retrieve=extend_schema(summary='Get company', description='Retrieve a single company within your scope.'),
    create=extend_schema(summary='Create company', description='SuperAdmin-only: create a new company.'),
    update=extend_schema(summary='Update company', description='SuperAdmin-only: update a company.'),
    partial_update=extend_schema(summary='Partially update company', description='SuperAdmin-only: partially update a company.'),
    destroy=extend_schema(summary='Delete company', description='SuperAdmin-only: delete a company.'),
)
class CompanyViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Company.objects.all().order_by('name')
    serializer_class = CompanySerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return CompanyCreateSerializer
        return CompanySerializer

    def get_queryset(self) -> QuerySet:
        user = self.request.user
        if getattr(user, 'role', None) == 'SuperAdmin':
            return Company.objects.all().order_by('name')

        membership_ids = list(user.company_memberships.values_list('company_id', flat=True))
        if membership_ids:
            return Company.objects.filter(id__in=membership_ids).order_by('name')

        tenant_company_id = self._tenant_company_id()
        if tenant_company_id:
            return Company.objects.filter(id=tenant_company_id)

        return Company.objects.none()

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticatedUser()]
        return [IsSuperAdmin()]


@extend_schema_view(
    list=extend_schema(summary='List users', description='Admin/SuperAdmin: list users within the current tenant scope.'),
    retrieve=extend_schema(summary='Get user', description='Admin/SuperAdmin: retrieve a single user.'),
    create=extend_schema(summary='Create user', description='SuperAdmin-only: create a user.'),
    update=extend_schema(summary='Update user', description='Admin/SuperAdmin: update a user within the current tenant scope.'),
    partial_update=extend_schema(summary='Partially update user', description='Admin/SuperAdmin: partially update a user within the current tenant scope (e.g. deactivate).'),
    destroy=extend_schema(summary='Delete user', description='SuperAdmin-only: delete a user.'),
)
class UserViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('email')

    def get_queryset(self) -> QuerySet:
        user = self.request.user
        if getattr(user, 'role', None) == 'SuperAdmin':
            return User.objects.all().order_by('email')
        return User.objects.filter(company_id=user.company_id).order_by('email')

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'update', 'partial_update'):
            return [IsAdminOrSuperAdmin()]
        return [IsSuperAdmin()]


@extend_schema_view(
    list=extend_schema(summary='List properties', description='List properties in the current active company scope.'),
    retrieve=extend_schema(summary='Get property', description='Retrieve a property in the current active company scope.'),
    create=extend_schema(summary='Create property', description='Admin/SuperAdmin: create a property for the active company.'),
    update=extend_schema(summary='Update property', description='Admin/SuperAdmin: update a property.'),
    partial_update=extend_schema(summary='Partially update property', description='Admin/SuperAdmin: partially update a property.'),
    destroy=extend_schema(summary='Delete property', description='Admin/SuperAdmin: delete a property.'),
)
class PropertyViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def get_queryset(self) -> QuerySet:
        tenant_company_id = self._tenant_company_id()
        if tenant_company_id:
            return Property.objects.filter(company_id=tenant_company_id).order_by('-id')
        return Property.objects.all().order_by('-id')

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticatedUser()]
        return [IsAdminOrSuperAdmin()]

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, 'role', None) == 'SuperAdmin':
            serializer.save()
            return
        if getattr(user, 'role', None) == 'Client':
            serializer.save(company_id=user.company_id)
            return
        serializer.save(company_id=user.company_id)


@extend_schema_view(
    list=extend_schema(summary='List applications', description='List applications in the current active company scope.'),
    retrieve=extend_schema(summary='Get application', description='Retrieve a single application in the current active company scope.'),
    create=extend_schema(summary='Create application', description='Client/Admin/SuperAdmin: create an application in the active company scope.'),
    update=extend_schema(summary='Update application', description='Admin/SuperAdmin: update an application.'),
    partial_update=extend_schema(summary='Partially update application', description='Admin/SuperAdmin: partially update an application.'),
    destroy=extend_schema(summary='Delete application', description='Admin/SuperAdmin: delete an application.'),
)
class ApplicationViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def get_queryset(self) -> QuerySet:
        tenant_company_id = self._tenant_company_id()
        if tenant_company_id:
            return Application.objects.filter(company_id=tenant_company_id).order_by('-id')
        return Application.objects.all().order_by('-id')

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'create'):
            return [IsAuthenticatedUser()]
        return [IsAdminOrSuperAdmin()]

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, 'role', None) == 'SuperAdmin':
            serializer.save()
            return
        if getattr(user, 'role', None) == 'Client':
            serializer.save(company_id=user.company_id, user=user)
            return
        serializer.save(company_id=user.company_id)


class HealthView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Health check',
        description='Simple liveness probe. Returns ok when the API server is running.',
        responses={200: OpenApiResponse(description='{"status": "ok"}')},
    )
    def get(self, request):
        return Response({'status': 'ok'})
