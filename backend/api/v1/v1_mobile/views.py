from rest_framework.decorators import api_view
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from .serializers import MobileAssignmentFormsSerializer, PasscodeSerializer
from .models import MobileAssignment
from utils.custom_helper import CustomPasscode


@extend_schema(
    request=PasscodeSerializer,
    responses={200: MobileAssignmentFormsSerializer},
    tags=["Mobile Form"],
    summary="To get list of mobile forms",
    description="To get list of mobile forms",
)
@api_view(["POST"])
def get_mobile_forms(request, version):
    validator = PasscodeSerializer(data=request.data)
    if not validator.is_valid():
        return Response(
            {"error": validator.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    passcode = CustomPasscode().encode(request.data.get("code"))
    mobile_assignment = MobileAssignment.objects.get(passcode=passcode)
    if not mobile_assignment:
        return Response(
            {"error": "Passcode is not valid"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    serializer = MobileAssignmentFormsSerializer(mobile_assignment)
    return Response(serializer.data, status=status.HTTP_200_OK)
