import json
import re
from nwmis.settings import MASTER_DATA
from django.db import transaction, connection


@transaction.atomic
def refresh_data_category_views():
    with connection.cursor() as cursor:
        cursor.execute(
            """
            REFRESH MATERIALIZED VIEW data_category;
            """
        )


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
    exit_category = False
    for q in c["questions"]:
        if exit_category:
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
                exit_category = True
        if q.get("options"):
            if len(set(q["options"]).intersection(answer)):
                valid.append(q["id"])
            # TODO Merge else with above
            else:
                if q.get("else"):
                    elses = q.get("else")
                    if elses.get("name"):
                        category = elses.get("name")
                        exit_category = True
                    if elses.get("ignore"):
                        validator = list(
                            filter(
                                lambda x: x not in elses.get("ignore"),
                                validator,
                            )
                        )
                        valid.append(q["id"])
                if q.get("other"):
                    for o in q.get("other"):
                        if len(set(o["options"]).intersection(answer)):
                            exit_category = True
                            if len(o.get("questions")):
                                category = get_valid_list(opt, o, category)
                            else:
                                category = o.get("name")
    if len(valid) >= len(validator) and not exit_category:
        conditions = [v if v in valid else False for v in validator]
        conditions = list(filter(lambda x: x is not False, conditions))
        if sorted(conditions) == sorted(validator):
            category = c["name"]
    if sorted(valid) == sorted(validator) and not exit_category:
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


def get_category_results(data):
    categories = [d.serialize for d in data]
    for d in categories:
        d.update({"category": get_category(d["opt"])})
    categories = [
        {"id": c["data"], "category": {c["name"]: c["category"]}}
        for c in categories
    ]
    updated_data = {}
    for item in categories:
        if item["id"] in updated_data:
            updated_data[item["id"]]["category"].update(item["category"])
        else:
            updated_data[item["id"]] = item
    updated_data = list(updated_data.values())
    return updated_data


def get_category_by_lang(lang: str) -> dict:
    file_config = f"{MASTER_DATA}/config/category-trans.json"
    with open(file_config) as config_file:
        configs = json.load(config_file)
    return [
        {"key": key, "value": value[lang]}
        for key, value in configs.items()
        if lang in value
    ]


def get_category_trans(categories: dict, trans: list = []) -> dict:
    cs = {}
    for ck, cv in categories.items():
        cs[ck] = cv
        ts_key = re.sub(r'\s', "-", str(cv).lower())
        ts = list(filter(lambda ct: ct["key"] == ts_key, trans))
        if len(ts):
            cs[ck] = ts.pop().get("value", cv)
    return cs
