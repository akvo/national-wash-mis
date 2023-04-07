import pandas as pd
import json
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema,
    inline_serializer,
    OpenApiParameter,
)
from rest_framework import serializers, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.v1.v1_categories.models import DataCategory
from nwmis.settings import MASTER_DATA


def validate_number(q, answer):
    aw = float(answer[0])
    op = q.get("number")
    ok = False
    if "greater_than" in op:
        ok = aw > op.get("greater_than")
    if "less_than" in op:
        ok = aw < op.get("less_than")
    if "equal" in op:
        ok = aw == op.get("equal")
    if "greater_than_equal" in op:
        ok = aw >= op.get("greater_than_equal")
    if "less_than_equal" in op:
        ok = aw <= op.get("less_than_equal")
    return ok


def get_valid_list(opt, c, category):
    validator = [q["id"] for q in c["questions"]]
    valid = []
    exit = False
    for q in c["questions"]:
        if exit:
            continue
        answer = opt.get(str(q["id"]))
        if not answer:
            opt.update({str(q["id"]): None})
            continue
        if q.get("number"):
            is_valid = validate_number(q, answer)
            if is_valid:
                valid.append(q["id"])
            else:
                elses = q.get("else")
                category = elses.get("name")
                exit = True
        if q.get("options"):
            if len(set(q["options"]).intersection(answer)):
                valid.append(q["id"])
            # TODO Merge else with above
            else:
                if q.get("else"):
                    elses = q.get("else")
                    if elses.get("name"):
                        category = elses.get("name")
                        exit = True
                    if elses.get("ignore"):
                        validator = list(
                            filter(
                                lambda x: x not in elses.get("ignore"),
                                validator,
                            ))
                        valid.append(q["id"])
                if q.get("other"):
                    for o in q.get("other"):
                        if len(set(o["options"]).intersection(answer)):
                            exit = True
                            if len(o.get("questions")):
                                category = get_valid_list(opt, o, category)
                            else:
                                category = o.get("name")
    if len(valid) >= len(validator):
        conditions = [v if v in valid else False for v in validator]
        conditions = list(filter(lambda x: x is not False, conditions))
        if sorted(conditions) == sorted(validator):
            category = c["name"]
    if sorted(valid) == sorted(validator):
        category = c["name"]
    return category


def get_category(opt: dict):
    file_config = f"{MASTER_DATA}/config/category.json"
    with open(file_config) as config_file:
        configs = json.load(config_file)
    category = False
    for config in configs:
        for c in config["categories"]:
            category = get_valid_list(opt, c, category)
    return category


def get_results(data):
    categories = [d.serialize for d in data]
    df = pd.DataFrame(categories)
    results = df.to_dict("records")
    for d in results:
        d.update({"category": get_category(d["opt"])})
    res = pd.DataFrame(results)
    res = pd.concat(
        [res.drop("opt", axis=1),
         pd.DataFrame(df["opt"].tolist())], axis=1)
    res = res[[
        "id",
        "data",
        "form",
        "name",
        "category",
    ]]
    return res.to_dict("records")


@extend_schema(
    description="""
    Get datapoints with computed category
    """,
    responses={
        (200, "application/json"):
        inline_serializer(
            "ListDataCategorizedPaginated",
            fields={
                "current":
                serializers.IntegerField(),
                "total":
                serializers.IntegerField(),
                "total_page":
                serializers.IntegerField(),
                "data":
                inline_serializer("ListDataCategorized",
                                  fields={"test": serializers.IntegerField()},
                                  many=True),
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
    data = DataCategory.objects.all()
    data = get_results(data)
    return Response(data, status=status.HTTP_200_OK)


# Create your views here.
