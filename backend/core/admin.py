from django.contrib import admin

from .models import Application, Company, Property, User


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'registered_date')
    search_fields = ('name',)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'role', 'status')
    search_fields = ('email', 'name')


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'status', 'type')
    search_fields = ('title', 'location')


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('applicant_email', 'company', 'property', 'status', 'date_applied')
    search_fields = ('applicant_email',)
