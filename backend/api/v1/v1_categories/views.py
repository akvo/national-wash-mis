from math import ceil
from django.http import Http404
from django.core.paginator import Paginator
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema,
    inline_serializer,
    OpenApiParameter,
)
from rest_framework.generics import get_object_or_404
from rest_framework import serializers, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from utils.custom_serializer_fields import validate_serializers_message

from api.v1.v1_categories.functions import get_category_results
from api.v1.v1_categories.models import DataCategory
from api.v1.v1_data.models import Answers
from api.v1.v1_forms.models import Forms
from api.v1.v1_data.serializers import (
    ListFormDataRequestSerializer,
    ListRawDataSerializer,
    ListRawDataAnswerSerializer,
)


@extend_schema(
    description="""
    Get datapoints with computed category
    """,
    responses={
        (200, "application/json"): inline_serializer(
            "ListDataCategorizedPaginated",
            fields={
                "current": serializers.IntegerField(),
                "total": serializers.IntegerField(),
                "total_page": serializers.IntegerField(),
                "data": inline_serializer(
                    "ListDataCategorized",
                    fields={"test": serializers.IntegerField()},
                    many=True,
                ),
            },
        )
    },
    parameters=[
        OpenApiParameter(
            name="page",
            required=True,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
    ],
    tags=["Data Categories"],
    summary="Get datapoints with computed category",
)
@api_view(["GET"])
def get_data_with_category(request, version, form_id):
    data = DataCategory.objects.filter(form_id=form_id).all()
    if not len(data):
        print(data)
        raise Http404("DataCategory does not exist")
    paginator = Paginator(data, 10)
    page = request.GET.get("page")
    page_obj = paginator.get_page(page)
    results = get_category_results(page_obj)
    return Response(
        {
            "current": int(page),
            "total": data.count(),
            "total_page": ceil(data.count() / int(page)),
            "data": results,
        },
        status=status.HTTP_200_OK,
    )


@extend_schema(
    description="""
    Get Multi-purpose schema of datapoints to use with third party applications
    """,
    responses={200: ListRawDataSerializer(many=True)},
    parameters=[
        OpenApiParameter(
            name="questions",
            required=False,
            type={"type": "array", "items": {"type": "number"}},
            location=OpenApiParameter.QUERY,
        )
    ],
    tags=["Data Categories"],
    summary="Get Raw data points",
)
@api_view(["GET"])
# @permission_classes([IsAuthenticated])
def get_raw_data_point(request, version, form_id):
    form = get_object_or_404(Forms, pk=form_id)
    serializer = ListFormDataRequestSerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(
            {"message": validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    instance = form.form_form_data.order_by("-created").all()
    data = ListRawDataSerializer(
        instance=instance,
        context={"questions": serializer.validated_data.get("questions")},
        many=True,
    ).data
    filter_data = {}
    if request.GET.get("questions"):
        filter_data["question_id__in"] = request.GET.getlist("questions")
    for d in data:
        filter_data["data_id"] = d["id"]
        instance = Answers.objects.filter(**filter_data).all()
        answers = ListRawDataAnswerSerializer(instance=instance, many=True).data
        data_answers = {}
        for a in answers:
            data_answers.update({a["question"]: a["value"]})
        d.update({"data": data_answers})
    return Response(data, status=status.HTTP_200_OK)
