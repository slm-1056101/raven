from django.db.models import QuerySet
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Application, Company, Property, User
from .permissions import IsAdminOrSuperAdmin, IsAuthenticatedUser, IsSuperAdmin
from .serializers import (
    ApplicationSerializer,
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


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class TenantScopedViewSetMixin:
    def _tenant_company_id(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'SuperAdmin':
            return None
        return user.company_id


class CompanyViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Company.objects.all().order_by('name')
    serializer_class = CompanySerializer

    def get_queryset(self) -> QuerySet:
        tenant_company_id = self._tenant_company_id()
        if tenant_company_id:
            return Company.objects.filter(id=tenant_company_id)
        return Company.objects.all().order_by('name')

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticatedUser()]
        return [IsSuperAdmin()]


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
        if self.action in ('list', 'retrieve'):
            return [IsAdminOrSuperAdmin()]
        return [IsSuperAdmin()]


class PropertyViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    serializer_class = PropertySerializer

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
            serializer.save(companyId=user.company_id, user=user)
            return
        serializer.save(companyId=user.company_id)


class ApplicationViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer

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
            serializer.save(companyId=user.company_id, user=user)
            return
        serializer.save(companyId=user.company_id)


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'status': 'ok'})
