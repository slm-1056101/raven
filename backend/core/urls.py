from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ApplicationViewSet,
    CompanyViewSet,
    HealthView,
    MeView,
    PropertyViewSet,
    RavenTokenObtainPairView,
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
    path('', include(router.urls)),
]
