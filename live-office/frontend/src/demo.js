// A scripted session for ?demo — lets you see the office without a running Claude Code session.
export const DEMO_PROJECT = "/demo/my-project";

const STAGES = ["planning", "analysis", "design", "development", "qa", "security", "docs", "release", "deploy"];

function status(stage, gates, progress, awaiting = null) {
  return {
    project: "my-project",
    stage,
    stages: STAGES,
    gates,
    awaiting_approval: awaiting,
    fix_cycle: 0,
    progress,
    updated_at: new Date().toISOString(),
  };
}

const P = { requirements: "approved", design: "approved", production: "pending" };

export function demoScript(emit, setStatus) {
  let t = 0;
  const steps = [];
  const at = (delay, fn) => steps.push([(t += delay), fn]);
  const ev = (event, agent, extra = {}) => () =>
    emit({ event, agent, project: DEMO_PROJECT, ts: Date.now() / 1000, ...extra });

  setStatus(status("development", P,
    { executive: 100, analysis: 100, design: 100, development: 35, qa: 10, security: 0, devops: 0, docs: 0, hr: 0 }));

  // Earlier stages already finished.
  ["project-manager", "analysis-lead", "systems-analyst", "design-lead", "database-designer", "api-designer", "ui-ux-designer", "cto"]
    .forEach((a) => at(0, ev("SubagentStop", a)));
  at(300, ev("PreToolUse", "ceo", { action: "delegate", target: "tech-lead", tool: "Agent" }));
  at(600, ev("SubagentStart", "tech-lead"));
  at(600, ev("PreToolUse", "tech-lead", { action: "read", tool: "Read" }));
  at(700, ev("SubagentStart", "backend-developer"));
  at(200, ev("SubagentStart", "frontend-developer"));
  at(200, ev("SubagentStart", "database-developer"));
  at(500, ev("PreToolUse", "backend-developer", { action: "write", tool: "Write" }));
  at(300, ev("PreToolUse", "frontend-developer", { action: "write", tool: "Edit" }));
  at(300, ev("PreToolUse", "database-developer", { action: "run", tool: "Bash" }));
  at(400, ev("SubagentStart", "qa-lead"));
  at(400, ev("PreToolUse", "qa-lead", { action: "write", tool: "Write" }));
  at(800, ev("PermissionRequest", "database-developer", { action: "run", tool: "Bash" }));
  at(600, () => setStatus(status("development", P,
    { executive: 100, analysis: 100, design: 100, development: 55, qa: 25, security: 0, devops: 0, docs: 0, hr: 10 },
    "مطور قواعد البيانات يطلب تشغيل: python manage.py migrate")));
  // A training mission.
  at(800, ev("PreToolUse", "ceo", { action: "delegate", target: "hr-lead", tool: "Agent" }));
  at(400, ev("SubagentStart", "hr-lead"));
  at(500, ev("PreToolUse", "hr-lead", { action: "write", tool: "Write", mission: "2026-11-04-code-reviewer-django-testing" }));
  at(700, ev("SubagentStart", "skill-author"));
  at(300, ev("PreToolUse", "skill-author", { action: "web", tool: "WebFetch" }));
  at(1800, ev("SubagentStop", "skill-author"));
  at(500, ev("SubagentStart", "skill-assessor"));
  at(300, ev("SubagentStop", "frontend-developer"));
  at(1400, ev("SubagentStop", "skill-assessor"));
  at(300, ev("PreToolUse", "backend-developer", { action: "run", tool: "Bash" }));
  return run(steps);
}

function run(steps) {
  const timers = steps.map(([ms, fn]) => setTimeout(fn, ms));
  return () => timers.forEach(clearTimeout);
}
