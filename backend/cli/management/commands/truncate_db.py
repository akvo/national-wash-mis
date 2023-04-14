from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Truncate all tables in the database"

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            for table in connection.introspection.table_names():
                if "django" not in table:
                    cursor.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE")
