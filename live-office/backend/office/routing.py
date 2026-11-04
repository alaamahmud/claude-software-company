from django.urls import path

from .consumers import OfficeConsumer

websocket_urlpatterns = [path("ws/office/", OfficeConsumer.as_asgi())]
