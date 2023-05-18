"""nwmis URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import re_path, path, include
from drf_spectacular.views import SpectacularSwaggerView, SpectacularAPIView

urlpatterns = [
    path("api/", include("api.v1.v1_users.urls"), name="v1_users"),
    path("api/", include("api.v1.v1_profile.urls"), name="v1_profile"),
    path("api/", include("api.v1.v1_forms.urls"), name="v1_forms"),
    path("api/", include("api.v1.v1_data.urls"), name="v1_data"),
    path("api/", include("api.v1.v1_jobs.urls"), name="v1_jobs"),
    path("api/", include("api.v1.v1_categories.urls"), name="v1_categories"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    re_path(
        r"api/gateway/",
        include("AkvoDjangoFormGateway.urls"),
        name="gateway",
    ),
    path(
        "api/doc/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"
    ),
]
