from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from api.v1.v1_forms.models import Forms, UserForms
from drf_spectacular.types import OpenApiTypes
from utils.custom_serializer_fields import CustomCharField
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_mobile.models import MobileAssignment
from utils.custom_helper import CustomPasscode


class MobileFormSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    version = serializers.CharField()
    url = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.URI)
    def get_url(self, obj):
        return f"/api/v1/device-form/{obj.id}"

    class Meta:
        model = Forms
        fields = ["id", "version", "url"]


class MobileAssignmentFormsSerializer(serializers.Serializer):
    syncToken = serializers.CharField(source="token", read_only=True)
    formsUrl = serializers.SerializerMethodField()
    code = CustomCharField(max_length=255, write_only=True)

    @extend_schema_field(MobileFormSerializer(many=True))
    def get_formsUrl(self, obj):
        user_forms = UserForms.objects.filter(user=obj.user)
        if obj.user.user_access.role == UserRoleTypes.super_admin:
            return MobileFormSerializer(Forms.objects.all(), many=True).data
        return MobileFormSerializer([form.form for form in user_forms], many=True).data

    def validate_code(self, value):
        passcode = CustomPasscode().encode(value)
        if not MobileAssignment.objects.filter(passcode=passcode).exists():
            raise serializers.ValidationError("Invalid passcode")
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data.pop('code', None)
        return data

    class Meta:
        fields = ["syncToken", "formsUrl", "code"]
