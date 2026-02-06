from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_property_deleted_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='property',
            name='financing_methods',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
