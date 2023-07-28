import os
import mimetypes
from nwmis.settings import MASTER_DATA, BASE_DIR
from drf_spectacular.utils import extend_schema
from django.http import HttpResponse
from rest_framework import status, serializers
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import inline_serializer
from .serializers import MobileAssignmentFormsSerializer
from .models import MobileAssignment
from api.v1.v1_forms.models import Forms
from api.v1.v1_profile.models import Access
from api.v1.v1_forms.serializers import WebFormDetailSerializer
from api.v1.v1_data.serializers import SubmitPendingFormSerializer
from utils.custom_helper import CustomPasscode
from utils.default_serializers import DefaultResponseSerializer
from utils.custom_serializer_fields import validate_serializers_message


@extend_schema(
    request=MobileAssignmentFormsSerializer,
    responses={200: MobileAssignmentFormsSerializer},
    tags=["Mobile Device Form"],
    summary="To get list of mobile forms",
    description="To get list of mobile forms",
)
@api_view(["POST"])
def get_mobile_forms(request, version):
    code = request.data.get("code")
    serializer = MobileAssignmentFormsSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"error": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        passcode = CustomPasscode().encode(code)
        mobile_assignment = MobileAssignment.objects.get(passcode=passcode)
    except MobileAssignment.DoesNotExist:
        return Response(
            {"error": "Mobile Assignment not found."},
            status=status.HTTP_404_NOT_FOUND,
        )
    serializer = MobileAssignmentFormsSerializer(mobile_assignment)
    return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    responses={200: WebFormDetailSerializer},
    tags=["Mobile Device Form"],
    summary="To get form in mobile form format",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_mobile_form_details(request, version, form_id):
    instance = get_object_or_404(Forms, pk=form_id)
    instance = WebFormDetailSerializer(
        instance=instance, context={"user": request.user}
    ).data
    return Response(instance, status=status.HTTP_200_OK)


@extend_schema(
    request=inline_serializer(
        name="SyncDeviceFormData",
        fields={
            "formId": serializers.IntegerField(),
            "name": serializers.CharField(),
            "duration": serializers.IntegerField(),
            "submittedAt": serializers.DateTimeField(),
            "submitter": serializers.CharField(),
            "geo": serializers.ListField(child=serializers.IntegerField()),
            "answers": serializers.ListField(child=serializers.DictField()),
        },
    ),
    responses={200: DefaultResponseSerializer},
    tags=["Mobile Device Form"],
    summary="Submit pending form data",
)
@api_view(["POST"])
def sync_pending_form_data(request, version):
    form = get_object_or_404(Forms, pk=request.data.get("formId"))
    user = request.user
    administration = Access.objects.filter(user=user).first().administration
    answers = []
    qna = request.data.get("answers")
    for q in qna:
        answers.append({"question": q, "value": qna[q]})
    data = {
        "data": {
            "administration": administration.id,
            "name": request.data.get("name"),
            "geo": request.data.get("geo"),
        },
        "answer": answers,
    }
    serializer = SubmitPendingFormSerializer(
        data=data, context={"user": request.user, "form": form}
    )
    if not serializer.is_valid():
        return Response(
            {
                "message": validate_serializers_message(serializer.errors),
                "details": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    serializer.save()
    return Response({"message": "ok"}, status=status.HTTP_200_OK)


@extend_schema(tags=["Mobile Device Form"], summary="Get SQLITE File")
@api_view(["GET"])
def download_sqlite_file(request, version, file_name):
    file_path = os.path.join(BASE_DIR, MASTER_DATA, f"{file_name}")

    # Make sure the file exists and is accessible
    if not os.path.exists(file_path):
        return HttpResponse(
            {"message": "File not found."}, status=status.HTTP_404_NOT_FOUND
        )

    # Get the file's content type
    content_type, _ = mimetypes.guess_type(file_path)

    # Read the file content into a variable
    with open(file_path, "rb") as file:
        file_content = file.read()

    # Create the response and set the appropriate headers
    response = HttpResponse(file_content, content_type=content_type)
    response["Content-Length"] = os.path.getsize(file_path)
    response["Content-Disposition"] = "attachment; filename=%s" % file_name
    return response
