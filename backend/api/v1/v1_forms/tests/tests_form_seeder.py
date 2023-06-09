from io import StringIO

from django.test.utils import override_settings
from django.core.management import call_command
from api.v1.v1_profile.models import Administration, Levels
from django.test import TestCase

from api.v1.v1_forms.models import Forms


def seed_administration_test():
    level = Levels(name="country", level=1)
    level.save()
    administration = Administration(
        id=1, name="Indonesia", parent=None, level=level
    )
    administration.save()
    administration = Administration(
        id=2, name="Jakarta", parent=administration, level=level
    )
    administration.save()


@override_settings(USE_TZ=False)
class FormSeederTestCase(TestCase):
    def call_command(self, *args, **kwargs):
        out = StringIO()
        call_command(
            "form_seeder",
            *args,
            stdout=out,
            stderr=StringIO(),
            **kwargs,
        )
        return out.getvalue()

    def test_call_command(self):
        self.maxDiff = None
        seed_administration_test()
        forms = Forms.objects.all().delete()
        json_forms = [
            "Household",
            "Health Facilities",
            "WASH in Schools",
            "CLTS Progress Tracking",
            "Water Points",
            "Governance and Policy",
        ]

        # RUN SEED NEW FORM
        output = self.call_command()
        output = list(filter(lambda x: len(x), output.split("\n")))
        forms = Forms.objects.all()
        self.assertEqual(forms.count(), 6)
        for form in forms:
            self.assertIn(
                f"Form Created | {form.name} V{form.version}", output
            )
            self.assertIn(form.name, json_forms)

        # RUN UPDATE EXISTING FORM
        output = self.call_command()
        output = list(filter(lambda x: len(x), output.split("\n")))
        forms = Forms.objects.all()
        form_ids = [form.id for form in forms]
        for form in forms:
            if form.version == 2:
                self.assertIn(
                    f"Form Updated | {form.name} V{form.version}", output
                )
            # FOR NON PRODUCTION FORM
            if form.version == 1:
                self.assertIn(
                    f"Form Created | {form.name} V{form.version}", output
                )
            self.assertIn(form.name, json_forms)

        user = {"email": "admin@rush.com", "password": "Test105*"}
        user = self.client.post(
            "/api/v1/login", user, content_type="application/json"
        )
        user = user.json()
        token = user.get("token")
        self.assertTrue(token)
        for id in form_ids:
            response = self.client.get(
                f"/api/v1/form/web/{id}",
                follow=True,
                content_type="application/json",
                **{"HTTP_AUTHORIZATION": f"Bearer {token}"},
            )
            self.assertEqual(200, response.status_code)
        response = self.client.get(
            "/api/v1/form/web/567490004",
            follow=True,
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {token}"},
        )
        self.assertEqual(200, response.status_code)
        response = response.json()
        self.assertEqual("Introduction", response["question_group"][0]["name"])
        self.assertEqual(
            605030132, response["question_group"][0]["question"][0]["id"]
        )
        self.assertEqual(
            "In what government level is this survey being filled?",
            response["question_group"][0]["question"][0]["name"],
        )
        self.assertEqual(
            False, response["question_group"][0]["question"][0]["meta"]
        )
        self.assertEqual(
            5674900041, response["question_group"][0]["question"][1]["id"]
        )
        self.assertEqual(
            "Organisation",
            response["question_group"][0]["question"][1]["name"],
        )
        self.assertEqual(
            {"endpoint": "/api/v1/organisations?attributes=2"},
            response["question_group"][0]["question"][1]["api"],
        )
        response = self.client.get(
            "/api/v1/form/1680838271306",
            follow=True,
            content_type="application/json",
        )
        self.assertEqual(200, response.status_code)
        response = response.json()
        self.assertEqual(3, response["question_group"][0]["question"][2]["order"])
        self.assertEqual('option', response["question_group"][0]["question"][2]["type"])
        self.assertEqual(
            ['id', 'name', 'order', 'translations'],
            list(response["question_group"][0]["question"][2]['option'][0]))
        self.assertEqual(
            ["chart", "aggregate", "table", "advanced_filter"],
            response["question_group"][0]["question"][2]["attributes"],
        )
        self.assertEqual(
            1680838271308,
            response["question_group"][0]["question"][0]["id"],
        )
        self.assertEqual(
            True,
            response["question_group"][0]["question"][0]["meta"],
        )
        self.assertEqual(
            "Localisation",
            response["question_group"][0]["question"][0]["name"],
        )
        self.assertIn(
            "advanced_filter",
            response["question_group"][0]["question"][2]["attributes"],
        )
