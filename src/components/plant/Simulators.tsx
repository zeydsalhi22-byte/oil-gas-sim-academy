import { useEffect, useMemo, useRef, useState } from "react";
import { useSim, type FaultType } from "@/lib/sim/store";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip } from "recharts";
import { Check, X, Lightbulb, RotateCcw, Play } from "lucide-react";

export function Simulators() {
  const [tab, setTab] = useState<"pid" | "startup" | "fault" | "flow">("pid");
  const tabs = [
    { k: "pid", l: "PID Tuner" },
    { k: "startup", l: "Startup Sequence" },
    { k: "fault", l: "Fault Diagnosis" },
    { k: "flow", l: "Flow & Pressure" },
  ] as const;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1 text-xs">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as any)}
            className={`flex-1 rounded px-3 py-2 font-mono uppercase tracking-wider ${
              tab === t.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>
      {tab === "pid" && <PIDTuner />}
      {tab === "startup" && <StartupSequence />}
      {tab === "fault" && <FaultDiagnosis />}
      {tab === "flow" && <FlowControl />}
    </div>
  );
}

/* ---------- PID Tuner ---------- */
function PIDTuner() {
  const [Kp, setKp] = useState(2);
  const [Ki, setKi] = useState(10);
  const [Kd, setKd] = useState(0.1);
  const sim = useMemo(() => simulateStep(Kp, Ki, Kd), [Kp, Ki, Kd]);

  const apply = () => useSim.getState().setPID({ Kp, Ki: Ki, Kd });

  return (
    <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
      <div className="space-y-3 rounded-md border border-border bg-card p-3">
        <Block title="Process Variable" sub="Discharge pressure" />
        <Slider label="Kp" value={Kp} setValue={setKp} min={0} max={10} step={0.1} hint="Proportional — higher = faster but oscillates" />
        <Slider label="Ki" value={Ki} setValue={setKi} min={0} max={100} step={1} hint="Integral — eliminates steady-state error" />
        <Slider label="Kd" value={Kd} setValue={setKd} min={0} max={1} step={0.01} hint="Derivative — damps fast changes" />
        <div className="flex flex-wrap gap-1">
          {[
            { l: "Aggressive", v: [5, 30, 0.2] },
            { l: "Moderate", v: [2.2, 8, 0.05] },
            { l: "Conservative", v: [0.8, 2, 0] },
          ].map((p) => (
            <button key={p.l} onClick={() => { setKp(p.v[0]); setKi(p.v[1]); setKd(p.v[2]); }} className="rounded bg-muted px-2 py-1 text-xs hover:bg-accent">
              {p.l}
            </button>
          ))}
        </div>
        <button onClick={apply} className="w-full rounded bg-primary py-2 text-sm font-semibold text-primary-foreground hover:brightness-110">
          Apply to PIC-103
        </button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Overshoot" v={`${sim.overshoot.toFixed(1)}%`} />
          <Stat label="Settling time" v={`${sim.settling.toFixed(1)}s`} />
          <Stat label="SS error" v={`${sim.sse.toFixed(2)}`} />
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Step Response</div>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={sim.data}>
                <CartesianGrid stroke="#1f263a" strokeDasharray="3 3" />
                <XAxis dataKey="t" stroke="#5d6680" fontSize={10} />
                <YAxis stroke="#5d6680" fontSize={10} />
                <Tooltip contentStyle={{ background: "#0d111c", border: "1px solid #2a3148", fontSize: 11 }} />
                <ReferenceLine y={1} stroke="#00ff88" strokeDasharray="4 4" label={{ value: "SP", fill: "#00ff88", fontSize: 10 }} />
                <Line type="monotone" dataKey="pv" stroke="#ff6b00" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function simulateStep(Kp: number, Ki: number, Kd: number) {
  // 2nd order plant approximation
  const dt = 0.05, T = 15;
  let y = 0, dy = 0, integral = 0, prev = 0;
  const data: { t: number; pv: number }[] = [];
  for (let t = 0; t <= T; t += dt) {
    const sp = 1;
    const e = sp - y;
    integral += e * dt;
    const d = (e - prev) / dt; prev = e;
    const u = Kp * e + Ki * 0.1 * integral + Kd * d;
    const ddy = (u - 1.5 * dy - 2 * y) / 1;
    dy += ddy * dt; y += dy * dt;
    data.push({ t: +t.toFixed(2), pv: y });
  }
  const peak = Math.max(...data.map((d) => d.pv));
  const overshoot = Math.max(0, (peak - 1) * 100);
  // settling time within ±5%
  let settling = T;
  for (let i = data.length - 1; i >= 0; i--) {
    if (Math.abs(data[i].pv - 1) > 0.05) { settling = data[i].t; break; }
  }
  const sse = Math.abs(1 - data[data.length - 1].pv);
  return { data, overshoot, settling, sse };
}

function Slider({ label, value, setValue, min, max, step, hint }: { label: string; value: number; setValue: (n: number) => void; min: number; max: number; step: number; hint: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-muted-foreground">{label}</span>
        <span className="scada-value text-primary">{value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => setValue(+e.target.value)} className="w-full accent-[var(--primary)]" />
      <p className="text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function Block({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="text-sm text-foreground">{sub}</div>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="font-mono text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="scada-value text-xl text-primary">{v}</div>
    </div>
  );
}

/* ---------- Startup Sequence ---------- */
const startupSteps = [
  { l: "Open suction valve (FV-101)", why: "Establish gas path to compressor before rotation." },
  { l: "Close discharge isolation", why: "Prevent reverse flow during startup." },
  { l: "Start lube oil pump", why: "Bearings must be lubricated before motor starts." },
  { l: "Energize anti-surge controller (open PV-101)", why: "Recycle line protects against surge at low flow." },
  { l: "Start motor / spin up to rated RPM", why: "Bring compressor to operating speed." },
  { l: "Slowly open discharge valve", why: "Build line pressure smoothly." },
  { l: "Hand over to PID auto control", why: "Stable operation — controller maintains setpoint." },
];
function StartupSequence() {
  const [order, setOrder] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const next = (idx: number) => {
    if (idx === order.length) {
      const newOrder = [...order, idx];
      setOrder(newOrder);
      setError(null);
      if (newOrder.length === startupSteps.length) {
        setDone(true);
        useSim.getState().startCompressor();
        useSim.getState().setPID({ pidAuto: true });
      }
    } else {
      setError(`Wrong step. ${startupSteps[order.length]?.why ?? ""}`);
    }
  };

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-mono text-sm uppercase tracking-widest text-muted-foreground">K-101 startup checklist</div>
        <button onClick={() => { setOrder([]); setError(null); setDone(false); useSim.getState().stopCompressor(); }} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs hover:bg-accent">
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">Click steps in the correct engineering order.</p>
      <div className="space-y-2">
        {startupSteps.map((s, i) => {
          const done = order.includes(i);
          return (
            <button
              key={i}
              onClick={() => next(i)}
              disabled={done}
              className={`flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition ${
                done ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]" : "border-border bg-background hover:border-primary"
              }`}
            >
              <span className="scada-value w-6 text-muted-foreground">#{i + 1}</span>
              <span className="flex-1">{s.l}</span>
              {done && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-xs text-[var(--danger)]">
          <X className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {done && (
        <div className="mt-3 rounded-md border border-[var(--success)]/40 bg-[var(--success)]/10 p-3 text-sm text-[var(--success)]">
          ✓ Startup complete — compressor is online and PID is in AUTO.
        </div>
      )}
    </div>
  );
}

/* ---------- Fault diagnosis ---------- */
const faults: { id: FaultType; tag: string; loc: string; label: string }[] = [
  { id: "pt_fail", tag: "PT-103", loc: "discharge", label: "Pressure transmitter PT-103 failed" },
  { id: "valve_stuck", tag: "PV-101", loc: "recycle", label: "Recycle valve PV-101 stuck closed" },
  { id: "leak", tag: "SEP", loc: "separator", label: "Leak on separator V-101" },
  { id: "tt_fail", tag: "TT-102", loc: "compressor", label: "Temperature transmitter TT-102 failed" },
];
function FaultDiagnosis() {
  const [active, setActive] = useState<typeof faults[number] | null>(null);
  const [hints, setHints] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [t0, setT0] = useState<number>(0);

  const start = () => {
    const f = faults[Math.floor(Math.random() * faults.length)];
    setActive(f);
    setHints(0);
    setResult(null);
    setT0(Date.now());
    useSim.getState().injectFault(f.id, f.loc);
  };
  const guess = (id: FaultType) => {
    if (!active) return;
    const dt = ((Date.now() - t0) / 1000).toFixed(0);
    if (id === active.id) {
      const score = Math.max(0, 100 - hints * 20 - Math.floor(+dt / 5));
      setResult(`✓ Correct! Score: ${score} · time ${dt}s · hints ${hints}`);
    } else {
      setResult(`✗ Wrong — keep observing the SCADA.`);
    }
    useSim.getState().injectFault("none");
  };

  return (
    <div className="space-y-3 rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Fault Detection</div>
        <button onClick={start} className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          <Play className="h-3 w-3" /> Inject random fault
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Observe the SCADA trends and Plant view to identify the failed device. Use hints sparingly.</p>

      {active && (
        <>
          <div className="rounded-md border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-3 text-xs">
            Fault is active. Diagnose which device failed:
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {faults.map((f) => (
              <button key={f.id} onClick={() => guess(f.id)} className="rounded-md border border-border bg-background p-3 text-left text-xs hover:border-primary">
                <div className="scada-value text-primary">{f.tag}</div>
                <div className="text-muted-foreground">{f.label}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setHints(hints + 1)} className="inline-flex items-center gap-1 rounded bg-muted px-3 py-1 text-xs hover:bg-accent">
            <Lightbulb className="h-3 w-3" /> Hint ({hints})
          </button>
          {hints > 0 && (
            <div className="rounded-md border border-border bg-background p-2 text-xs text-muted-foreground">
              {hints >= 1 && <p>Hint 1 — Check which area shows abnormal readings on the Plant view.</p>}
              {hints >= 2 && <p>Hint 2 — Look at the suspicious tag in trend graphs (Control Room).</p>}
              {hints >= 3 && <p>Hint 3 — The failed device is in: <span className="text-primary">{active.loc}</span></p>}
            </div>
          )}
        </>
      )}
      {result && <div className={`rounded-md border p-3 text-sm ${result.startsWith("✓") ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]" : "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]"}`}>{result}</div>}
    </div>
  );
}

/* ---------- Flow & Pressure control ---------- */
function FlowControl() {
  const s = useSim();
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-3 rounded-md border border-border bg-card p-4">
        <div className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Operator inputs</div>
        <Slider label="Inlet flow (disturbance)" value={s.inletFlow} setValue={(v) => useSim.getState().setInletFlow(v)} min={200} max={3000} step={20} hint="Increase = higher load on the system" />
        <div className="flex items-center justify-between text-xs">
          <span>PID mode</span>
          <button onClick={() => useSim.getState().setPID({ pidAuto: !s.pidAuto })} className={`rounded px-3 py-1 font-mono ${s.pidAuto ? "bg-[var(--success)]/20 text-[var(--success)]" : "bg-[var(--warning)]/20 text-[var(--warning)]"}`}>
            {s.pidAuto ? "AUTO" : "MANUAL"}
          </button>
        </div>
        {!s.pidAuto && (
          <Slider label="PV-101 (manual)" value={s.pvOpen} setValue={(v) => useSim.getState().setValve("pv", v)} min={0} max={100} step={1} hint="You control the recycle valve directly" />
        )}
        <Slider label="Setpoint (discharge)" value={s.setpoint} setValue={(v) => useSim.getState().setPID({ setpoint: v })} min={60} max={130} step={1} hint="Target pressure for PID" />
      </div>

      <div className="space-y-2 rounded-md border border-border bg-card p-4">
        <div className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Live process</div>
        <Reading label="Wellhead P" v={`${s.wellPressure.toFixed(1)} bar`} />
        <Reading label="Separator level" v={`${s.sepLevel.toFixed(1)} %`} />
        <Reading label="Discharge P (PV)" v={`${s.discharge.toFixed(2)} bar`} c="var(--primary)" />
        <Reading label="Setpoint (SP)" v={`${s.setpoint.toFixed(1)} bar`} c="var(--success)" />
        <Reading label="Error" v={`${(s.setpoint - s.discharge).toFixed(2)}`} />
        <Reading label="PV-101 output" v={`${s.pvOpen.toFixed(1)} %`} />
        <Reading label="Gas flow" v={`${s.gasFlow.toFixed(0)} m³/h`} />
      </div>
    </div>
  );
}
function Reading({ label, v, c }: { label: string; v: string; c?: string }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-1 font-mono text-xs">
      <span className="text-muted-foreground">{label}</span><span style={{ color: c }}>{v}</span>
    </div>
  );
}
