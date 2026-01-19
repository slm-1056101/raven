from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ActiveCompanyView,
    ApplicationViewSet,
    CompanyViewSet,
    HealthView,
    MeView,
    PublicCompaniesView,
    PropertyViewSet,
    RavenTokenObtainPairView,
    SignupView,
    UserViewSet,
)

router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'users', UserViewSet, basename='user')
router.register(r'properties', PropertyViewSet, basename='property')
router.register(r'applications', ApplicationViewSet, basename='application')

urlpatterns = [
    path('health/', HealthView.as_view(), name='health'),
    path('auth/token/', RavenTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/signup/', SignupView.as_view(), name='signup'),
    path('auth/active-company/', ActiveCompanyView.as_view(), name='active_company'),
    path('public/companies/', PublicCompaniesView.as_view(), name='public_companies'),
    path('', include(router.urls)),
]
