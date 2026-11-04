import json

import pytest
from channels.layers import get_channel_layer
from django.test import Client

from office import state
from office.sanitize import sanitize


@pytest.fixture(autouse=True)
def clean_state():
    state.reset()
    yield
    state.reset()


def post(client, payload):
    return client.post("/office/events/", data=json.dumps(payload),
                       content_type="application/json")


def test_endpoint_always_returns_204_without_body():
    client = Client()
    for body in ({"hook_event_name": "SubagentStart", "agent_type": "qa-lead"},
                 {"hook_event_name": "Unknown"}, "not-a-dict"):
        resp = post(client, body)
        assert resp.status_code == 204
        assert resp.content == b""
    resp = client.post("/office/events/", data=b"{broken", content_type="application/json")
    assert resp.status_code == 204


def test_sanitize_drops_sensitive_content():
    event = sanitize({
        "hook_event_name": "PreToolUse", "session_id": "s1", "cwd": "/p",
        "agent_id": "a1", "agent_type": "backend-developer", "tool_name": "Bash",
        "tool_input": {"command": "export PASSWORD=hunter2"},
        "transcript_path": "/secret/t.jsonl",
    })
    assert event == {"event": "PreToolUse", "session_id": "s1", "project": "/p",
                     "agent_id": "a1", "agent": "backend-developer", "tool": "Bash",
                     "action": "run"}
    assert "hunter2" not in json.dumps(event)


def test_main_session_defaults_to_ceo_and_delegation_target():
    event = sanitize({"hook_event_name": "PreToolUse", "cwd": "/p", "tool_name": "Agent",
                      "tool_input": {"subagent_type": "analysis-lead", "prompt": "secret"}})
    assert event["agent"] == "ceo"
    assert event["target"] == "analysis-lead"
    assert "prompt" not in event


def test_mission_file_detected_only_in_missions_dir():
    base = {"hook_event_name": "PreToolUse", "cwd": "/p", "tool_name": "Write",
            "agent_type": "hr-lead"}
    ok = sanitize({**base, "tool_input": {
        "file_path": "/p/docs/hr/missions/2026-11-04-code-reviewer-django-testing.md"}})
    assert ok["mission"] == "2026-11-04-code-reviewer-django-testing"
    for path in ("/p/docs/hr/training-register.md", "/p/docs/hr/missions/TEMPLATE.md",
                 "/other/docs/hr/missions/x.md"):
        assert "mission" not in sanitize({**base, "tool_input": {"file_path": path}})


def test_state_transitions():
    client = Client()
    common = {"cwd": "/p", "agent_id": "a1", "agent_type": "qa-lead"}
    post(client, {**common, "hook_event_name": "SubagentStart"})
    assert state.snapshot("/p")["agents"]["qa-lead"]["state"] == "working"
    post(client, {**common, "hook_event_name": "PermissionRequest", "tool_name": "Bash"})
    assert state.snapshot("/p")["agents"]["qa-lead"]["state"] == "waiting"
    post(client, {**common, "hook_event_name": "PreToolUse", "tool_name": "Read"})
    assert state.snapshot("/p")["agents"]["qa-lead"]["action"] == "read"
    post(client, {**common, "hook_event_name": "SubagentStop"})
    snap = client.get("/office/state/").json()["projects"]["/p"]
    assert snap["agents"]["qa-lead"]["state"] == "done"
    assert [e["event"] for e in snap["events"]][0] == "SubagentStop"


def test_status_only_for_known_projects(tmp_path):
    client = Client()
    (tmp_path / "docs" / "00-management").mkdir(parents=True)
    (tmp_path / "docs" / "00-management" / "status.json").write_text(
        json.dumps({"stage": "design"}), encoding="utf-8")
    assert client.get("/office/status/", {"project": str(tmp_path)}).status_code == 404
    post(client, {"hook_event_name": "SubagentStart", "cwd": str(tmp_path),
                  "agent_type": "ceo"})
    resp = client.get("/office/status/", {"project": str(tmp_path)})
    assert resp.status_code == 200 and resp.json()["stage"] == "design"


def test_event_is_broadcast():
    from asgiref.sync import async_to_sync
    layer = get_channel_layer()
    channel = async_to_sync(layer.new_channel)()
    async_to_sync(layer.group_add)("office", channel)
    post(Client(), {"hook_event_name": "SubagentStart", "cwd": "/p", "agent_type": "cto"})
    msg = async_to_sync(layer.receive)(channel)
    assert msg["type"] == "office.event"
    assert msg["event"]["agent"] == "cto"
