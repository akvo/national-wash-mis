from django.urls import re_path
from .views import (
    get_mobile_forms,
    get_mobile_form_details,
)

urlpatterns = [
    re_path(r"^(?P<version>(v1))/device-forms", get_mobile_forms),
    re_path(
        r"^(?P<version>(v1))/device-form/(?P<form_id>[0-9]+)", get_mobile_form_details
    ),
]
