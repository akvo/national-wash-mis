from django.test import TestCase
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
from django.core.management import call_command
from django.contrib.auth.hashers import check_password


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

    def test_create_mobile_assignment_without_passcode(self):
        from api.v1.v1_mobile.models import MobileAssignment

        # Test without passcode
        mobile_assignment = MobileAssignment.objects.create_assignment(user=self.user)
        self.assertEqual(mobile_assignment.user, self.user)
        self.assertTrue(mobile_assignment.passcode.startswith("pbkdf2_sha256"))
        passcode_check = check_password("test1234", mobile_assignment.passcode)
        self.assertFalse(passcode_check)
        self.assertTrue(
            mobile_assignment.token.startswith("eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9")
        )

    def test_create_mobile_assignment_with_passcode(self):
        import datetime
        from api.v1.v1_mobile.models import MobileAssignment
        from utils.custom_helper import CustomJWT

        # Test with passcode
        mobile_assignment = MobileAssignment.objects.create_assignment(
            user=self.user, passcode="passcode1234"
        )
        self.assertEqual(mobile_assignment.user, self.user)
        passcode_check = check_password("passcode1234", mobile_assignment.passcode)
        self.assertTrue(passcode_check)
        decoded_token = CustomJWT().decode(mobile_assignment.token)
        self.assertEqual(
            {
                "id": self.user.id,
                "email": self.user.email,
                "created_at": format(datetime.datetime.now(), "%Y-%m-%d"),
                "administration_id": self.administration.id,
            },
            decoded_token,
        )

    def test_update_mobile_assignment_passcode(self):

        # Test update passcode
        from api.v1.v1_mobile.models import MobileAssignment

        mobile_assignment = MobileAssignment.objects.create_assignment(
            user=self.user, passcode="passcode1234"
        )
        self.assertEqual(mobile_assignment.user, self.user)
        passcode_check = check_password("passcode1234", mobile_assignment.passcode)
        self.assertTrue(mobile_assignment.passcode.startswith("pbkdf2_sha256"))
        self.assertTrue(passcode_check)

        # Update passcode
        mobile_assignment = MobileAssignment.objects.update_passcode(
            user=self.user, passcode="newpasscode1234"
        )
        self.assertTrue(mobile_assignment.passcode.startswith("pbkdf2_sha256"))
        passcode_check = check_password("newpasscode1234", mobile_assignment.passcode)
        self.assertTrue(passcode_check)
