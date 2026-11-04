"""Turn a raw Claude Code hook payload into a small event with nothing sensitive in it.

Only identifiers and a coarse action survive: no file contents, no prompts, no command text,
no full paths (except the file name of a new HR mission, which the office animates).
"""
from pathlib import PurePath

ACCEPTED_EVENTS = {"SubagentStart", "SubagentStop", "PreToolUse", "PermissionRequest"}

TOOL_ACTIONS = {
    "Read": "read", "Glob": "search", "Grep": "search",
    "Write": "write", "Edit": "write", "NotebookEdit": "write",
    "Bash": "run", "PowerShell": "run",
    "WebSearch": "web", "WebFetch": "web",
    "Agent": "delegate", "Task": "delegate",
}

MISSIONS_DIR = ("docs", "hr", "missions")
MAIN_AGENT = "ceo"
MAX_ID = 128


def _short(value, limit=MAX_ID):
    if not isinstance(value, str):
        return None
    return value[:limit]


def _mission_file(tool_input, cwd):
    path = tool_input.get("file_path") if isinstance(tool_input, dict) else None
    if not isinstance(path, str):
        return None
    p = PurePath(path)
    if cwd and p.is_absolute():
        try:
            p = p.relative_to(cwd)
        except ValueError:
            return None
    parts = p.parts
    if len(parts) == 4 and parts[:3] == MISSIONS_DIR and parts[3].endswith(".md") \
            and parts[3] != "TEMPLATE.md":
        return parts[3][:-3][:MAX_ID]
    return None


def sanitize(payload):
    """Return a clean event dict, or None when the payload is not one the office shows."""
    if not isinstance(payload, dict):
        return None
    name = payload.get("hook_event_name")
    if name not in ACCEPTED_EVENTS:
        return None

    cwd = _short(payload.get("cwd"), 1024)
    agent_type = _short(payload.get("agent_type")) or MAIN_AGENT
    event = {
        "event": name,
        "session_id": _short(payload.get("session_id")),
        "project": cwd,
        "agent_id": _short(payload.get("agent_id")),
        "agent": agent_type,
    }

    if name in ("PreToolUse", "PermissionRequest"):
        tool = _short(payload.get("tool_name"), 64) or ""
        if tool.startswith("mcp__"):
            action = "mcp"
        else:
            action = TOOL_ACTIONS.get(tool, "other")
        event["tool"] = tool
        event["action"] = action
        tool_input = payload.get("tool_input") or {}
        if action == "delegate" and isinstance(tool_input, dict):
            event["target"] = _short(tool_input.get("subagent_type"))
        if action == "write":
            mission = _mission_file(tool_input, cwd)
            if mission:
                event["mission"] = mission
    return event
