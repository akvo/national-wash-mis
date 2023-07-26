from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from api.v1.v1_forms.models import Forms, UserForms
from drf_spectacular.types import OpenApiTypes
from utils.custom_serializer_fields import CustomCharField
from api.v1.v1_profile.constants import UserRoleTypes


class MobileFormSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    version = serializers.CharField()
    url = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.URI)
    def get_url(self, obj):
        return f"/api/v1/mobile-form/{obj.id}"

    class Meta:
        model = Forms
        fields = ["id", "version", "url"]


class MobileAssignmentFormsSerializer(serializers.Serializer):
    syncToken = serializers.CharField(source="token")
    formsUrl = serializers.SerializerMethodField()

    @extend_schema_field(MobileFormSerializer(many=True))
    def get_formsUrl(self, obj):
        user_forms = UserForms.objects.filter(user=obj.user)
        if obj.user.user_access.role == UserRoleTypes.super_admin:
            return MobileFormSerializer(Forms.objects.all(), many=True).data
        return MobileFormSerializer([form.form for form in user_forms], many=True).data

    class Meta:
        fields = ["token", "formsUrl"]


class PasscodeSerializer(serializers.Serializer):
    code = CustomCharField()
