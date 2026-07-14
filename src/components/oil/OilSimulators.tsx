import { useMemo, useState } from "react";
import { useOilSim, type OilFault } from "@/lib/sim/oilStore";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  Legend,
} from "recharts";
import { Check, X, RotateCcw, Play, Lightbulb } from "lucide-react";

type Tab = "pid" | "startup" | "fault" | "sep" | "hx";

export function OilSimulators() {
  const [tab, setTab] = useState<Tab>("pid");
  const tabs: { k: Tab; l: string }[] = [
    { k: "pid", l: "Multi-loop PID" },
    { k: "startup", l: "Well Startup" },
    { k: "fault", l: "Fault Diagnosis" },
    { k: "sep", l: "Separator Opt." },
    { k: "hx", l: "HX Design" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1 text-xs">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex-1 min-w-fit rounded px-3 py-2 font-mono uppercase tracking-wider ${tab === t.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.l}
          </button>
        ))}
      </div>
      {tab === "pid" && <MultiPID />}
      {tab === "startup" && <Startup />}
      {tab === "fault" && <FaultDiag />}
      {tab === "sep" && <SeparatorOpt />}
      {tab === "hx" && <HXDesign />}
    </div>
  );
}

/* ---------------- Multi-loop PID ---------------- */
function MultiPID() {
  const [Kp1, setKp1] = useState(2);
  const [Ki1, setKi1] = useState(0.3);
  const [Kd1, setKd1] = useState(0.3);
  const [Kp2, setKp2] = useState(1.5);
  const [Ki2, setKi2] = useState(0.4);
  const [Kd2, setKd2] = useState(0.2);
  const data = useMemo(
    () => simMulti(Kp1, Ki1, Kd1, Kp2, Ki2, Kd2),
    [Kp1, Ki1, Kd1, Kp2, Ki2, Kd2],
  );
  return (
    <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
      <div className="space-y-4 rounded-md border border-border bg-card p-3">
        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-[var(--success)]">
            Loop 1 · Oil Level → LV-201
          </div>
          <Slider l="Kp" v={Kp1} set={setKp1} min={0} max={6} step={0.1} />
          <Slider l="Ki" v={Ki1} set={setKi1} min={0} max={2} step={0.05} />
          <Slider l="Kd" v={Kd1} set={setKd1} min={0} max={1} step={0.05} />
        </div>
        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-[#3aa0ff]">
            Loop 2 · Crude Flow → FV-201
          </div>
          <Slider l="Kp" v={Kp2} set={setKp2} min={0} max={6} step={0.1} />
          <Slider l="Ki" v={Ki2} set={setKi2} min={0} max={2} step={0.05} />
          <Slider l="Kd" v={Kd2} set={setKd2} min={0} max={1} step={0.05} />
        </div>
        <p className="rounded bg-background p-2 text-[10px] text-muted-foreground">
          Loops interact: the oil-level valve changes downstream flow demand, so loop 1 disturbs
          loop 2. Watch both responses.
        </p>
      </div>
      <div className="rounded-md border border-border bg-card p-3">
        <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Step Response — Both Loops
        </div>
        <div className="h-80">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid stroke="#1f263a" strokeDasharray="3 3" />
              <XAxis dataKey="t" stroke="#5d6680" fontSize={10} />
              <YAxis stroke="#5d6680" fontSize={10} />
              <Tooltip
                contentStyle={{ background: "#0d111c", border: "1px solid #2a3148", fontSize: 11 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={1} stroke="#666" strokeDasharray="4 4" />
              <Line
                type="monotone"
                name="Oil level"
                dataKey="y1"
                stroke="#00ff88"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                name="Crude flow"
                dataKey="y2"
                stroke="#3aa0ff"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function simMulti(Kp1: number, Ki1: number, Kd1: number, Kp2: number, Ki2: number, Kd2: number) {
  const dt = 0.05,
    T = 20;
  let y1 = 0,
    y2 = 0,
    dy1 = 0,
    dy2 = 0,
    i1 = 0,
    i2 = 0,
    p1 = 0,
    p2 = 0;
  const data: { t: number; y1: number; y2: number }[] = [];
  for (let t = 0; t <= T; t += dt) {
    const sp = 1;
    const e1 = sp - y1,
      e2 = sp - y2;
    i1 += e1 * dt;
    i2 += e2 * dt;
    const d1 = (e1 - p1) / dt,
      d2 = (e2 - p2) / dt;
    p1 = e1;
    p2 = e2;
    const u1 = Kp1 * e1 + Ki1 * i1 + Kd1 * d1;
    const u2 = Kp2 * e2 + Ki2 * i2 + Kd2 * d2;
    // Interaction: loop 1 output affects loop 2 plant and vice versa
    const ddy1 = u1 - 0.3 * u2 - 1.4 * dy1 - 1.8 * y1;
    const ddy2 = u2 + 0.25 * u1 - 1.6 * dy2 - 2 * y2;
    dy1 += ddy1 * dt;
    y1 += dy1 * dt;
    dy2 += ddy2 * dt;
    y2 += dy2 * dt;
    data.push({ t: +t.toFixed(2), y1, y2 });
  }
  return data;
}

/* ---------------- Startup ---------------- */
const startupSteps = [
  {
    l: "Verify all valves in safe position (closed/bypass)",
    why: "Ensures controlled startup; no uncommanded flow.",
  },
  { l: "Check separator levels at zero", why: "An empty separator confirms no trapped liquid." },
  {
    l: "Slowly crack open choke valve (5% increments)",
    why: "Sudden choke open shocks the system and over-pressures the separator.",
  },
  {
    l: "Monitor wellhead pressure to design limits",
    why: "Wellhead overpressure can damage upstream piping.",
  },
  {
    l: "Check 3-phase separation establishes",
    why: "Confirms inlet device and weir are functioning before downstream loading.",
  },
  { l: "Adjust water dump valve (LV-202)", why: "Prevents water carry-over into the oil train." },
  { l: "Prime crude pump (vent air)", why: "Air in casing → instant cavitation when started." },
  { l: "Start crude pump at minimum flow", why: "Reduces motor inrush and surge load." },
  { l: "Ramp up to operating flow", why: "Gradual loading lets controllers stabilise." },
  {
    l: "Start heat exchanger utility flow",
    why: "Crude must not be pumped cold through fouling-sensitive lines.",
  },
  {
    l: "Energize electrostatic dehydrator",
    why: "Only after stable oil flow — energizing dry exposes the electrodes.",
  },
  { l: "Open export valve to storage tank", why: "Final step — sends on-spec crude to TK-201." },
];
function Startup() {
  const [order, setOrder] = useState<number[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const next = (i: number) => {
    if (i === order.length) {
      const o = [...order, i];
      setOrder(o);
      setErr(null);
      if (o.length === startupSteps.length) {
        setDone(true);
        useOilSim.getState().startPump();
      }
    } else setErr(`Wrong step. ${startupSteps[order.length]?.why ?? ""}`);
  };
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Oil Well Startup · 12 steps
        </div>
        <button
          onClick={() => {
            setOrder([]);
            setErr(null);
            setDone(false);
            useOilSim.getState().stopPump();
          }}
          className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs hover:bg-accent"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Click steps in correct engineering order. A wrong choice explains the danger.
      </p>
      <div className="space-y-2">
        {startupSteps.map((s, i) => {
          const isDone = order.includes(i);
          return (
            <button
              key={i}
              onClick={() => next(i)}
              disabled={isDone}
              className={`flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition ${isDone ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]" : "border-border bg-background hover:border-primary"}`}
            >
              <span className="scada-value w-6 text-muted-foreground">#{i + 1}</span>
              <span className="flex-1">{s.l}</span>
              {isDone && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
      {err && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-xs text-[var(--danger)]">
          <X className="h-4 w-4 shrink-0" />
          {err}
        </div>
      )}
      {done && (
        <div className="mt-3 rounded-md border border-[var(--success)]/40 bg-[var(--success)]/10 p-3 text-sm text-[var(--success)]">
          ✓ Well online — crude flowing to TK-201.
        </div>
      )}
    </div>
  );
}

/* ---------------- Fault Diagnosis ---------------- */
interface FaultDef {
  id: OilFault;
  tag: string;
  label: string;
  symptoms: string[];
  cause: string;
  action: string;
  causes: string[];
  actions: string[];
}
const faults: FaultDef[] = [
  {
    id: "pump_cavitation",
    tag: "P-201",
    label: "Crude pump cavitation",
    symptoms: [
      "Gravel-rattling noise from pump casing",
      "Pump vibration spikes",
      "Flow oscillates wildly",
      "Discharge pressure drops",
      "Efficiency falls below 40%",
      "Motor current fluctuates",
    ],
    cause: "Low NPSH available (suction starvation or low separator level)",
    action: "Reduce pump demand, raise separator level / suction pressure, check strainer",
    causes: [
      "Plugged strainer",
      "Low NPSH available",
      "Discharge valve fully closed",
      "Motor overload",
    ],
    actions: [
      "Raise suction pressure / level",
      "Increase discharge flow",
      "Replace impeller",
      "Add chemical inhibitor",
    ],
  },
  {
    id: "hx_fouling",
    tag: "E-201",
    label: "Heat exchanger fouling",
    symptoms: [
      "Outlet temp gradually drops over time",
      "Utility valve opens further to compensate",
      "LMTD calculation increases",
      "Pressure drop across exchanger rising",
      "Duty (kW) falls",
      "Cleaning history overdue",
    ],
    cause: "Solids/wax build-up reducing overall U coefficient",
    action: "Schedule chemical or mechanical cleaning; consider antifoulant injection",
    causes: [
      "Sudden tube rupture",
      "Solids / wax deposits reducing U",
      "Utility supply lost",
      "Bypass valve open",
    ],
    actions: [
      "Isolate & clean tubes",
      "Increase utility flow only",
      "Reduce crude flow only",
      "Replace exchanger",
    ],
  },
  {
    id: "emulsion",
    tag: "V-201",
    label: "Tight emulsion in separator",
    symptoms: [
      "BS&W refuses to drop below 2%",
      "Oil/water interface fuzzy on sight glass",
      "LIC-201 hunts continuously",
      "Oil-in-water at WT-201 climbs",
      "Demulsifier dosing low",
      "Recent slug of produced water",
    ],
    cause: "Stable water-in-oil emulsion not breaking by gravity alone",
    action: "Inject demulsifier chemical, raise separator temperature, increase retention time",
    causes: [
      "Loss of demulsifier injection",
      "Sand bridging the weir",
      "PT-201 transmitter failure",
      "Choke valve stuck",
    ],
    actions: [
      "Resume / increase demulsifier",
      "Raise sep temperature",
      "Replace transmitter",
      "Open choke wider",
    ],
  },
  {
    id: "water_carryover",
    tag: "D-201",
    label: "Water carry-over to export",
    symptoms: [
      "BS&W out of dehydrator > 1.5%",
      "Tank water bottoms rising fast",
      "Dehydrator current spikes / trips",
      "Interface level alarms",
      "Crude conductivity rises",
      "Export off-spec",
    ],
    cause: "Excess free water entering dehydrator overwhelms electrostatic field",
    action: "Lower LIC-201 setpoint, verify LV-202 functioning, check upstream water level",
    causes: [
      "Excess free water reaching D-201",
      "Electrostatic grid shorted",
      "Tank inlet diverter broken",
      "Pump running too fast",
    ],
    actions: [
      "Verify LV-202 / water dump",
      "De-energize & inspect grids",
      "Reduce flow temporarily",
      "Restart pump at low speed",
    ],
  },
  {
    id: "sand_production",
    tag: "WH-201",
    label: "Sand production from well",
    symptoms: [
      "Choke valve trim eroding (pressure drop changing)",
      "Separator bottom thickening",
      "Erosion noise at piping bends",
      "Sand sample collected at WT-201",
      "Wellhead pressure drift",
      "Pump impeller wear accelerating",
    ],
    cause: "Reservoir sand failure; insufficient sand control downhole",
    action:
      "Reduce drawdown (close choke partially), commission desander, plan sand control workover",
    causes: [
      "Reservoir sand control failure",
      "Excess drawdown",
      "Tubing collapse",
      "Surface sand filter bypassed",
    ],
    actions: [
      "Reduce choke opening",
      "Install / commission desander",
      "Workover for sand screen",
      "Replace eroded trim",
    ],
  },
];

function FaultDiag() {
  const [active, setActive] = useState<FaultDef | null>(null);
  const [pick, setPick] = useState<OilFault | "">("");
  const [pickCause, setPickCause] = useState("");
  const [pickAction, setPickAction] = useState("");
  const [hints, setHints] = useState(0);
  const [t0, setT0] = useState(0);
  const [result, setResult] = useState<null | {
    fault: boolean;
    cause: boolean;
    action: boolean;
    time: number;
    score: number;
  }>(null);

  const start = () => {
    const f = faults[Math.floor(Math.random() * faults.length)];
    setActive(f);
    setPick("");
    setPickCause("");
    setPickAction("");
    setHints(0);
    setResult(null);
    setT0(Date.now());
    useOilSim.getState().injectFault(f.id);
  };
  const submit = () => {
    if (!active) return;
    const okF = pick === active.id;
    const okC = pickCause === active.cause;
    const okA = pickAction === active.action;
    const time = (Date.now() - t0) / 1000;
    const base = (okF ? 40 : 0) + (okC ? 30 : 0) + (okA ? 30 : 0);
    const penalty = hints * 5 + Math.min(20, time / 6);
    const score = Math.max(0, Math.round(base - penalty));
    setResult({ fault: okF, cause: okC, action: okA, time, score });
    useOilSim.getState().injectFault("none");
  };

  return (
    <div className="space-y-3 rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Advanced Fault Diagnosis
        </div>
        <button
          onClick={start}
          className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
        >
          <Play className="h-3 w-3" /> Inject random fault
        </button>
      </div>

      {active && (
        <>
          <div className="rounded-md border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-3 text-xs">
            Fault active. Diagnose: what failed, the root cause, and the corrective action.
          </div>

          <div className="rounded-md border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Symptoms
              <button
                onClick={() => setHints((h) => h + 1)}
                className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] hover:bg-accent"
              >
                <Lightbulb className="h-3 w-3" /> Hint ({hints})
              </button>
            </div>
            <ul className="space-y-1 text-xs">
              {active.symptoms.slice(0, 6 - Math.max(0, 3 - hints)).map((sy, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">•</span>
                  {sy}
                </li>
              ))}
            </ul>
          </div>

          <Picker
            label="Failed equipment / device"
            value={pick}
            onChange={(v) => setPick(v as OilFault)}
            options={faults.map((f) => [f.id, `${f.tag} — ${f.label}`])}
          />
          <Picker
            label="Root cause"
            value={pickCause}
            onChange={setPickCause}
            options={Array.from(new Set(faults.flatMap((f) => f.causes))).map((c) => [c, c])}
          />
          <Picker
            label="Corrective action"
            value={pickAction}
            onChange={setPickAction}
            options={Array.from(new Set(faults.flatMap((f) => f.actions))).map((a) => [a, a])}
          />

          <button
            onClick={submit}
            disabled={!pick || !pickCause || !pickAction || !!result}
            className="w-full rounded bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            Submit diagnosis
          </button>

          {result && (
            <div
              className={`space-y-2 rounded-md border p-3 text-sm ${result.score >= 70 ? "border-[var(--success)]/40 bg-[var(--success)]/10" : "border-[var(--warning)]/40 bg-[var(--warning)]/10"}`}
            >
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                <ResultPill ok={result.fault} label="Device" />
                <ResultPill ok={result.cause} label="Cause" />
                <ResultPill ok={result.action} label="Action" />
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                Time {result.time.toFixed(1)}s · Hints {hints}
              </div>
              <div className="scada-value text-2xl text-primary">Score {result.score}/100</div>
              <div className="text-xs text-muted-foreground">
                <span className="text-primary">Correct answer:</span> {active.tag} — {active.label}.
                Cause: {active.cause}. Action: {active.action}.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ResultPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={`rounded p-1 ${ok ? "bg-[var(--success)]/20 text-[var(--success)]" : "bg-[var(--danger)]/20 text-[var(--danger)]"}`}
    >
      {ok ? "✓" : "✗"} {label}
    </div>
  );
}

function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      >
        <option value="">— select —</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---------------- Separator Optimization ---------------- */
function SeparatorOpt() {
  const [inlet, setInlet] = useState(200);
  const [choke, setChoke] = useState(45);
  const [oilSP, setOilSP] = useState(50);
  const [waterSP, setWaterSP] = useState(35);
  const [retention, setRetention] = useState(2);

  // physics-ish: BS&W decreases with retention time, increases with inlet flow
  const flow = (inlet * choke) / 100;
  const bsw = Math.max(0.1, 1.5 / retention + (flow > 150 ? (flow - 150) * 0.01 : 0));
  const oilProd = flow * 0.6 * (1 - Math.min(0.4, bsw / 5));
  const onSpec = bsw < 0.5;
  const eff = Math.max(
    0,
    Math.min(100, (oilProd / 130) * 100 - (bsw > 0.5 ? (bsw - 0.5) * 40 : 0)),
  );

  const apply = () =>
    useOilSim.getState().setController({
      lic201SP: oilSP,
      lic202SP: waterSP,
    });

  return (
    <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3 rounded-md border border-border bg-card p-3">
        <Slider l="Inlet flow (m³/h)" v={inlet} set={setInlet} min={50} max={300} step={5} />
        <Slider l="Choke opening (%)" v={choke} set={setChoke} min={10} max={100} step={1} />
        <Slider l="Oil level SP (%)" v={oilSP} set={setOilSP} min={30} max={75} step={1} />
        <Slider l="Water level SP (%)" v={waterSP} set={setWaterSP} min={20} max={55} step={1} />
        <Slider
          l="Retention time (min)"
          v={retention}
          set={setRetention}
          min={0.5}
          max={6}
          step={0.1}
        />
        <button
          onClick={apply}
          className="w-full rounded bg-primary py-2 text-sm font-semibold text-primary-foreground"
        >
          Apply setpoints
        </button>
        <p className="rounded bg-background p-2 text-[10px] text-muted-foreground">
          Higher retention time and lower throughput improve separation but reduce production. The
          goal: maximise oil production while keeping BS&amp;W below 0.5%.
        </p>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Oil production" v={`${oilProd.toFixed(1)} m³/h`} />
          <Stat
            label="BS&W out"
            v={`${bsw.toFixed(2)} %`}
            color={onSpec ? undefined : "var(--danger)"}
          />
          <Stat label="Efficiency" v={`${eff.toFixed(0)}/100`} />
        </div>
        <div className="rounded-md border border-border bg-card p-3 text-sm">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Physics
          </div>
          <div className="space-y-1 font-mono text-xs text-muted-foreground">
            <div>Effective flow Q = inlet × choke = {flow.toFixed(0)} m³/h</div>
            <div>
              BS&W ≈ 1.5 / t<sub>res</sub> + flow penalty = {bsw.toFixed(2)} %
            </div>
            <div>Oil draw = Q × 0.6 × (1 - BSW/5) = {oilProd.toFixed(1)} m³/h</div>
            <div className={onSpec ? "text-[var(--success)]" : "text-[var(--danger)]"}>
              {onSpec ? "✓ ON-SPEC for export" : "✗ OFF-SPEC — water in oil too high"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- HX Design ---------------- */
function HXDesign() {
  const [tIn, setTIn] = useState(60);
  const [tOut, setTOut] = useState(95);
  const [flow, setFlow] = useState(180);
  const [tUIn, setTUIn] = useState(140);
  const [tUOut, setTUOut] = useState(100);

  // Crude: Cp ≈ 2.05 kJ/kg.K, ρ ≈ 850 kg/m³
  const m = (flow * 850) / 3600; // kg/s
  const Cp = 2.05; // kJ/kg.K
  const Q = m * Cp * (tOut - tIn); // kW
  const dT1 = tUIn - tOut;
  const dT2 = tUOut - tIn;
  const LMTD =
    dT1 > 0 && dT2 > 0 && dT1 !== dT2
      ? (dT1 - dT2) / Math.log(dT1 / dT2)
      : Math.max(0.1, (dT1 + dT2) / 2);
  const U = 0.6; // kW/m².K, typical
  const A = LMTD > 0 ? Q / (U * LMTD) : 0;
  // Tubes: 19 mm OD, 6 m long → area per tube
  const tubeA = Math.PI * 0.019 * 6;
  const tubes = Math.ceil(A / tubeA);

  return (
    <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3 rounded-md border border-border bg-card p-3">
        <Slider l="Crude flow (m³/h)" v={flow} set={setFlow} min={50} max={300} step={5} />
        <Slider l="Crude inlet T (°C)" v={tIn} set={setTIn} min={20} max={120} step={1} />
        <Slider l="Crude outlet T (°C)" v={tOut} set={setTOut} min={tIn + 5} max={150} step={1} />
        <Slider l="Utility inlet T (°C)" v={tUIn} set={setTUIn} min={tOut + 5} max={220} step={1} />
        <Slider
          l="Utility outlet T (°C)"
          v={tUOut}
          set={setTUOut}
          min={tIn + 5}
          max={tUIn - 5}
          step={1}
        />
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Duty Q" v={`${Q.toFixed(0)} kW`} />
          <Stat label="LMTD" v={`${LMTD.toFixed(1)} °C`} />
          <Stat label="Area A" v={`${A.toFixed(1)} m²`} />
          <Stat label="Tubes (19mm × 6m)" v={`${tubes}`} />
        </div>
        <div className="rounded-md border border-border bg-card p-3 font-mono text-xs text-muted-foreground">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-primary">
            LMTD step by step
          </div>
          <div>
            1. Mass flow: ṁ = Q<sub>vol</sub> × ρ / 3600 = {flow} × 850 / 3600 = {m.toFixed(2)} kg/s
          </div>
          <div>
            2. Q = ṁ × Cp × ΔT = {m.toFixed(2)} × {Cp} × ({tOut}−{tIn}) ={" "}
            <span className="text-primary">{Q.toFixed(0)} kW</span>
          </div>
          <div>
            3. ΔT₁ = T<sub>u,in</sub> − T<sub>c,out</sub> = {tUIn}−{tOut} = {dT1.toFixed(1)} °C
          </div>
          <div>
            4. ΔT₂ = T<sub>u,out</sub> − T<sub>c,in</sub> = {tUOut}−{tIn} = {dT2.toFixed(1)} °C
          </div>
          <div>
            5. LMTD = (ΔT₁−ΔT₂) / ln(ΔT₁/ΔT₂) ={" "}
            <span className="text-primary">{LMTD.toFixed(1)} °C</span>
          </div>
          <div>
            6. A = Q / (U × LMTD) with U ≈ 0.6 kW/m²K ={" "}
            <span className="text-primary">{A.toFixed(1)} m²</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- shared ---------------- */
function Slider({
  l,
  v,
  set,
  min,
  max,
  step,
}: {
  l: string;
  v: number;
  set: (n: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-muted-foreground">{l}</span>
        <span className="scada-value text-primary">{v.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => set(+e.target.value)}
        className="w-full accent-[var(--primary)]"
      />
    </div>
  );
}
function Stat({ label, v, color }: { label: string; v: string; color?: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="font-mono text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="scada-value text-xl" style={{ color: color ?? "var(--primary)" }}>
        {v}
      </div>
    </div>
  );
}
