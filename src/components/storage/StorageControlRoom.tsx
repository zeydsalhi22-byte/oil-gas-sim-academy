import { useStorageSim } from "@/lib/sim/storageStore";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";

const STG = "#00aa44";

export function StorageControlRoom() {
  const s = useStorageSim();
  const data = s.trend.map((p) => ({ ...p, t: new Date(p.t).toLocaleTimeString().slice(3, 8) }));

  return (
    <div className="grid h-full gap-3 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <Kpis />
        <Inventory />
        <div className="grid gap-3 sm:grid-cols-2">
          <ChartCard
            title="Tank Levels %"
            data={data}
            keys={[
              { k: "tk301", c: "#ff8a4d", n: "TK-301" },
              { k: "tk302", c: "#3aa0ff", n: "TK-302" },
            ]}
            refLines={[
              { y: 60, c: "#00aa44", l: "SP" },
              { y: 85, c: "#ff4444", l: "HH" },
            ]}
          />
          <ChartCard
            title="Sphere Pressures (bar)"
            data={data}
            keys={[
              { k: "s301", c: "#00ff88", n: "S-301" },
              { k: "s302", c: "#0099ff", n: "S-302" },
            ]}
            refLines={[{ y: 18, c: "#ff4444", l: "HH" }]}
          />
          <ChartCard
            title="Inlet vs Export (m³/h)"
            data={data}
            keys={[
              { k: "inlet", c: "#a855f7", n: "Inlet" },
              { k: "exportCrude", c: "#00aa44", n: "Crude Exp" },
            ]}
          />
          <ChartCard
            title="Export Gas (m³/h)"
            data={data}
            keys={[{ k: "exportGas", c: "#0099ff", n: "Gas Exp" }]}
          />
        </div>
      </div>
      <div className="space-y-3">
        <LicPanel />
        <PumpsPanel />
        <AlarmList />
      </div>
    </div>
  );
}

function Kpis() {
  const s = useStorageSim();
  const items: { l: string; v: string; u: string; warn?: boolean; alarm?: boolean }[] = [
    {
      l: "TK-301",
      v: s.tk301Level.toFixed(0),
      u: "%",
      warn: s.tk301Level > 75,
      alarm: s.tk301Level > 85,
    },
    {
      l: "TK-302",
      v: s.tk302Level.toFixed(0),
      u: "%",
      warn: s.tk302Level > 75,
      alarm: s.tk302Level > 85,
    },
    {
      l: "S-301 P",
      v: s.s301Press.toFixed(1),
      u: "bar",
      warn: s.s301Press > 17,
      alarm: s.s301Press > 18,
    },
    {
      l: "S-302 P",
      v: s.s302Press.toFixed(1),
      u: "bar",
      warn: s.s302Press > 17,
      alarm: s.s302Press > 18,
    },
    { l: "INLET", v: s.inletFlow.toFixed(0), u: "m³/h" },
    { l: "EXP CR", v: s.exportCrude.toFixed(0), u: "m³/h" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {items.map((it) => {
        const color = it.alarm ? "var(--danger)" : it.warn ? "var(--warning)" : STG;
        return (
          <div key={it.l} className="rounded-md border border-border bg-card p-2">
            <div className="font-mono text-[10px] text-muted-foreground">{it.l}</div>
            <div className="scada-value text-base" style={{ color }}>
              {it.v}
              <span className="ml-1 text-[10px] text-muted-foreground">{it.u}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Inventory() {
  const s = useStorageSim();
  const items = [
    { tag: "TK-301", lvl: s.tk301Level, cap: s.tankCapacity },
    { tag: "TK-302", lvl: s.tk302Level, cap: s.tankCapacity },
    { tag: "S-301", lvl: s.s301Level, cap: s.sphereCapacity },
    { tag: "S-302", lvl: s.s302Level, cap: s.sphereCapacity },
  ];
  const total = items.reduce((sum, x) => sum + (x.lvl / 100) * x.cap, 0);
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Inventory{" "}
        <span className="scada-value" style={{ color: STG }}>
          {total.toFixed(0)} m³ total
        </span>
      </div>
      <div className="space-y-2">
        {items.map((it) => {
          const vol = (it.lvl / 100) * it.cap;
          const danger = it.lvl > 85;
          return (
            <div key={it.tag}>
              <div className="mb-0.5 flex justify-between font-mono text-[11px]">
                <span className="text-muted-foreground">{it.tag}</span>
                <span className={danger ? "text-[var(--danger)]" : ""}>
                  {vol.toFixed(0)} / {it.cap} m³ · {it.lvl.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-muted">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.min(100, it.lvl)}%`,
                    background: danger ? "var(--danger)" : "#0099ff",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px]">
        <span className="text-muted-foreground">Daily export</span>
        <span className="scada-value" style={{ color: STG }}>
          {s.dailyExport.toFixed(0)} m³
        </span>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  data,
  keys,
  refLines,
}: {
  title: string;
  data: any[];
  keys: { k: string; c: string; n: string }[];
  refLines?: { y: number; c: string; l: string }[];
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="h-36">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="#1f263a" strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke="#5d6680" fontSize={10} />
            <YAxis stroke="#5d6680" fontSize={10} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ background: "#0d111c", border: "1px solid #2a3148", fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {refLines?.map((r) => (
              <ReferenceLine
                key={r.l}
                y={r.y}
                stroke={r.c}
                strokeDasharray="3 3"
                label={{ value: r.l, fill: r.c, fontSize: 10 }}
              />
            ))}
            {keys.map((k) => (
              <Line
                key={k.k}
                type="monotone"
                name={k.n}
                dataKey={k.k}
                stroke={k.c}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LicPanel() {
  const s = useStorageSim();
  const set = useStorageSim((x) => x.setController);
  const e = s.tk301Level - s.licSP;
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        LIC-301 · Tank Level
        <button
          onClick={() => set({ licAuto: !s.licAuto })}
          className={`rounded px-2 py-0.5 font-mono text-[10px] ${s.licAuto ? "bg-[var(--success)]/20 text-[var(--success)]" : "bg-[var(--warning)]/20 text-[var(--warning)]"}`}
        >
          {s.licAuto ? "AUTO" : "MAN"}
        </button>
      </div>
      <div className="space-y-1 font-mono text-xs">
        <Row k="SP" v={`${s.licSP.toFixed(0)} %`} />
        <Row k="PV" v={`${s.tk301Level.toFixed(1)} %`} color={STG} />
        <Row k="e(t)" v={`${e.toFixed(2)}`} />
        <Row k="OUT (LV-301)" v={`${s.lv301.toFixed(0)} %`} color="#ff8a4d" />
      </div>
      <input
        type="range"
        min={30}
        max={80}
        step={0.5}
        value={s.licSP}
        onChange={(e) => set({ licSP: +e.target.value })}
        className="mt-2 w-full"
        style={{ accentColor: STG }}
      />
      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
        <Tune label="Kp" value={s.kp} min={0} max={5} step={0.1} onChange={(v) => set({ kp: v })} />
        <Tune
          label="Ki"
          value={s.ki}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => set({ ki: v })}
        />
        <Tune
          label="Kd"
          value={s.kd}
          min={0}
          max={0.8}
          step={0.05}
          onChange={(v) => set({ kd: v })}
        />
      </div>
    </div>
  );
}

function Tune({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between font-mono">
        <span className="text-muted-foreground">{label}</span>
        <span>{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full"
        style={{ accentColor: STG }}
      />
    </div>
  );
}

function Row({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span style={{ color: color ?? undefined }}>{v}</span>
    </div>
  );
}

function PumpsPanel() {
  const s = useStorageSim();
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Transfer Pumps
      </div>
      {(["p301", "p302"] as const).map((p) => (
        <div key={p} className="mb-2 last:mb-0">
          <div className="mb-1 flex items-center justify-between font-mono text-xs">
            <span>{p === "p301" ? "P-301 · Crude" : "P-302 · Gas"}</span>
            <span className={s[p] ? "text-[var(--success)]" : "text-[var(--danger)]"}>
              {s[p] ? "● RUNNING" : "● STOPPED"}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => useStorageSim.getState().startPump(p)}
              className="flex-1 rounded bg-[var(--success)]/20 px-2 py-1 text-xs text-[var(--success)]"
            >
              START
            </button>
            <button
              onClick={() => useStorageSim.getState().stopPump(p)}
              className="flex-1 rounded bg-[var(--danger)]/20 px-2 py-1 text-xs text-[var(--danger)]"
            >
              STOP
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AlarmList() {
  const alarms = useStorageSim((s) => s.alarms);
  const ack = useStorageSim((s) => s.ackAlarm);
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Alarms{" "}
        <span className="text-[var(--danger)]">{alarms.filter((a) => !a.ack).length} active</span>
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {alarms.length === 0 && (
          <div className="py-4 text-center text-xs text-muted-foreground">No alarms</div>
        )}
        {alarms.map((a) => {
          const color =
            a.level === "critical"
              ? "var(--danger)"
              : a.level === "high"
                ? "var(--warning)"
                : "var(--success)";
          return (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded border border-border/60 p-2 font-mono text-[11px]"
            >
              <span
                className={`h-2 w-2 rounded-full ${a.ack ? "" : "animate-alarm"}`}
                style={{ background: color }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate" style={{ color }}>
                  {a.tag} · {a.description}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {new Date(a.ts).toLocaleTimeString()}
                </div>
              </div>
              {!a.ack && (
                <button
                  onClick={() => ack(a.id)}
                  className="rounded bg-muted px-2 py-0.5 text-[10px] hover:bg-accent"
                >
                  ACK
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
