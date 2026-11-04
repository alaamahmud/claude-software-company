"""In-memory office state: last known status of every employee, per project."""
import json
import threading
import time
from collections import deque
from pathlib import Path

MAX_EVENTS = 60

_lock = threading.Lock()
_projects = {}


def _project(key):
    return _projects.setdefault(key or "", {
        "agents": {}, "events": deque(maxlen=MAX_EVENTS), "missions": {},
    })


def apply(event):
    """Fold one sanitized event into the state and return it with a timestamp."""
    event = {**event, "ts": time.time()}
    with _lock:
        proj = _project(event["project"])
        agents = proj["agents"]
        name = event["agent"]
        current = agents.get(name, {})
        kind = event["event"]

        if kind == "SubagentStart":
            agents[name] = {"state": "working", "action": "start", "agent_id": event["agent_id"]}
        elif kind == "SubagentStop":
            agents[name] = {"state": "done", "action": None, "agent_id": event["agent_id"]}
        elif kind == "PermissionRequest":
            agents[name] = {**current, "state": "waiting", "action": event.get("action")}
        elif kind == "PreToolUse":
            agents[name] = {**current, "state": "working", "action": event.get("action"),
                            "target": event.get("target")}
        agents[name]["ts"] = event["ts"]

        if event.get("mission"):
            proj["missions"][event["mission"]] = {"file": event["mission"], "by": name,
                                                  "ts": event["ts"]}
        proj["events"].appendleft(event)
    return event


def snapshot(key=None):
    with _lock:
        if key is None:
            return {k: _dump(v) for k, v in _projects.items()}
        return _dump(_project(key))


def known_projects():
    with _lock:
        return [k for k in _projects if k]


def read_status(project):
    """Read docs/00-management/status.json of a project the office has seen events from."""
    if project not in known_projects():
        return None
    path = Path(project) / "docs" / "00-management" / "status.json"
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def reset():
    with _lock:
        _projects.clear()


def _dump(proj):
    return {"agents": dict(proj["agents"]), "events": list(proj["events"]),
            "missions": list(proj["missions"].values())}
