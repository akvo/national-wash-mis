from .serializers import UploadImagesSerializer
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from utils import storage
from utils.custom_serializer_fields import validate_serializers_message
from uuid import uuid4


def sanitize_filename(filename):
    return "_".join(filename.strip().split(" "))


@extend_schema(
    tags=["Files"],
    summary="Upload Images",
    request=UploadImagesSerializer,
    responses={
        (200, "application/json"): inline_serializer(
            "UploadImages", fields={"task_id": serializers.CharField()}
        )
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def upload_images(request, version):
    """
    Upload images
    """
    serializer = UploadImagesSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            validate_serializers_message(serializer.errors),
            status=status.HTTP_400_BAD_REQUEST,
        )
    file = request.FILES["file"]
    original_filename = "-".join(file.name.split(".")[:-1])
    original_filename = sanitize_filename(original_filename)
    extension = file.name.split(".")[-1]
    filename = f"{original_filename}-{uuid4()}.{extension}"
    temp_file = open(f"./tmp/{filename}", "wb+")
    for chunk in file.chunks():
        temp_file.write(chunk)
    temp_file.close()
    storage.upload(file=f"./tmp/{filename}", filename=filename, folder="images")
    return Response(
        {"message": "File uploaded successfully", "file": filename},
        status=status.HTTP_200_OK,
    )
