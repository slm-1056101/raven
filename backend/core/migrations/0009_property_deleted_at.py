from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_property_layout_image_filefield'),
    ]

    operations = [
        migrations.AddField(
            model_name='property',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
