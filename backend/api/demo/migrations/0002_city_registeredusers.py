# Generated by Django 4.0.1 on 2022-01-20 05:49

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('demo', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='City',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
            ],
            options={
                'db_table': 'city',
            },
        ),
        migrations.CreateModel(
            name='RegisteredUsers',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('username', models.CharField(max_length=50, unique=True)),
                ('administration', models.IntegerField(default=0)),
            ],
            options={
                'db_table': 'registered_users',
            },
        ),
    ]
