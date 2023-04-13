from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from api.v1.v1_data.models import Questions


@override_settings(USE_TZ=False)
class CategoryTestCase(TestCase):
    def test_powerbi_endpoint(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post(
            "/api/v1/login", user_payload, content_type="application/json"
        )
        token = user_response.json().get("token")

        call_command("form_seeder", "--test")
        call_command("fake_data_seeder", "-r", 1, "-t", True)
        header = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

        # PRIVATE RAW DATA ACCESS (POWER BI)
        data = self.client.get("/api/v1/raw-data/1?page=1", follow=True, **header)
        self.assertEqual(data.status_code, 200)
        result = data.json()
        self.assertEqual(
            list(result["data"][0]),
            ["id", "name", "administration", "geo", "data", "categories"],
        )
        questions_queryset = Questions.objects.filter(form_id=1).values_list(
            "id", "name"
        )
        self.assertEqual(
            list(result["data"][0]["data"]),
            [f"{str(x[0])}|{x[1]}" for x in list(questions_queryset)],
        )

        # PRIVATE RAW DATA ACCESS (POWER BI) WITH FILTER
        question = Questions.objects.filter(form_id=1).first()
        data = self.client.get(
            f"/api/v1/raw-data/1?questions={question.id}&page=1", follow=True, **header
        )
        self.assertEqual(data.status_code, 200)
        result = data.json()
        questions_queryset = Questions.objects.filter(
            form_id=1, pk=question.id
        ).values_list("id", "name")
        self.assertEqual(
            list(result["data"][0]["data"]),
            [f"{str(x[0])}|{x[1]}" for x in list(questions_queryset)],
        )

        # PRIVATE RAW DATA ACCESS (POWER BI)
        data = self.client.get("/api/v1/raw-data/1?page=1", follow=True, **header)
        self.assertEqual(data.status_code, 200)
        result = data.json()
        self.assertEqual(
            list(result["data"][0]),
            ["id", "name", "administration", "geo", "data", "categories"],
        )

        # PRIVATE RAW DATA ACCESS WITHOUT HEADER TOKEN
        data = self.client.get("/api/v1/raw-data/1?page=1", follow=True)
        # TODO: AFTER DEMO, FIND HOW PROVIDE AUTHENTICATION IN POWERBI
        self.assertEqual(data.status_code, 200)
