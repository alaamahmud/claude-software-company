import json

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from . import state
from .consumers import GROUP
from .sanitize import sanitize


@csrf_exempt
@require_POST
def events(request):
    """Hook endpoint. Always answers 204 with no body so it never changes a session decision."""
    try:
        payload = json.loads(request.body or b"{}")
    except ValueError:
        payload = None
    event = sanitize(payload)
    if event is not None:
        event = state.apply(event)
        layer = get_channel_layer()
        if layer is not None:
            async_to_sync(layer.group_send)(GROUP, {"type": "office.event", "event": event})
    return HttpResponse(status=204)


@require_GET
def snapshot(request):
    return JsonResponse({"projects": state.snapshot()})


@require_GET
def status(request):
    project = request.GET.get("project", "")
    data = state.read_status(project)
    if data is None:
        return JsonResponse({"error": "unknown project or missing status.json"}, status=404)
    return JsonResponse(data)


@require_GET
def frontend(request, path=""):
    dist = settings.FRONTEND_DIST
    target = (dist / path).resolve() if path else dist / "index.html"
    if path and (not str(target).startswith(str(dist.resolve())) or not target.is_file()):
        target = dist / "index.html"
    if not target.is_file():
        raise Http404("Build the frontend first: cd live-office/frontend && npm run build")
    return FileResponse(open(target, "rb"))
