from django.urls import path, re_path

from . import views

urlpatterns = [
    path("office/events/", views.events),
    path("office/state/", views.snapshot),
    path("office/status/", views.status),
    re_path(r"^(?P<path>(?!office/|ws/).*)$", views.frontend),
]
