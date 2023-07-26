import datetime
from django.db import models
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Access
from utils.custom_helper import generate_random_string, CustomJWT, CustomPasscode


class MobileAssignmentManager(models.Manager):
    def create_assignment(self, user, passcode=None):
        access = Access.objects.filter(user=user).first()
        token = CustomJWT().encode(
            {
                "id": user.id,
                "email": user.email,
                "created_at": format(datetime.datetime.now(), "%Y-%m-%d"),
                "administration_id": access.administration.id if access else None,
            }
        )
        if not passcode:
            passcode = generate_random_string(8)
        mobile_assignment = self.create(
            user=user, token=token, passcode=CustomPasscode().encode(passcode)
        )
        return mobile_assignment


class MobileAssignment(models.Model):
    passcode = models.CharField(max_length=256)
    user = models.OneToOneField(
        SystemUser, on_delete=models.CASCADE, related_name="mobile_assignments"
    )
    token = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_passcode(self, passcode):
        self.passcode = CustomPasscode().encode(passcode)

    def get_passcode(self):
        return self.passcode

    objects = MobileAssignmentManager()

    def __str__(self):
        return f"{self.token}"

    class Meta:
        db_table = "mobile_assignments"
        verbose_name = "Mobile Assignment"
        verbose_name_plural = "Mobile Assignments"
