from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import get_object_or_404
from .serializers import MobileAssignmentFormsSerializer
from .models import MobileAssignment
from api.v1.v1_forms.models import Forms
from api.v1.v1_forms.serializers import WebFormDetailSerializer
from utils.custom_helper import CustomPasscode


@extend_schema(
    request=MobileAssignmentFormsSerializer,
    responses={200: MobileAssignmentFormsSerializer},
    tags=["Mobile Device Form"],
    summary="To get list of mobile forms",
    description="To get list of mobile forms",
)
@api_view(["POST"])
def get_mobile_forms(request, version):
    code = request.data.get('code')
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


# @extend_schema(responses={200: WebFormDetailSerializer},
#                tags=["Mobile Device Form"],
#                summary='To get form in mobile form format')
# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_mobile_form_details(request, version, form_id):
#     token = request.data.get('token')
#     print(token)
#     instance = get_object_or_404(Forms, pk=form_id)
#     instance = WebFormDetailSerializer(
#             instance=instance,
#             context={'user': request.user}).data
#     return Response(instance, status=status.HTTP_200_OK)
