from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


def forwards_create_memberships(apps, schema_editor):
    User = apps.get_model('core', 'User')
    CompanyMembership = apps.get_model('core', 'CompanyMembership')

    for user in User.objects.exclude(company_id__isnull=True):
        CompanyMembership.objects.get_or_create(user_id=user.id, company_id=user.company_id)


def backwards_delete_memberships(apps, schema_editor):
    CompanyMembership = apps.get_model('core', 'CompanyMembership')
    CompanyMembership.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CompanyMembership',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('company', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='memberships', to='core.company')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='company_memberships', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'company')},
            },
        ),
        migrations.RunPython(forwards_create_memberships, backwards_delete_memberships),
    ]
