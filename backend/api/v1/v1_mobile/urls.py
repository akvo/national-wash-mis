from django.urls import re_path
from .views import get_mobile_forms

urlpatterns = [
    re_path(r'^(?P<version>(v1))/mobile-forms', get_mobile_forms),
]
