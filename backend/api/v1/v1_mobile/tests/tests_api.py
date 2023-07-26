from django.test import TestCase
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
from django.core.management import call_command
from api.v1.v1_mobile.models import MobileAssignment
from api.v1.v1_forms.models import Forms, UserForms
from rest_framework import status


class MobileAssignmentManagerTest(TestCase):
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
        self.forms = Forms.objects.all()
        for form in self.forms:
            UserForms.objects.create(user=self.user, form=form)
        self.passcode = "passcode1234"
        MobileAssignment.objects.create_assignment(
            user=self.user, passcode=self.passcode
        )
        self.mobile_assignment = MobileAssignment.objects.get(user=self.user)

    def test_mobile_assignment_form_list_serializer(self):
        from api.v1.v1_mobile.serializers import MobileAssignmentFormsSerializer

        serializer = MobileAssignmentFormsSerializer(self.mobile_assignment)
        self.assertEqual(serializer.data["syncToken"], self.mobile_assignment.token)
        self.assertEqual(
            dict(serializer.data["formsUrl"][0]),
            {
                "id": self.forms[0].id,
                "version": str(self.forms[0].version),
                "url": f"/api/v1/mobile-form/{self.forms[0].id}",
            },
        )

    def test_mobile_assignment_form_api(self):

        code = {"code": self.passcode}
        response = self.client.post(
            "/api/v1/mobile-forms",
            code,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["syncToken"], self.mobile_assignment.token
        )
        self.assertEqual(
            dict(response.data["formsUrl"][0]),
            {
                "id": self.forms[0].id,
                "version": str(self.forms[0].version),
                "url": f"/api/v1/mobile-form/{self.forms[0].id}",
            },
        )

    def test_mobile_assignment_form_api_of_admin(self):

        # delete all user forms
        UserForms.objects.all().delete()
        code = {"code": self.passcode}
        response = self.client.post(
            "/api/v1/mobile-forms",
            code,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["syncToken"], self.mobile_assignment.token
        )
        # since user has no forms assigned, formsUrl should be empty
        self.assertEqual(response.data["formsUrl"], [])

        # modify user access to super admin
        self.user_access.role = UserRoleTypes.super_admin
        self.user_access.save()

        response = self.client.post(
            "/api/v1/mobile-forms",
            code,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["syncToken"], self.mobile_assignment.token
        )
        # formsUrl should be all forms
        self.assertEqual(
            dict(response.data["formsUrl"][0]),
            {
                "id": self.forms[0].id,
                "version": str(self.forms[0].version),
                "url": f"/api/v1/mobile-form/{self.forms[0].id}",
            },
        )
