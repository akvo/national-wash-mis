import os
import sqlite3
import pandas as pd
from nwmis.settings import MASTER_DATA
from django.test import TestCase
from api.v1.v1_profile.models import Administration
from api.v1.v1_users.models import Organisation
from django.core.management import call_command
from utils.custom_generator import generate_sqlite


class SQLiteGenerationTest(TestCase):
    def setUp(self):
        call_command("administration_seeder")
        call_command("organisation_seeder", "--test")
        self.administration = Administration.objects.all()
        self.organization = Organisation.objects.all()

    def test_generate_sqlite(self):
        # Test for Organisation
        conn, file_name = generate_sqlite(Organisation)
        self.assertTrue(os.path.exists(file_name))
        self.assertEqual(
            len(self.organization),
            len(pd.read_sql_query("SELECT * FROM nodes", conn))
        )
        conn.close()
        os.remove(file_name)

        # Test for Administration
        conn, file_name = generate_sqlite(Administration)
        self.assertTrue(os.path.exists(file_name))
        self.assertEqual(
            len(self.administration),
            len(pd.read_sql_query("SELECT * FROM nodes", conn))
        )
        conn.close()
        os.remove(file_name)
