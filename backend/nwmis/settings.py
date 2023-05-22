"""
Django settings for nwmis project.

Generated by 'django-admin startproject' using Django 4.0.1.

For more information on this file, see
https://docs.djangoproject.com/en/4.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.0/ref/settings/
"""
from datetime import timedelta
from os import path, environ
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = environ["DJANGO_SECRET"]
LOG_FILE = environ.get("LOG_FILE") or "error.log"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True if "DEBUG" in environ else False
PROD = True if "PROD" in environ else False

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
        "file": {
            "class": "logging.handlers.WatchedFileHandler",
            "filename": f"./{LOG_FILE}",
            "level": "ERROR",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "ERROR",
            "propagate": True,
        },
        "nwmis": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": True,
        },
    },
    "formatters": {
        "verbose": {"format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"},
    },
}

ALLOWED_HOSTS = ["*"]

# Application definition

# Default django apps
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

# Add third party apps below
EXTERNAL_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "drf_spectacular",
    "django_dbml",
    "django_extensions",
    "django_q",
    "cli",
]

# Add API apps below
API_APPS = [
    "api.v1.v1_users",
    "api.v1.v1_profile",
    "api.v1.v1_forms",
    "api.v1.v1_data",
    "api.v1.v1_categories",
    "api.v1.v1_jobs",
    "AkvoDjangoFormGateway",
]

INSTALLED_APPS = DJANGO_APPS + API_APPS + EXTERNAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "middleware.user_activity.UserActivity",
    "middleware.logger.ErrorLoggingMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
]

ROOT_URLCONF = "nwmis.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [Path.joinpath(BASE_DIR, "nwmis/templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "nwmis.wsgi.application"

# Rest Settings
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning",
    "DATE_FORMAT": "%d-%m-%Y",
    "DEFAULT_VERSION": "v1",
    "DATETIME_FORMAT": "%d-%m-%Y %H:%M:%S",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "PAGE_SIZE": 10,
}
SPECTACULAR_SETTINGS = {
    "TITLE": "RUSH",
    "DESCRIPTION": "",
    "VERSION": "1.0.0",
    "SORT_OPERATIONS": False,
    "COMPONENT_SPLIT_REQUEST": True,
}
# JWT Config
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=12),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=10),
}
# Database
# https://docs.djangoproject.com/en/4.0/ref/settings/#databases
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": environ["NWMIS_INSTANCE"],
        "USER": environ["DB_USER"],
        "PASSWORD": environ["DB_PASSWORD"],
        "HOST": environ["DB_HOST"],
        "PORT": "5432",
    }
}

# Password validation
# https://docs.djangoproject.com/en/4.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation"
        ".UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation" ".MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation" ".CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation" ".NumericPasswordValidator",
    },
]

# Internationalization
# https://docs.djangoproject.com/en/4.0/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

# For Caching API call
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.filebased.FileBasedCache",
        "LOCATION": "/var/tmp/cache",
        "TIMEOUT": 300,
    }
}
CACHE_FOLDER = "/tmp/cache/"

# Default primary key field type
# https://docs.djangoproject.com/en/4.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "v1_users.SystemUser"

INSTANCE = environ["NWMIS_INSTANCE"]
MASTER_DATA = f"./source/{INSTANCE}"

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.0/howto/static-files/

STATIC_URL = "/static-files/"

STATICFILES_DIRS = [f"{MASTER_DATA}/assets/"]

STATIC_ROOT = path.join(BASE_DIR, "staticfiles")

# Static files whitenoise
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

FORM_GEO_VALUE = {
    "default": {"lat": 9.145, "lng": 40.4897},
    "kenya": {"lat": 9.145, "lng": 40.4897},
    "burkina-faso": {"lat": 12.246, "lng": -1.5525},
}

BUCKET_NAME = "nwmis"
FAKE_STORAGE = False

EMAIL_BACKEND = "django_mailjet.backends.MailjetBackend"
MAILJET_API_KEY = environ["MAILJET_APIKEY"]
MAILJET_API_SECRET = environ["MAILJET_SECRET"]
EMAIL_FROM = environ.get("EMAIL_FROM") or "noreply@akvo.org"

Q_CLUSTER = {
    "name": "DjangORM",
    "workers": 4,
    "timeout": 90,
    "retry": 120,
    "queue_limit": 50,
    "bulk": 10,
    "orm": "default",
}

# TWILIO_ACCOUNT
TWILIO_ACCOUNT_SID = environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = environ.get("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = environ.get("TWILIO_PHONE_NUMBER")
