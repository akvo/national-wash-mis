import json
import os

from django.core.management import BaseCommand

from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_forms.models import Forms
from api.v1.v1_forms.models import QuestionGroup as QG
from api.v1.v1_forms.models import Questions
from api.v1.v1_forms.models import QuestionOptions as QO


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("-t",
                            "--test",
                            nargs="?",
                            const=1,
                            default=False,
                            type=int)

    def handle(self, *args, **options):
        test = options.get("test")
        source_folder = './source/forms/'
        source_files = [
            f"{source_folder}{json_file}"
            for json_file in os.listdir(source_folder)
        ]
        source_files = list(
            filter(lambda x: "example" in x
                   if test else "example" not in x, source_files))
        # Forms.objects.all().delete()
        for source in source_files:
            json_form = open(source, 'r')
            json_form = json.load(json_form)
            form = Forms.objects.filter(id=json_form["id"]).first()
            if not form:
                form = Forms.objects.create(id=json_form["id"],
                                            name=json_form["form"],
                                            version=1,
                                            type=json_form["type"])
            else:
                form.name = json_form["form"]
                form.version = 2
                form.type = json_form["type"]
                form.save()
            for qg in json_form["question_groups"]:
                question_group, created = QG.objects.update_or_create(
                    name=qg["question_group"],
                    form=form,
                    defaults={
                        "name": qg["question_group"],
                        "form": form
                    })
                if created:
                    question_group.save()
                for qi, q in enumerate(qg["questions"]):
                    question = Questions.objects.filter(id=q.get("id")).first()
                    if not question:
                        question = Questions.objects.create(
                            id=q.get("id"),
                            name=q["question"],
                            text=q["question"],
                            form=form,
                            order=qi,
                            meta=q.get("meta"),
                            question_group=question_group,
                            rule=q.get("rule"),
                            required=q.get("required"),
                            dependency=q.get("dependency"),
                            type=getattr(QuestionTypes, q["type"]),
                        )
                    else:
                        question.name = q["question"]
                        question.text = q["question"]
                        question.order = qi
                        question.meta = q.get("meta")
                        question.rule = q.get("rule")
                        question.required = q.get("required")
                        question.dependency = q.get("dependency")
                        question.type = getattr(QuestionTypes, q["type"])
                        question.save()
                    if q.get("options"):
                        for o in q.get("options"):
                            option, created = QO.objects.update_or_create(
                                name=o["name"],
                                question=question,
                                defaults={
                                    "name": o["name"],
                                    "question": question
                                })
                            if created:
                                option.save()
