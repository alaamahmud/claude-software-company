import React, { useMemo } from "react";
import { DEPARTMENTS, ROSTER } from "./roster.js";
import { useOffice } from "./useOffice.js";

// ---- Scene geometry ---------------------------------------------------------
const W = 1080;
const X0 = 40;
const ROOM_W = 1000 / 3;
const FLOOR_H = 200;
const TOP = 90;
const STREET = TOP + 3 * FLOOR_H; // y of the ground line

// Column (0 = left) for each department. The path snakes right→left, left→right, right→left.
const LAYOUT = {
  executive: [2, 2], analysis: [2, 1], design: [2, 0],
  development: [1, 0], qa: [1, 1], security: [1, 2],
  devops: [0, 0], docs: [0, 1], hr: [0, 2],
};
const floorY = (f) => TOP + (2 - f) * FLOOR_H; // top edge of a floor
const roomX = (c) => X0 + c * ROOM_W;

const HEX = {
  pink: "#e8799b", blue: "#5b8def", purple: "#9b6ee0", green: "#43b581",
  yellow: "#e6b729", red: "#e05555", orange: "#ee8a3c", cyan: "#3cbcd0",
};

const STAGE_DEPT = {
  planning: "executive", analysis: "analysis", design: "design", development: "development",
  qa: "qa", security: "security", docs: "docs", release: "devops", deploy: "exit",
};
const STAGE_AR = {
  planning: "التخطيط", analysis: "التحليل", design: "التصميم", development: "التطوير",
  qa: "الجودة", security: "الأمن", docs: "التوثيق", release: "تجهيز الإصدار", deploy: "النشر",
};
const GATES = [
  { key: "requirements", ar: "بوابة المتطلبات", after: "analysis" },
  { key: "design", ar: "بوابة التصميم", after: "design" },
  { key: "production", ar: "بوابة النشر", after: "release" },
];
const DEFAULT_STAGES = Object.keys(STAGE_AR);

const ACTION_AR = {
  start: "بدأ العمل", read: "يقرأ ملفاً", write: "يكتب ملفاً", run: "يشغّل أمراً",
  search: "يبحث في الملفات", web: "يبحث في الويب", delegate: "يكلّف موظفاً",
  mcp: "يستخدم أداة متصلة", other: "يستخدم أداة",
};
const ACTION_ICON = {
  start: "💻", read: "📖", write: "✍️", run: "⚙️", search: "🔍", web: "🌐",
  delegate: "📨", mcp: "🔌", other: "🛠️",
};

const BY_NAME = Object.fromEntries(ROSTER.map((r) => [r.name, r]));

function roomCenter(dept) {
  const [f, c] = LAYOUT[dept];
  return [roomX(c) + ROOM_W / 2, floorY(f) + FLOOR_H - 40];
}

// Path waypoints in work-cycle order, with stair landings between floors.
function pathPoints() {
  const p = (d) => roomCenter(d);
  const yF = (f) => floorY(f) + FLOOR_H - 40;
  return [
    ["planning", p("executive")],
    ["analysis", p("analysis")],
    ["design", p("design")],
    [null, [X0 + 18, yF(2)]],
    [null, [X0 + 18, yF(1)]],
    ["development", p("development")],
    ["qa", p("qa")],
    ["security", p("security")],
    [null, [X0 + 1000 - 18, yF(1)]],
    [null, [X0 + 1000 - 18, yF(0)]],
    ["docs", p("docs")],
    ["release", p("devops")],
    ["deploy", [X0 - 10, yF(0)]],
    [null, [X0 + 40, STREET + 40]],
  ];
}

// ---- Derived state ----------------------------------------------------------
function missionEmployee(file) {
  let best = null;
  for (const r of ROSTER) {
    if (file.includes(`-${r.name}-`) && (!best || r.name.length > best.length)) best = r.name;
  }
  return best;
}

const MISSION_STEPS = [
  ["skill-author", "كتابة المنهج"],
  ["skill-assessor", "تصميم الاختبار"],
  ["@employee", "الاختبار العملي"],
  ["personnel-officer", "تسجيل المهارة"],
  ["hr-lead", "الشهادة"],
];

function missionProgress(mission, events) {
  const employee = missionEmployee(mission.file);
  const stopped = new Set(
    events.filter((e) => e.event === "SubagentStop" && e.ts >= mission.ts).map((e) => e.agent),
  );
  const steps = MISSION_STEPS.map(([who, label]) => ({
    label,
    done: stopped.has(who === "@employee" ? employee : who),
  }));
  return { employee, steps, finished: stopped.has("hr-lead") };
}

// ---- Scene pieces -----------------------------------------------------------
function Person({ x, y, color, state, action, lead, onMission, carrying, name }) {
  return (
    <g className="person" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <title>{name}</title>
      {/* body */}
      <rect x={-11} y={-34} width={22} height={26} rx={9} fill={color} />
      {/* head */}
      <circle cx={0} cy={-44} r={10} fill="#f2c9a0" stroke="#5a3d2b" strokeWidth={1} />
      <path d="M-10,-47 Q0,-60 10,-47" fill="#4a3426" />
      {lead && <text x={0} y={-58} textAnchor="middle" fontSize={11}>★</text>}
      {state === "waiting" && (
        <g className="hand">
          <line x1={9} y1={-28} x2={18} y2={-56} stroke="#f2c9a0" strokeWidth={5} strokeLinecap="round" />
          <text x={22} y={-60} fontSize={14}>✋</text>
        </g>
      )}
      {state === "working" && !onMission && (
        <g transform="translate(0,-74)">
          <rect x={-26} y={-14} width={52} height={22} rx={11} fill="#fff" stroke="#c9c2b6" />
          <text x={-12} y={2} fontSize={11} textAnchor="middle">{ACTION_ICON[action] || "💭"}</text>
          <circle className="dot d1" cx={4} cy={-3} r={2.4} fill="#777" />
          <circle className="dot d2" cx={11} cy={-3} r={2.4} fill="#777" />
          <circle className="dot d3" cx={18} cy={-3} r={2.4} fill="#777" />
        </g>
      )}
      {state === "done" && !onMission && (
        <g transform="translate(14,-60)">
          <circle r={9} fill="#2e9e5b" />
          <path d="M-4,0 L-1,3 L4,-3" stroke="#fff" strokeWidth={2} fill="none" />
        </g>
      )}
      {carrying && <rect x={10} y={-20} width={14} height={11} rx={2} fill="#8a5a2b" stroke="#5a3a1b" />}
    </g>
  );
}

function Desk({ x, y, away }) {
  return (
    <g>
      <rect x={x - 20} y={y - 18} width={40} height={6} fill="#a47148" />
      <rect x={x - 17} y={y - 12} width={4} height={12} fill="#7d5434" />
      <rect x={x + 13} y={y - 12} width={4} height={12} fill="#7d5434" />
      <rect x={x - 8} y={y - 30} width={16} height={11} rx={1.5} fill="#2d3340" />
      {away && (
        <g transform={`translate(${x - 18},${y - 54})`}>
          <rect width={36} height={18} fill="#fffbe6" stroke="#d6c58a" transform="rotate(-4)" />
          <text x={18} y={13} fontSize={9} textAnchor="middle" fill="#7a5d00">في إيفاد</text>
        </g>
      )}
    </g>
  );
}

const FURNITURE = {
  executive: "🏛️", analysis: "📋", design: "📐", development: "🖥️", qa: "🧪",
  security: "🛡️", devops: "🚀", docs: "📚", hr: "🎓",
};

function Room({ dept, lit, progress }) {
  const [f, c] = LAYOUT[dept];
  const x = roomX(c);
  const y = floorY(f);
  const color = HEX[DEPARTMENTS[dept].color];
  return (
    <g>
      <rect x={x} y={y} width={ROOM_W} height={FLOOR_H} fill={color} opacity={lit ? 0.28 : 0.1} />
      <rect x={x} y={y} width={ROOM_W} height={FLOOR_H} fill="none" stroke="#5b4636" strokeWidth={3} />
      {/* wall window + furniture glyph */}
      <rect x={x + 18} y={y + 18} width={46} height={34} rx={3} fill={lit ? "#fff4c2" : "#3a4256"} stroke="#5b4636" />
      <text x={x + ROOM_W - 26} y={y + 42} fontSize={22} textAnchor="middle">{FURNITURE[dept]}</text>
      <text x={x + ROOM_W / 2} y={y + 32} textAnchor="middle" fontSize={15} fontWeight="700" fill="var(--ink)">
        {DEPARTMENTS[dept].ar}
      </text>
      {/* per-department progress */}
      <rect x={x + ROOM_W / 2 - 50} y={y + 42} width={100} height={6} rx={3} fill="#0002" />
      <rect x={x + ROOM_W / 2 - 50} y={y + 42} width={(progress || 0)} height={6} rx={3} fill={color} />
      {/* floor slab */}
      <rect x={x} y={y + FLOOR_H - 10} width={ROOM_W} height={10} fill="#8c6f56" />
      {!lit && <rect x={x} y={y} width={ROOM_W} height={FLOOR_H} fill="#0b1020" opacity={0.35} />}
    </g>
  );
}

function GateSign({ x, y, label, state }) {
  const ok = state === "approved";
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-42} y={-12} width={84} height={22} rx={4} fill={ok ? "#e7f6ec" : "#fdecec"} stroke={ok ? "#2e9e5b" : "#c94040"} />
      <text x={0} y={4} fontSize={10} textAnchor="middle" fill="#222">{ok ? "✔ " : "🔒 "}{label}</text>
    </g>
  );
}

function Building({ data, status, missions }) {
  const agents = data.agents;
  const stages = status?.stages || DEFAULT_STAGES;
  const stage = status?.stage;
  const stageIdx = stages.indexOf(stage);
  const gates = status?.gates || {};
  const progress = status?.progress || {};

  const onMission = new Map();
  for (const m of missions) if (!m.finished && m.employee) onMission.set(m.employee, m);

  // Employee positions: own desk, or the training room while on a mission.
  const people = [];
  const desks = [];
  const litDepts = new Set();
  let trainee = 0;
  for (const dept of Object.keys(LAYOUT)) {
    const staff = ROSTER.filter((r) => r.dept === dept);
    const [f, c] = LAYOUT[dept];
    const baseY = floorY(f) + FLOOR_H - 10;
    staff.forEach((r, i) => {
      const dx = roomX(c) + (ROOM_W / (staff.length + 1)) * (i + 1);
      const a = agents[r.name] || {};
      const away = onMission.has(r.name);
      if (a.state || away) litDepts.add(dept);
      desks.push(<Desk key={`d-${r.name}`} x={dx} y={baseY} away={away} />);
      let px = dx;
      let py = baseY - 12;
      if (away) {
        const [hf, hc] = LAYOUT.hr;
        px = roomX(hc) + 34 + trainee * 26;
        py = floorY(hf) + FLOOR_H - 62;
        trainee += 1;
        litDepts.add("hr");
      }
      people.push(
        <Person key={r.name} x={px} y={py} name={`${r.title} (${r.name})`}
          color={HEX[DEPARTMENTS[dept].color]} state={away ? "working" : a.state}
          action={a.action} lead={r.lead} onMission={away} carrying={away} />,
      );
    });
  }
  if (stageIdx >= 0 && STAGE_DEPT[stage] !== "exit") litDepts.add(STAGE_DEPT[stage]);

  // Golden project path.
  const pts = pathPoints();
  const doneUntil = pts.findIndex(([s]) => s === stage);
  const solid = doneUntil >= 0 ? pts.slice(0, doneUntil + 1) : [pts[0]];
  const dashed = doneUntil >= 0 ? pts.slice(doneUntil) : pts;
  const toD = (arr) => arr.map(([, [x, y]], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const filePos = doneUntil >= 0 ? pts[doneUntil][1] : pts[0][1];
  const released = gates.production === "approved" && stage === "deploy";

  return (
    <svg viewBox={`0 0 ${W} 780`} className="scene" role="img" aria-label="مبنى الشركة">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky1)" />
          <stop offset="1" stopColor="var(--sky2)" />
        </linearGradient>
      </defs>
      <rect width={W} height={780} fill="url(#sky)" />
      {/* roof */}
      <polygon points={`${X0 - 20},${TOP} ${X0 + 500},${TOP - 62} ${X0 + 1020},${TOP}`} fill="#9c4f3a" stroke="#5b2f22" strokeWidth={3} />
      <text x={X0 + 500} y={TOP - 18} textAnchor="middle" fontSize={18} fontWeight="700" fill="#fff">شركة البرمجيات</text>
      {/* street */}
      <rect x={0} y={STREET} width={W} height={780 - STREET} fill="#6b6f76" />
      <rect x={0} y={STREET + 44} width={W} height={4} fill="#f2f2f2" strokeDasharray="20 16" />
      {Object.keys(LAYOUT).map((d) => (
        <Room key={d} dept={d} lit={litDepts.has(d)} progress={progress[d]} />
      ))}
      {/* stairs */}
      {[[X0 + 4, 1], [X0 + 1000 - 32, 0]].map(([sx, f]) => (
        <g key={f}>{[0, 1, 2, 3, 4, 5].map((k) => (
          <rect key={k} x={sx} y={floorY(f) - 6 + k * 14} width={28} height={6} fill="#7a5c45" />
        ))}</g>
      ))}
      {desks}
      <path d={toD(solid)} stroke="#e0b100" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={toD(dashed)} stroke="#e0b100" strokeWidth={3} strokeDasharray="6 8" fill="none" opacity={0.8} />
      {people}
      {/* gates */}
      <GateSign x={roomX(1)} y={floorY(2) + 76} label="المتطلبات" state={gates.requirements} />
      <GateSign x={X0 + 70} y={floorY(1) - 4} label="التصميم" state={gates.design} />
      <GateSign x={X0 + 50} y={floorY(0) + 76} label="النشر" state={gates.production} />
      {/* launch flag */}
      <g transform={`translate(${X0 + 10},${STREET + 34})`}>
        <line x1={0} y1={0} x2={0} y2={-46} stroke="#333" strokeWidth={3} />
        <path d="M0,-46 L30,-38 L0,-30 Z" fill={released ? "#2e9e5b" : "#999"} />
      </g>
      {/* project file token */}
      <g className="token" style={{ transform: `translate(${filePos[0]}px, ${filePos[1] - 8}px)` }}>
        <rect x={-13} y={-17} width={26} height={30} rx={3} fill="#fff8dc" stroke="#b58900" strokeWidth={2} />
        <path d="M-7,-8 H7 M-7,-2 H7 M-7,4 H3" stroke="#b58900" strokeWidth={2} />
      </g>
    </svg>
  );
}

// ---- Sidebar ----------------------------------------------------------------
function Sidebar({ data, status, missions, connected, demo }) {
  const stages = status?.stages || DEFAULT_STAGES;
  const stage = status?.stage;
  const gates = status?.gates || {};
  const waiting = Object.entries(data.agents).filter(([, a]) => a.state === "waiting");
  const onMission = new Set(missions.filter((m) => !m.finished).map((m) => m.employee));

  const counts = { working: 0, waiting: 0, done: 0, mission: 0, idle: 0 };
  for (const r of ROSTER) {
    if (onMission.has(r.name)) counts.mission += 1;
    else counts[data.agents[r.name]?.state || "idle"] += 1;
  }
  const COUNT_AR = { working: "يعمل", waiting: "ينتظر موافقتك", done: "أنجز", mission: "في إيفاد", idle: "متاح" };

  return (
    <aside className="side">
      <div className="conn">
        <span className={`led ${connected ? "on" : ""}`} />
        {demo ? "وضع العرض التجريبي" : connected ? "متصل بالجلسة" : "غير متصل — شغّل الخادم"}
      </div>

      <section>
        <h2>المرحلة الحالية</h2>
        <ol className="stages">
          {stages.map((s, i) => {
            const cur = stages.indexOf(stage);
            const cls = i < cur ? "past" : i === cur ? "now" : "";
            const gate = GATES.find((g) => g.after === s);
            return (
              <React.Fragment key={s}>
                <li className={cls}>{STAGE_AR[s] || s}</li>
                {gate && (
                  <li className={`gate ${gates[gate.key] === "approved" ? "ok" : ""}`}>
                    {gates[gate.key] === "approved" ? "✔" : "🔒"} {gate.ar}
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
        {!status && <p className="muted">لا يوجد docs/00-management/status.json بعد.</p>}
      </section>

      {(status?.awaiting_approval || waiting.length > 0) && (
        <section className="approve">
          <h2>✋ مطلوب موافقتك</h2>
          {status?.awaiting_approval && <p>{status.awaiting_approval}</p>}
          {waiting.map(([name, a]) => (
            <p key={name}><b>{BY_NAME[name]?.title || name}</b> — {ACTION_AR[a.action] || "طلب صلاحية"}</p>
          ))}
          <p className="muted">وافق أو ارفض من نافذة Claude Code.</p>
        </section>
      )}

      {missions.length > 0 && (
        <section>
          <h2>🎓 الإيفاد</h2>
          {missions.map((m) => (
            <div key={m.file} className="mission">
              <b>{BY_NAME[m.employee]?.title || m.employee || m.file}</b>
              <ul>{m.steps.map((s) => <li key={s.label} className={s.done ? "ok" : ""}>{s.done ? "✔" : "○"} {s.label}</li>)}</ul>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2>توزيع الموظفين</h2>
        <div className="counts">
          {Object.entries(counts).map(([k, v]) => (
            <div key={k} className={`count ${k}`}><b>{v}</b><span>{COUNT_AR[k]}</span></div>
          ))}
        </div>
      </section>

      <section>
        <h2>آخر الأحداث</h2>
        <ul className="log">
          {data.events.slice(0, 14).map((e, i) => (
            <li key={`${e.ts}-${i}`}>
              <b>{BY_NAME[e.agent]?.title || e.agent}</b>{" "}
              {e.event === "SubagentStart" ? "بدأ العمل"
                : e.event === "SubagentStop" ? "أنجز ✔"
                  : e.event === "PermissionRequest" ? "ينتظر موافقتك ✋"
                    : e.mission ? "فتح ملف إيفاد 🎓"
                      : e.action === "delegate" && e.target ? `يكلّف ${BY_NAME[e.target]?.title || e.target}`
                        : ACTION_AR[e.action] || e.tool}
            </li>
          ))}
          {data.events.length === 0 && <li className="muted">لا أحداث بعد.</li>}
        </ul>
      </section>
    </aside>
  );
}

export default function App() {
  const office = useOffice();
  const { data, status } = office;
  const missions = useMemo(
    () => data.missions.map((m) => ({ ...m, ...missionProgress(m, data.events) })),
    [data],
  );
  return (
    <div className="app">
      <header>
        <h1>المكتب الحي</h1>
        {office.projects.length > 1 && !office.demo && (
          <select value={office.project || ""} onChange={(e) => office.setProject(e.target.value)}>
            {office.projects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        {office.project && <code className="proj">{office.project}</code>}
      </header>
      <main>
        <Building data={data} status={status} missions={missions} />
        <Sidebar data={data} status={status} missions={missions} connected={office.connected} demo={office.demo} />
      </main>
    </div>
  );
}
