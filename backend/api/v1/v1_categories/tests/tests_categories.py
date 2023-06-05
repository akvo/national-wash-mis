import pandas as pd
from io import StringIO
from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from api.v1.v1_users.models import SystemUser
from api.v1.v1_data.models import Answers, Questions, FormData
from api.v1.v1_categories.functions import (
    get_category_by_lang,
    get_category_trans,
)
from api.v1.v1_forms.constants import QuestionTypes
from utils.functions import get_answer_value


@override_settings(USE_TZ=False)
class CategoryTestCase(TestCase):
    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post(
            "/api/v1/login", user_payload, content_type="application/json"
        )
        token = user_response.json().get("token")

        call_command("form_seeder", "--test")
        call_command("fake_data_seeder", "-r", 1, "-t", True)
        header = {"HTTP_AUTHORIZATION": f"Bearer {token}"}
        self.header = header

    def test_powerbi_endpoint(self):
        header = self.header

        # PRIVATE RAW DATA ACCESS (POWER BI)
        data = self.client.get(
            "/api/v1/raw-data/1?page=1", follow=True, **header
        )
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
            sorted(list(result["data"][0]["data"])),
            sorted([f"{str(x[0])}|{x[1]}" for x in list(questions_queryset)]),
        )

        # PRIVATE RAW DATA ACCESS (POWER BI) WITH FILTER
        question = Questions.objects.filter(form_id=1).first()
        data = self.client.get(
            f"/api/v1/raw-data/1?questions={question.id}&page=1",
            follow=True,
            **header,
        )
        self.assertEqual(data.status_code, 200)
        result = data.json()
        questions_queryset = Questions.objects.filter(
            form_id=1, pk=question.id
        ).values_list("id", "name")
        self.assertEqual(
            sorted(list(result["data"][0]["data"])),
            sorted([f"{str(x[0])}|{x[1]}" for x in list(questions_queryset)]),
        )

        # PRIVATE RAW DATA ACCESS (POWER BI PAGINATION)
        data = self.client.get(
            "/api/v1/raw-data/1?page=1", follow=True, **header
        )
        self.assertEqual(data.status_code, 200)
        result = data.json()
        self.assertEqual(
            sorted(list(result["data"][0])),
            sorted(
                ["id", "name", "administration", "geo", "data", "categories"]
            ),
        )

        # PRIVATE RAW DATA ACCESS WITHOUT HEADER TOKEN
        data = self.client.get("/api/v1/raw-data/1?page=1", follow=True)
        # TODO: AFTER DEMO, FIND HOW PROVIDE AUTHENTICATION IN POWERBI
        self.assertEqual(data.status_code, 200)

    def test_get_powerbi_non_lang_param(self):
        header = self.header

        data = self.client.get("/api/v1/power-bi/1", follow=True, **header)
        self.assertEqual(data.status_code, 200)
        result = data.json()
        self.assertEqual(
            sorted(list(result[0])),
            sorted(
                ["id", "name", "administration", "geo", "data", "categories"]
            ),
        )

        question = Questions.objects.filter(type=QuestionTypes.option).first()
        question_opt = question.question_question_options.all()
        # default options are in english
        translations = [o.name for o in question_opt]

        # all options are in english
        self.assertEqual(translations, ["Male", "Female", "Other"])
        keys = list(
            filter(lambda k: str(question.id) in k, result[0]["data"].keys())
        )
        self.assertIn(result[0]["data"][keys[0]], translations)

    def test_get_powerbi_english_language(self):
        header = self.header
        lang = "en"
        data = self.client.get(
            f"/api/v1/power-bi/1?lang={lang}", follow=True, **header
        )
        self.assertEqual(data.status_code, 200)
        result = data.json()
        self.assertEqual(
            sorted(list(result[0])),
            sorted(
                ["id", "name", "administration", "geo", "data", "categories"]
            ),
        )

        question = Questions.objects.filter(type=QuestionTypes.option).first()
        question_opt = question.question_question_options.all()
        translations = [
            list(filter(lambda o: o["language"] == lang, opt.translations))
            for opt in question_opt
        ]
        translations = [item for sublist in translations for item in sublist]
        if len(translations) == 0:
            translations = [o.name for o in question_opt]

        # all options are in english
        self.assertEqual(translations, ["Male", "Female", "Other"])
        keys = list(
            filter(lambda k: str(question.id) in k, result[0]["data"].keys())
        )
        self.assertIn(result[0]["data"][keys[0]], translations)

    def test_get_powerbi_french_language(self):
        header = self.header
        lang = "fr"
        data = self.client.get(
            f"/api/v1/power-bi/1?lang={lang}", follow=True, **header
        )
        self.assertEqual(data.status_code, 200)
        result = data.json()
        self.assertEqual(
            sorted(list(result[0])),
            sorted(
                ["id", "name", "administration", "geo", "data", "categories"]
            ),
        )

        question = Questions.objects.filter(type=QuestionTypes.option).first()
        question_opt = question.question_question_options.all()
        translations = [
            list(filter(lambda o: o["language"] == lang, opt.translations))
            for opt in question_opt
        ]
        translations = [
            item["name"] for sublist in translations for item in sublist
        ]
        # all options are in french
        self.assertEqual(translations, ["Mâle", "Femelle", "Autre"])

        keys = list(
            filter(lambda k: str(question.id) in k, result[0]["data"].keys())
        )
        self.assertIn(result[0]["data"][keys[0]], translations)

    def test_powerbi_no_translations_in_french(self):
        # Get first question type option
        question = Questions.objects.filter(type=QuestionTypes.option).first()
        question_opt = question.question_question_options.all()
        # Set translations null
        for option in question_opt:
            option.translations = None
            option.save()

        header = self.header
        lang = "fr"
        data = self.client.get(
            f"/api/v1/power-bi/1?lang={lang}", follow=True, **header
        )
        self.assertEqual(data.status_code, 200)
        result = data.json()
        self.assertEqual(
            sorted(list(result[0])),
            sorted(
                ["id", "name", "administration", "geo", "data", "categories"]
            ),
        )
        translations = [
            list(filter(lambda o: o["language"] == lang, opt.translations))
            if opt.translations
            else opt.name
            for opt in question_opt
        ]
        # all options are in english
        self.assertEqual(translations, ["Male", "Female", "Other"])

        keys = list(
            filter(lambda k: str(question.id) in k, result[0]["data"].keys())
        )
        self.assertIn(result[0]["data"][keys[0]], translations)

    def test_get_answer_value(self):
        # Create dummy answer
        question = Questions.objects.filter(type=QuestionTypes.option).first()
        answer = Answers.objects.create(
            data=FormData.objects.first(),
            question=question,
            created_by=SystemUser.objects.first(),
            options=["Female"],
        )
        # French translation
        trans = [
            {"key": "Female", "question": question.id, "value": "Femelle"}
        ]
        self.assertEqual(
            get_answer_value(answer=answer, toString=True, trans=trans),
            "Femelle",
        )

    def test_translated_categories(self):
        # Non english
        categories = {
            "Water": "Basic",
            "Sanitation": "Limited",
            "Hygiene": "No Service",
        }
        trans = get_category_by_lang(lang="fr")
        self.assertEqual(
            list(trans[0]),
            ["key", "value"],
        )
        res = get_category_trans(categories=categories, trans=trans)
        self.assertEqual(
            res,
            {
                "Water": "Basique",
                "Sanitation": "Limité",
                "Hygiene": "Pas de service",
            },
        )
        # English
        trans = get_category_by_lang(lang="en")
        self.assertEqual(trans, [])
        res = get_category_trans(categories=categories, trans=trans)
        self.assertEqual(
            res,
            categories,
        )

    def test_csv_endpoint(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        self.client.post(
            "/api/v1/login", user_payload, content_type="application/json"
        )
        call_command("form_seeder", "--test")
        call_command("fake_data_seeder", "-r", 1, "-t", True)

        # Call the function and get the response
        response = self.client.get("/api/v1/raw-data-csv/1", follow=True)

        # Verify the response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")
        self.assertEqual(
            response["Content-Disposition"], 'attachment; filename="data.csv"'
        )

        # Test the generated CSV content
        csv_string = response.content.decode("utf-8")
        csv_content = StringIO(csv_string)
        df = pd.read_csv(csv_content, sep=",")
        for data_id in list(df["id"]):
            answers = Answers.objects.filter(data_id=data_id).all()
            row_value = df[df["id"] == data_id]
            for a in answers:
                csv_answer = row_value[f"{a.question.id}|{a.question.name}"][0]
                if csv_answer != csv_answer:
                    csv_answer = None
                db_answer = None
                if a.options:
                    db_answer = "|".join([str(b) for b in a.options])
                if a.value:
                    db_answer = a.value
                if a.name:
                    db_answer = a.name
                self.assertEqual(db_answer, csv_answer)
        # ... Perform assertions on the CSV content
        # based on the expected values
