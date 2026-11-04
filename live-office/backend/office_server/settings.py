"""Live office server. Local-only: listens on localhost and keeps state in memory."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get("OFFICE_SECRET_KEY", "live-office-local-only")
DEBUG = os.environ.get("OFFICE_DEBUG", "1") == "1"
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]"]

INSTALLED_APPS = [
    "daphne",
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "channels",
    "office",
]
MIDDLEWARE = [
    "django.middleware.common.CommonMiddleware",
]
ROOT_URLCONF = "office_server.urls"
ASGI_APPLICATION = "office_server.asgi.application"
CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
DATABASES = {}
TEMPLATES = []
STATIC_URL = "static/"
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Built React app (npm run build) is served from here when present.
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
