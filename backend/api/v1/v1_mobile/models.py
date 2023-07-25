import datetime
from django.db import models
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Access
from django.contrib.auth.hashers import make_password
from utils.custom_helper import generate_random_string, CustomJWT


class MobileAssignmentManager(models.Manager):
    def create_assignment(self, user, passcode=None):
        if not passcode:
            passcode = generate_random_string(8)
        access = Access.objects.filter(user=user).first()
        token = CustomJWT().encode({
            "id": user.id,
            "email": user.email,
            "created_at": format(datetime.datetime.now(), "%Y-%m-%d"),
            "administration_id": access.administration.id,
        })
        mobile_assignment = self.create(
            user=user,
            passcode=make_password(passcode),
            token=token
        )
        return mobile_assignment

    def update_passcode(self, user: SystemUser, passcode: str):
        mobile_assignment = self.get(user=user)
        mobile_assignment.passcode = make_password(passcode)
        mobile_assignment.save()
        return mobile_assignment


class MobileAssignment(models.Model):
    passcode = models.CharField(max_length=256)
    user = models.OneToOneField(
        SystemUser, on_delete=models.CASCADE, related_name="mobile_assignments"
    )
    token = models.CharField(max_length=256)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = MobileAssignmentManager()

    def __str__(self):
        return f"{self.passcode}"

    class Meta:
        db_table = "mobile_assignments"
        verbose_name = "Mobile Assignment"
        verbose_name_plural = "Mobile Assignments"
