import { useMemo, useState } from "react";
import { useStorageSim, type StorageFault } from "@/lib/sim/storageStore";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip } from "recharts";
import { Check, X, RotateCcw, Play } from "lucide-react";

const STG = "#00aa44";
type Tab = "pid" | "startup" | "fault" | "inv";

export function StorageSimulators() {
  const [tab, setTab] = useState<Tab>("pid");
  const tabs: { k: Tab; l: string }[] = [
    { k: "pid", l: "PID Tuner" },
    { k: "startup", l: "Startup" },
    { k: "fault", l: "Fault Diag" },
    { k: "inv", l: "Inventory" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1 text-xs">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-1 min-w-fit rounded px-3 py-2 font-mono uppercase tracking-wider ${tab === t.k ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
            style={tab === t.k ? { background: STG } : undefined}>
            {t.l}
          </button>
        ))}
      </div>
      {tab === "pid" && <PIDTuner />}
      {tab === "startup" && <Startup />}
      {tab === "fault" && <FaultDiag />}
      {tab === "inv" && <Inventory />}
    </div>
  );
}

/* ---------------- PID Tuner ---------------- */
function PIDTuner() {
  const [Kp, setKp] = useState(1.5);
  const [Ki, setKi] = useState(0.2);
  const [Kd, setKd] = useState(0.3);
  const data = useMemo(() => simStep(Kp, Ki, Kd), [Kp, Ki, Kd]);
  const metrics = useMemo(() => calcMetrics(data), [data]);
  return (
    <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
      <div className="space-y-3 rounded-md border border-border bg-card p-3">
        <div className="font-mono text-[11px] uppercase tracking-widest" style={{ color: STG }}>LIC-301 · Tank Level → LV-301</div>
        <Slider l="Kp" v={Kp} set={setKp} min={0} max={5} step={0.1} />
        <Slider l="Ki" v={Ki} set={setKi} min={0} max={1} step={0.05} />
        <Slider l="Kd" v={Kd} set={setKd} min={0} max={0.8} step={0.05} />
        <div className="flex gap-1">
          <button onClick={() => { setKp(3.5); setKi(0.6); setKd(0.2); }} className="flex-1 rounded bg-muted px-2 py-1 text-[10px] hover:bg-accent">Aggressive</button>
          <button onClick={() => { setKp(1.5); setKi(0.2); setKd(0.3); }} className="flex-1 rounded bg-muted px-2 py-1 text-[10px] hover:bg-accent">Moderate</button>
          <button onClick={() => { setKp(0.6); setKi(0.05); setKd(0.4); }} className="flex-1 rounded bg-muted px-2 py-1 text-[10px] hover:bg-accent">Conservative</button>
        </div>
        <div className="space-y-1 rounded bg-background p-2 font-mono text-[11px]">
          <Row k="Overshoot" v={`${metrics.overshoot.toFixed(1)} %`} />
          <Row k="Settling" v={`${metrics.settling.toFixed(2)} s`} />
          <Row k="SS Error" v={`${metrics.ssErr.toFixed(3)}`} />
        </div>
      </div>
      <div className="rounded-md border border-border bg-card p-3">
        <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Step Response — Tank Level</div>
        <div className="h-80">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid stroke="#1f263a" strokeDasharray="3 3" />
              <XAxis dataKey="t" stroke="#5d6680" fontSize={10} />
              <YAxis stroke="#5d6680" fontSize={10} />
              <Tooltip contentStyle={{ background: "#0d111c", border: "1px solid #2a3148", fontSize: 11 }} />
              <ReferenceLine y={1} stroke="#666" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="y" stroke={STG} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function simStep(Kp: number, Ki: number, Kd: number) {
  const dt = 0.05, T = 20;
  let y = 0, dy = 0, i = 0, p = 0;
  const data: { t: number; y: number }[] = [];
  for (let t = 0; t <= T; t += dt) {
    const sp = 1;
    const e = sp - y;
    i += e * dt;
    const d = (e - p) / dt; p = e;
    const u = Kp * e + Ki * i + Kd * d;
    const ddy = u - 1.4 * dy - 1.6 * y;
    dy += ddy * dt; y += dy * dt;
    data.push({ t: +t.toFixed(2), y });
  }
  return data;
}

function calcMetrics(data: { t: number; y: number }[]) {
  const peak = Math.max(...data.map((d) => d.y));
  const overshoot = Math.max(0, (peak - 1) * 100);
  const final = data[data.length - 1].y;
  const ssErr = Math.abs(1 - final);
  let settling = data[data.length - 1].t;
  for (let i = data.length - 1; i >= 0; i--) {
    if (Math.abs(data[i].y - 1) > 0.02) { settling = data[i].t; break; }
  }
  return { overshoot, settling, ssErr };
}

function Slider({ l, v, set, min, max, step }: { l: string; v: number; set: (n: number) => void; min: number; max: number; step: number }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between font-mono text-[11px]">
        <span className="text-muted-foreground">{l}</span><span>{v.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(+e.target.value)} className="w-full" style={{ accentColor: STG }} />
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{k}</span><span style={{ color: STG }}>{v}</span></div>;
}

/* ---------------- Startup ---------------- */
const steps = [
  { l: "Verify all tank isolation valves closed", why: "Open valves on startup mean uncontrolled flow into a cold/empty system." },
  { l: "Check tank for free water (drain sump)", why: "Water bottoms can flash or freeze drain lines; must be removed first." },
  { l: "Open inlet manifold valve slowly (10%)", why: "A snap-open shocks pipework and over-pressures gauges." },
  { l: "Inspect all flanges for leaks", why: "Catch leaks at low flow, before full inventory is at risk." },
  { l: "Gradually open tank inlet MOV-141 to 100%", why: "Throttling lets the level controller stabilise before full demand." },
  { l: "Monitor tank level rise (max 5%/hr)", why: "Rapid filling generates static electricity — fire/explosion risk." },
  { l: "Start crude transfer pump P-301", why: "Pump must only run after suction (tank) is verified full and vented." },
  { l: "Verify metering station MS-301 reading", why: "Custody-transfer meter must read before any export begins." },
  { l: "Open export isolation valve XV-301", why: "Final isolation only opens once metering and pump are confirmed stable." },
  { l: "Confirm export flow at metering station", why: "Confirms physical flow matches what the meter reports." },
  { l: "Check S-301/S-302 pressure within limits", why: "Spheres must be in band before tying them to the export header." },
  { l: "Hand over to automatic LIC-301 control", why: "Only swap to AUTO once the loop is bumpless and the process is stable." },
];
function Startup() {
  const [order, setOrder] = useState<number[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const next = (i: number) => {
    if (i === order.length) {
      const o = [...order, i];
      setOrder(o); setErr(null);
      if (o.length === steps.length) setDone(true);
    } else setErr(`Wrong step. ${steps[order.length]?.why ?? ""}`);
  };
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Tank Farm Startup · 12 steps</div>
        <button onClick={() => { setOrder([]); setErr(null); setDone(false); }} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs hover:bg-accent">
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">Tap each step in the correct order. A wrong choice explains the danger.</p>
      <div className="space-y-2">
        {steps.map((st, i) => {
          const isDone = order.includes(i);
          return (
            <button key={i} onClick={() => next(i)} disabled={isDone}
              className={`flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition ${isDone ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]" : "border-border bg-background"}`}
              style={!isDone ? { borderColor: undefined } : undefined}>
              <span className="scada-value w-6 text-muted-foreground">#{i + 1}</span>
              <span className="flex-1">{st.l}</span>
              {isDone && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
      {err && <div className="mt-3 flex items-start gap-2 rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-xs text-[var(--danger)]"><X className="h-4 w-4 shrink-0" />{err}</div>}
      {done && <div className="mt-3 rounded-md border p-3 text-sm" style={{ borderColor: STG, background: `${STG}15`, color: STG }}>✓ Tank farm online — crude flowing to export.</div>}
    </div>
  );
}

/* ---------------- Fault Diagnosis ---------------- */
const faults: { id: StorageFault; label: string; symptoms: string[]; explain: string }[] = [
  {
    id: "lt_sensor",
    label: "LT-301 level sensor failure",
    symptoms: [
      "LI-301 reading frozen at fixed value",
      "No change in level despite inlet flow",
      "LV-301 not responding to controller",
      "Physical tank may actually be overfilling",
    ],
    explain: "The LT-301 transmitter has failed and is reporting a frozen value. LIC-301 sees no error, so LV-301 never opens — meanwhile real liquid keeps rising. Switch to MAN, verify with manual dip / radar gauge, replace the transmitter.",
  },
  {
    id: "psv_stuck",
    label: "PSV-301 stuck open on S-301",
    symptoms: [
      "S-301 pressure dropping continuously",
      "No export demand change occurred",
      "PV-301 fully closed, pressure still drops",
      "Gas release indication at PSV vent",
    ],
    explain: "PSV-301 lifted but failed to reseat — gas keeps venting to flare/atmosphere. Isolate the sphere, depressurise safely, replace or overhaul the relief valve.",
  },
  {
    id: "pump_cav",
    label: "P-301 pump cavitation",
    symptoms: [
      "Export crude flow unstable / fluctuating",
      "Pump discharge pressure oscillating",
      "FT-301 reading erratic",
      "Pump suction pressure very low",
    ],
    explain: "Suction pressure has dropped below the liquid's vapour pressure — vapour bubbles form at the impeller and collapse, eroding it. Reduce demand, raise tank level / open suction valve fully, check for plugged strainer.",
  },
];
function FaultDiag() {
  const [active, setActive] = useState<typeof faults[number] | null>(null);
  const [pick, setPick] = useState<string>("");
  const [result, setResult] = useState<null | { ok: boolean }>(null);
  const start = () => {
    const f = faults[Math.floor(Math.random() * faults.length)];
    setActive(f); setPick(""); setResult(null);
    useStorageSim.getState().injectFault(f.id);
  };
  const submit = () => {
    if (!active) return;
    const ok = pick === active.id;
    setResult({ ok });
    if (ok) useStorageSim.getState().injectFault("none");
  };
  return (
    <div className="space-y-3 rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Fault Diagnosis</div>
        <button onClick={start} className="inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-semibold text-white" style={{ background: STG }}>
          <Play className="h-3 w-3" /> Inject random fault
        </button>
      </div>
      {active && (
        <>
          <div className="rounded-md border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-3 text-xs">Fault active. Identify which device failed.</div>
          <div className="rounded-md border border-border bg-background p-3">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Symptoms</div>
            <ul className="space-y-1 text-xs">
              {active.symptoms.map((sy, i) => (
                <li key={i} className="flex gap-2"><span style={{ color: STG }}>•</span>{sy}</li>
              ))}
            </ul>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-foreground">I think the failed device is:</label>
            <select value={pick} onChange={(e) => setPick(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none">
              <option value="">— select —</option>
              {faults.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <button onClick={submit} disabled={!pick || !!result} className="w-full rounded py-2 text-sm font-semibold text-white disabled:opacity-40" style={{ background: STG }}>
            Submit diagnosis
          </button>
          {result && (
            <div className={`rounded-md border p-3 text-sm ${result.ok ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]" : "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]"}`}>
              <div className="mb-1 font-semibold">{result.ok ? "✓ Correct diagnosis" : "✗ Not quite"}</div>
              <div className="text-xs text-muted-foreground">{active.explain}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- Inventory Management ---------------- */
function Inventory() {
  const s = useStorageSim();
  const setInlet = useStorageSim((x) => x.setInlet);
  const setExp = useStorageSim((x) => x.setExportCrude);
  const net = s.inletFlow - s.exportCrude;
  let status: { color: string; msg: string };
  if (Math.abs(net) < 60 && s.tk301Level > 50 && s.tk301Level < 75) status = { color: STG, msg: "✅ Inventory balance optimal" };
  else if (net > 60) status = { color: "var(--warning)", msg: "⚠️ Tank filling rapidly — risk of overfill" };
  else status = { color: "var(--danger)", msg: "⚠️ Tank emptying — pump cavitation risk" };
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-3 rounded-md border border-border bg-card p-4">
        <div className="font-mono text-[11px] uppercase tracking-widest" style={{ color: STG }}>Operator Controls</div>
        <div>
          <div className="mb-0.5 flex justify-between font-mono text-xs"><span className="text-muted-foreground">Inlet flow</span><span>{s.inletFlow.toFixed(0)} m³/h</span></div>
          <input type="range" min={0} max={600} step={5} value={s.inletFlow} onChange={(e) => setInlet(+e.target.value)} className="w-full" style={{ accentColor: STG }} />
        </div>
        <div>
          <div className="mb-0.5 flex justify-between font-mono text-xs"><span className="text-muted-foreground">Export crude</span><span>{s.exportCrude.toFixed(0)} m³/h</span></div>
          <input type="range" min={0} max={400} step={5} value={s.exportCrude} onChange={(e) => setExp(+e.target.value)} className="w-full" style={{ accentColor: STG }} />
        </div>
        <div className="rounded bg-background p-3 font-mono text-xs">
          <div className="mb-1 text-muted-foreground">Balance</div>
          <div className="flex justify-between"><span>Inlet</span><span className="text-[var(--success)]">+{s.inletFlow.toFixed(0)} m³/h</span></div>
          <div className="flex justify-between"><span>Export</span><span className="text-[var(--danger)]">-{s.exportCrude.toFixed(0)} m³/h</span></div>
          <div className="mt-1 flex justify-between border-t border-border pt-1"><span>Net change</span><span style={{ color: net >= 0 ? STG : "var(--danger)" }}>{net >= 0 ? "+" : ""}{net.toFixed(0)} m³/h</span></div>
        </div>
        <div className="rounded p-3 text-center font-mono text-xs" style={{ background: `${status.color}20`, color: status.color }}>{status.msg}</div>
        <p className="text-[10px] text-muted-foreground">Goal: keep crude tanks 50–75 % capacity. Avoid overfill (&gt;95 %) and starvation (&lt;10 %).</p>
      </div>
      <div className="rounded-md border border-border bg-card p-3">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Live Inventory</div>
        {[
          { tag: "TK-301", v: s.tk301Level, c: s.tankCapacity, color: "#ff8a4d" },
          { tag: "TK-302", v: s.tk302Level, c: s.tankCapacity, color: "#0099ff" },
          { tag: "S-301", v: s.s301Level, c: s.sphereCapacity, color: STG },
          { tag: "S-302", v: s.s302Level, c: s.sphereCapacity, color: STG },
        ].map((it) => (
          <div key={it.tag} className="mb-2">
            <div className="mb-0.5 flex justify-between font-mono text-[11px]">
              <span>{it.tag}</span>
              <span>{((it.v / 100) * it.c).toFixed(0)} m³ · {it.v.toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-muted">
              <div className="h-full transition-all" style={{ width: `${it.v}%`, background: it.v > 85 ? "var(--danger)" : it.v < 15 ? "var(--warning)" : it.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
