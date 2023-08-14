import os

import logging
import pandas as pd
from django.utils import timezone
from django_q.tasks import async_task

from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_forms.models import Forms, Questions, FormApprovalAssignment
from api.v1.v1_jobs.constants import JobStatus, JobTypes
from api.v1.v1_jobs.models import Jobs
from api.v1.v1_jobs.seed_data import seed_excel_data, org_seed_excel_data
from api.v1.v1_jobs.validate_upload import validate
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_data.models import PendingDataBatch, PendingDataApproval
from utils import storage
from utils.email_helper import send_email, EmailTypes
from utils.export_form import generate_definition_sheet
from utils.functions import update_date_time_format
from utils.storage import upload

logger = logging.getLogger(__name__)


def download(form: Forms, administration_ids):
    filter_data = {}
    if administration_ids:
        filter_data["administration_id__in"] = administration_ids
    data = form.form_form_data.filter(**filter_data).order_by("-id")
    return [d.to_data_frame for d in data]


def rearrange_columns(col_names: list, col_question: list):
    if len(col_question) == len(col_names):
        return col_question
    col_names = [
        "id",
        "created_at",
        "created_by",
        "updated_at",
        "updated_by",
        "datapoint_name",
        "administration",
        "geolocation",
    ] + col_question
    return col_names


def job_generate_download(job_id, **kwargs):
    job = Jobs.objects.get(pk=job_id)
    file_path = "./tmp/{0}".format(job.result)
    if os.path.exists(file_path):
        os.remove(file_path)
    administration_ids = False
    administration_name = "All Administration Level"
    if kwargs.get("administration"):
        administration = Administration.objects.get(pk=kwargs.get("administration"))
        if administration.path:
            filter_path = "{0}{1}.".format(administration.path, administration.id)
        else:
            filter_path = f"{administration.id}."
        administration_ids = list(
            Administration.objects.filter(path__startswith=filter_path).values_list(
                "id", flat=True
            )
        )
        administration_ids.append(administration.id)

        administration_name = list(
            Administration.objects.filter(path__startswith=filter_path).values_list(
                "name", flat=True
            )
        )
    form = Forms.objects.get(pk=job.info.get("form_id"))
    data = download(form=form, administration_ids=administration_ids)
    df = pd.DataFrame(data)
    questions = (
        Questions.objects.filter(form=form)
        .order_by("question_group__order", "order")
        .all()
    )
    col_question = ["{0}|{1}".format(q.id, q.name) for q in questions]
    for cq in col_question:
        if cq not in list(df):
            df[cq] = ""
    col_names = rearrange_columns(list(df), col_question)
    df = df[col_names]
    writer = pd.ExcelWriter(file_path, engine="xlsxwriter")
    df.to_excel(writer, sheet_name="data", index=False)

    definitions = generate_definition_sheet(form=form)
    definitions.to_excel(writer, sheet_name="definitions", startrow=-1)
    administration = job.user.user_access.administration
    if administration.path:
        allowed_path = f"{administration.path}{administration.id}."
    else:
        allowed_path = f"{administration.id}."
    allowed_descendants = Administration.objects.filter(
        path__startswith=allowed_path, level=Levels.objects.order_by("-level").first()
    ).order_by("level__level")
    admins = []
    for descendant in allowed_descendants:
        parents = list(
            Administration.objects.filter(id__in=descendant.path.split(".")[:-1])
            .values_list("name", flat=True)
            .order_by("level__level")
        )
        parents.append(descendant.name)
        admins.append("|".join(parents))

    v = pd.DataFrame(admins)
    v.to_excel(
        writer, sheet_name="administration", startrow=-1, header=False, index=False
    )
    context = [
        {"context": "Form Name", "value": form.name},
        {"context": "Download Date", "value": update_date_time_format(job.created)},
        {
            "context": "Administration",
            "value": ",".join(administration_name)
            if isinstance(administration_name, list)
            else administration_name,
        },
    ]

    context = pd.DataFrame(context).groupby(["context", "value"], sort=False).first()
    context.to_excel(writer, sheet_name="context", startrow=0, header=False)
    workbook = writer.book
    worksheet = writer.sheets["context"]
    f = workbook.add_format(
        {
            "align": "left",
            "bold": False,
            "border": 0,
        }
    )
    worksheet.set_column("A:A", 20, f)
    worksheet.set_column("B:B", 30, f)
    merge_format = workbook.add_format(
        {
            "bold": True,
            "border": 1,
            "align": "center",
            "valign": "vcenter",
            "fg_color": "#45add9",
            "color": "#ffffff",
        }
    )
    worksheet.merge_range("A1:B1", "Context", merge_format)
    writer.save()
    url = upload(file=file_path, folder="download")
    return url


def job_generate_download_result(task):
    job = Jobs.objects.get(task_id=task.id)
    job.attempt = job.attempt + 1
    if task.success:
        job.status = JobStatus.done
        job.available = timezone.now()
    else:
        job.status = JobStatus.failed
    job.save()


def seed_data_job(job_id, batch=None, completed=0):
    logger.error("============================")
    logger.error("Seed data job started")
    chunksize = 100
    res = None
    job = Jobs.objects.get(pk=job_id)
    try:
        # create batch
        is_super_admin = job.user.user_access.role == UserRoleTypes.super_admin
        if not is_super_admin and not batch:
            form_id = job.info.get("form")
            batch = PendingDataBatch.objects.create(
                form_id=form_id,
                administration_id=job.info.get("administration"),
                user=job.user,
                name=job.info.get("file"),
            )
        # EOL need to move this
        res, file = seed_excel_data(
            job=job, batch=batch, completed=completed, chunksize=chunksize
        )
        res = len(res) if isinstance(res, list) else res
        job.attempt = job.attempt + 1
        # run async task for next chunk
        if isinstance(res, int) and job.completed != job.total:
            logger.error("LOG - True condition")
            # update job with completed rows
            completed = res + job.completed
            job.completed = completed
            job.status = JobStatus.chunk
            job.save()
            # run another job
            async_task(
                "api.v1.v1_jobs.job.seed_data_job",
                job_id=job.id,
                completed=completed,
                batch=batch,
            )
        else:
            logger.error("LOG - False condition")
            # run result job
            os.remove(file)
            async_task(
                "api.v1.v1_jobs.job.seed_data_job_result",
                job_id=job.id,
                batch=batch,
                completed=job.completed,
                success=True,
            )
        return True
    except Exception as e:
        logger.error(f"LOG - Exception: {e}")
        # TODO:
        # send technical error notification email to akvo
        form_id = job.info.get("form")
        form = Forms.objects.filter(pk=int(form_id)).first()
        context = {
            "send_to": ["tech.consultancy@akvo.org", "galih@akvo.org"],
            "form": form.name,
            "user": "Akvo Tech Consultancy",
            "listing": [
                {
                    "name": "Upload Date",
                    "value": job.created.strftime("%m-%d-%Y, %H:%M:%S"),
                },
                {"name": "Questionnaire", "value": form.name},
                {"name": "Number of Records Completed", "value": completed},
                {
                    "name": "Total of Records Remaining",
                    "value": job.completed - job.total,
                },
                {"name": "Total Rows of Records", "value": job.total},
                {"name": "Error detail", "value": e},
            ],
        }
        send_email(context=context, type=EmailTypes.seed_error)
        async_task(
            "api.v1.v1_jobs.job.seed_data_job_result",
            job_id=job.id,
            batch=batch,
            completed=job.completed,
            success=False,
        )
        return False


def seed_data_job_result(job_id, completed, success, batch):
    logger.error(f"LOG - seed data job result => success: {success}")
    job = Jobs.objects.get(pk=job_id)
    form_id = job.info.get("form")
    job.attempt = job.attempt + 1
    # check if completed data is 0
    is_super_admin = job.user.user_access.role == UserRoleTypes.super_admin
    if success and completed == 0:
        form = Forms.objects.filter(pk=int(form_id)).first()
        context = {
            "send_to": [job.user.email],
            "form": form.name,
            "user": job.user,
            "listing": [
                {
                    "name": "Upload Date",
                    "value": job.created.strftime("%m-%d-%Y, %H:%M:%S"),
                },
                {"name": "Questionnaire", "value": form.name},
                {"name": "Number of Records", "value": completed},
            ],
        }
        send_email(context=context, type=EmailTypes.unchanged_data)
        if not is_super_admin:
            batch.delete()
        job.save()
        return None
    # email pending batch to approver
    if success and not is_super_admin:
        path = "{0}{1}".format(batch.administration.path, batch.administration_id)
        for administration in Administration.objects.filter(id__in=path.split(".")):
            assignment = FormApprovalAssignment.objects.filter(
                form_id=batch.form_id, administration=administration
            ).first()
            if assignment:
                level = assignment.user.user_access.administration.level_id
                PendingDataApproval.objects.create(
                    batch=batch, user=assignment.user, level_id=level
                )
                submitter = f"{job.user.name}, {job.user.designation_name}"
                context = {
                    "send_to": [assignment.user.email],
                    "listing": [
                        {"name": "Batch Name", "value": batch.name},
                        {"name": "Questionnaire", "value": batch.form.name},
                        {"name": "Number of Records", "value": completed},
                        {
                            "name": "Submitter",
                            "value": submitter,
                        },
                    ],
                }
                send_email(context=context, type=EmailTypes.pending_approval)
    # success
    form_id = job.info.get("form")
    form = Forms.objects.filter(pk=int(form_id)).first()
    if success:
        is_super_admin = job.user.user_access.role == UserRoleTypes.super_admin
        job.status = JobStatus.done
        job.available = timezone.now()
        subject = (
            "New Data Uploaded"
            if is_super_admin
            else "New Request @{0}".format(job.user.get_full_name())
        )
        data = {
            "subject": subject,
            "title": "New Data Submission",
            "send_to": [job.user.email],
            "listing": [
                {
                    "name": "Upload Date",
                    "value": job.created.strftime("%m-%d-%Y, %H:%M:%S"),
                },
                {"name": "Questionnaire", "value": form.name},
                {"name": "Number of Records", "value": completed},
            ],
            "is_super_admin": is_super_admin,
        }
        send_email(context=data, type=EmailTypes.new_request)
    else:
        job.status = JobStatus.failed
        # send seed error notification email to user
        context = {
            "send_to": [job.user.email],
            "form": form.name,
            "user": job.user,
            "listing": [
                {
                    "name": "Upload Date",
                    "value": job.created.strftime("%m-%d-%Y, %H:%M:%S"),
                },
                {"name": "Questionnaire", "value": form.name},
                {"name": "Number of Records Completed", "value": completed},
                {
                    "name": "Total of Records Remaining",
                    "value": job.completed - job.total,
                },
                {"name": "Total Rows of Records", "value": job.total},
            ],
        }
        send_email(context=context, type=EmailTypes.seed_error)
    job.save()


def validate_excel(job_id):
    job = Jobs.objects.get(pk=job_id)
    storage.download(f"upload/{job.info.get('file')}")
    data, total_data = validate(
        job.info.get("form"),
        job.info.get("administration"),
        f"./tmp/{job.info.get('file')}",
    )
    # add total rows of data to job
    job.total = total_data
    job.save()

    if len(data):
        form_id = job.info.get("form")
        form = Forms.objects.filter(pk=int(form_id)).first()
        file = job.info.get("file")
        df = pd.read_excel(f"./tmp/{file}", sheet_name="data")
        error_list = pd.DataFrame(data)
        error_list = error_list[list(filter(lambda x: x != "error", list(error_list)))]
        error_file = f"./tmp/error-{job_id}.csv"
        error_list.to_csv(error_file, index=False)
        data = {
            "send_to": [job.user.email],
            "listing": [
                {
                    "name": "Upload Date",
                    "value": job.created.strftime("%m-%d-%Y, %H:%M:%S"),
                },
                {"name": "Questionnaire", "value": form.name},
                {"name": "Number of Records", "value": df.shape[0]},
            ],
        }
        send_email(
            context=data,
            type=EmailTypes.upload_error,
            path=error_file,
            content_type="text/csv",
        )
        return False
    return total_data or True


def validate_excel_result(task):
    job = Jobs.objects.get(task_id=task.id)
    job.attempt = job.attempt + 1
    if task.result:
        job.status = JobStatus.done
        job.available = timezone.now()
        job.save()
        new_job = Jobs.objects.create(
            result=job.info.get("file"),
            type=JobTypes.seed_data,
            status=JobStatus.on_progress,
            user=job.user,
            info={
                "file": job.info.get("file"),
                "form": job.info.get("form"),
                "administration": job.info.get("administration"),
                "ref_job_id": job.id,
            },
            total=(task.result if isinstance(task.result, (int)) else None),
            completed=0,
        )
        task_id = async_task(
            "api.v1.v1_jobs.job.seed_data_job",
            job_id=new_job.id,
        )
        new_job.task_id = task_id
        new_job.save()
    else:
        job.status = JobStatus.failed
        job.save()


# Original function
def org_seed_data_job(job_id):
    try:
        job = Jobs.objects.get(pk=job_id)
        org_seed_excel_data(job)
    except Exception:
        return False
    return True


# Original function
def org_seed_data_job_result(task):
    job = Jobs.objects.get(task_id=task.id)
    job.attempt = job.attempt + 1
    is_super_admin = job.user.user_access.role == UserRoleTypes.super_admin
    if task.result:
        job.status = JobStatus.done
        job.available = timezone.now()
        form_id = job.info.get("form")
        form = Forms.objects.filter(pk=int(form_id)).first()
        file = job.info.get("file")
        storage.download(f"upload/{file}")
        df = pd.read_excel(f"./tmp/{file}", sheet_name="data")
        subject = (
            "New Data Uploaded"
            if is_super_admin
            else "New Request @{0}".format(job.user.get_full_name())
        )
        data = {
            "subject": subject,
            "title": "New Data Submission",
            "send_to": [job.user.email],
            "listing": [
                {
                    "name": "Upload Date",
                    "value": job.created.strftime("%m-%d-%Y, %H:%M:%S"),
                },
                {"name": "Questionnaire", "value": form.name},
                {"name": "Number of Records", "value": df.shape[0]},
            ],
            "is_super_admin": is_super_admin,
        }
        send_email(context=data, type=EmailTypes.new_request)
    else:
        job.status = JobStatus.failed
    job.save()


# Original function
def org_validate_excel(job_id):
    job = Jobs.objects.get(pk=job_id)
    storage.download(f"upload/{job.info.get('file')}")
    data, total_data = validate(
        job.info.get("form"),
        job.info.get("administration"),
        f"./tmp/{job.info.get('file')}",
    )

    if len(data):
        form_id = job.info.get("form")
        form = Forms.objects.filter(pk=int(form_id)).first()
        file = job.info.get("file")
        df = pd.read_excel(f"./tmp/{file}", sheet_name="data")
        error_list = pd.DataFrame(data)
        error_list = error_list[list(filter(lambda x: x != "error", list(error_list)))]
        error_file = f"./tmp/error-{job_id}.csv"
        error_list.to_csv(error_file, index=False)
        data = {
            "send_to": [job.user.email],
            "listing": [
                {
                    "name": "Upload Date",
                    "value": job.created.strftime("%m-%d-%Y, %H:%M:%S"),
                },
                {"name": "Questionnaire", "value": form.name},
                {"name": "Number of Records", "value": df.shape[0]},
            ],
        }
        send_email(
            context=data,
            type=EmailTypes.upload_error,
            path=error_file,
            content_type="text/csv",
        )
        return False
    return True


# Original function
def org_validate_excel_result(task):
    job = Jobs.objects.get(task_id=task.id)
    job.attempt = job.attempt + 1
    if task.result:
        job.status = JobStatus.done
        job.available = timezone.now()
        job.save()
        new_job = Jobs.objects.create(
            result=job.info.get("file"),
            type=JobTypes.seed_data,
            status=JobStatus.on_progress,
            user=job.user,
            info={
                "file": job.info.get("file"),
                "form": job.info.get("form"),
                "administration": job.info.get("administration"),
                "ref_job_id": job.id,
            },
        )
        task_id = async_task(
            "api.v1.v1_jobs.job.org_seed_data_job",
            new_job.id,
            hook="api.v1.v1_jobs.job.org_seed_data_job_result",
        )
        new_job.task_id = task_id
        new_job.save()
    else:
        job.status = JobStatus.failed
        job.save()
