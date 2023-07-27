from django.test import TestCase
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
from django.core.management import call_command
from api.v1.v1_mobile.models import MobileAssignment
from api.v1.v1_forms.models import Forms, UserForms
from rest_framework import status


class MobileAssignmentApiSyncTest(TestCase):
    def setUp(self):
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        self.user = SystemUser.objects.create_user(
            email="test@test.org",
            password="test1234",
            first_name="test",
            last_name="testing",
        )
        self.administration = Administration.objects.filter(parent__isnull=True).first()
        role = UserRoleTypes.user
        self.user_access = Access.objects.create(
            user=self.user, role=role, administration=self.administration
        )
        self.form = Forms.objects.first()
        UserForms.objects.create(user=self.user, form=self.form)
        self.passcode = "passcode1234"
        MobileAssignment.objects.create_assignment(
            user=self.user, passcode=self.passcode
        )
        self.mobile_assignment = MobileAssignment.objects.get(user=self.user)
        self.token = self.mobile_assignment.token

    def test_mobile_sync_to_pending_datapoint(self):

        response = self.client.get(
            f"/api/v1/device/form/{self.form.id}",
            follow=True,
            content_type="application/json",
            **{'HTTP_AUTHORIZATION': f'Bearer {self.token}'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        json_form = response.json()
        questions = []
        json_form['question_group']
        for question_group in json_form['question_group']:
            for question in question_group['question']:
                questions.append(question)
        answers = {}
        for question in questions:
            if question['type'] == 'option':
                answers[question['id']] = [question['option'][0]['name']]
            if question['type'] == 'multiple_option':
                answers[question['id']] = [question['option'][0]['name']]
            if question['type'] == 'number':
                answers[question['id']] = 123324
            if question['type'] == 'text':
                answers[question['id']] = 'test'
            if question['type'] == 'geo':
                answers[question['id']] = {
                    "latitude": 0,
                    "longitude": 0,
                }
            if question['type'] == 'date':
                answers[question['id']] = "2021-01-01T00:00:00.000Z"
            if question['type'] == 'photo':
                answers[question['id']] = "https://picsum.photos/200/300"
            if question['type'] == 'cascade':
                answers[question['id']] = self.administration.id

        self.assertEqual(len(answers), len(questions))

        post_data = {
            "formId": self.form.id,
            "name": "testing datapoint",
            "duration": 3000,
            "submittedAt": "2021-01-01T00:00:00.000Z",
            "submitter": "Testing",
            "answers": answers
        }

        response = self.client.post(
            "/api/v1/device/sync",
            post_data,
            follow=True,
            content_type="application/json",
            **{'HTTP_AUTHORIZATION': f'Bearer {self.token}'}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
