import { useEffect, useRef, useState } from "react";
import { demoScript, DEMO_PROJECT } from "./demo.js";

const MAX_EVENTS = 60;

function emptyProject() {
  return { agents: {}, events: [], missions: [] };
}

/** Same folding rules as the server's office/state.py, applied to live events. */
export function applyEvent(projects, ev) {
  const key = ev.project || "";
  const proj = projects[key] ? { ...projects[key] } : emptyProject();
  const agents = { ...proj.agents };
  const cur = agents[ev.agent] || {};
  if (ev.event === "SubagentStart") agents[ev.agent] = { state: "working", action: "start" };
  else if (ev.event === "SubagentStop") agents[ev.agent] = { state: "done", action: null };
  else if (ev.event === "PermissionRequest") agents[ev.agent] = { ...cur, state: "waiting", action: ev.action };
  else if (ev.event === "PreToolUse")
    agents[ev.agent] = { ...cur, state: "working", action: ev.action, target: ev.target };
  agents[ev.agent].ts = ev.ts;
  proj.agents = agents;
  proj.events = [ev, ...proj.events].slice(0, MAX_EVENTS);
  if (ev.mission && !proj.missions.some((m) => m.file === ev.mission)) {
    proj.missions = [...proj.missions, { file: ev.mission, by: ev.agent, ts: ev.ts }];
  }
  return { ...projects, [key]: proj };
}

export function useOffice() {
  const demo = new URLSearchParams(window.location.search).has("demo");
  const [projects, setProjects] = useState({});
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState(null);
  const lastActive = useRef(null);

  // Live events over WebSocket (or the scripted demo).
  useEffect(() => {
    if (demo) {
      setConnected(true);
      return demoScript(
        (ev) => setProjects((p) => applyEvent(p, ev)),
        (s) => setStatus(s),
      );
    }
    let ws;
    let retry;
    let closed = false;
    const open = () => {
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${proto}://${window.location.host}/ws/office/`);
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (!closed) retry = setTimeout(open, 2000);
      };
      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.type === "snapshot") setProjects(data.projects || {});
        else if (data.type === "event") setProjects((p) => applyEvent(p, data.event));
      };
    };
    open();
    return () => {
      closed = true;
      clearTimeout(retry);
      ws && ws.close();
    };
  }, [demo]);

  // Follow the most recently active project unless the viewer picked one.
  const keys = Object.keys(projects).filter(Boolean);
  let newest = null;
  let newestTs = -1;
  for (const k of keys) {
    const ts = projects[k].events[0]?.ts ?? 0;
    if (ts > newestTs) {
      newestTs = ts;
      newest = k;
    }
  }
  lastActive.current = newest;
  const project = selected && projects[selected] ? selected : newest;

  // status.json is polled: the CEO edits it with Write/Edit after each stage.
  useEffect(() => {
    if (demo || !project) return undefined;
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch(`/office/status/?project=${encodeURIComponent(project)}`);
        if (!stop) setStatus(r.ok ? await r.json() : null);
      } catch {
        if (!stop) setStatus(null);
      }
    };
    load();
    const id = setInterval(load, 3000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [project, demo]);

  return {
    demo,
    connected,
    projects: keys,
    project: demo ? DEMO_PROJECT : project,
    setProject: setSelected,
    data: projects[demo ? DEMO_PROJECT : project] || emptyProject(),
    status,
  };
}
