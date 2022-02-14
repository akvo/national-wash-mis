# Create your views here.
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from api.v1.v1_forms.models import Forms
from api.v1.v1_forms.serializers import ListFormSerializer, \
    FormDetailSerializer


@extend_schema(responses={200: ListFormSerializer(many=True)},
               tags=['Form'])
@api_view(['GET'])
def list_form(request, version):
    return Response(
        ListFormSerializer(instance=Forms.objects.all(), many=True).data,
        status=status.HTTP_200_OK)


@extend_schema(responses={200: FormDetailSerializer},
               tags=['Form'])
@api_view(['GET'])
def form_details(request, version, pk):
    instance = get_object_or_404(Forms, pk=pk)
    return Response(FormDetailSerializer(instance=instance).data,
                    status=status.HTTP_200_OK)
