from django.db import transaction, connection


@transaction.atomic
def refresh_data_category_views():
    with connection.cursor() as cursor:
        cursor.execute("""
            REFRESH MATERIALIZED VIEW data_category;
            """)
