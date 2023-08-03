# Generated by Django 4.0.4 on 2023-08-03 20:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('v1_mobile', '0002_auto_20230725_2053'),
    ]

    operations = [
        migrations.CreateModel(
            name='MobileApk',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('apk_version', models.CharField(max_length=50)),
                ('apk_url', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Mobile Apk',
                'verbose_name_plural': 'Mobile Apks',
                'db_table': 'mobile_apks',
            },
        ),
    ]
