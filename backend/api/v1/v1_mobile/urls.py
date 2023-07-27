from django.urls import re_path
from .views import (
    get_mobile_forms,
    get_mobile_form_details,
    sync_pending_form_data,
)

urlpatterns = [
    re_path(r"^(?P<version>(v1))/device/auth", get_mobile_forms),
    re_path(
        r"^(?P<version>(v1))/device/form/(?P<form_id>[0-9]+)", get_mobile_form_details
    ),
    re_path(r"^(?P<version>(v1))/device/sync", sync_pending_form_data),
]
