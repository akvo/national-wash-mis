# Generated by Django 4.0.4 on 2023-04-07 04:19

from django.db import migrations, models
from ..management.commands.generate_views import generate_schema


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('v1_data', '0023_viewjmpcount')
    ]

    operations = [
        migrations.CreateModel(
            name='DataCategory',
            fields=[
                ('id', models.IntegerField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=50)),
                ('options', models.JSONField()),
            ],
            options={
                'db_table': 'data_category',
                'managed': False,
            },
        ),
        migrations.RunSQL(
            generate_schema(), """
            DROP MATERIALIZED VIEW data_category;
            """)
    ]
