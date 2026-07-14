import { useSim } from "@/lib/sim/store";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function ControlRoom() {
  const s = useSim();
  const data = s.trend.map((p) => ({ ...p, t: new Date(p.t).toLocaleTimeString().slice(3, 8) }));

  return (
    <div className="grid h-full gap-3 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <Kpis />
        <ChartCard title="Discharge Pressure (bar) — SP/PV" data={data} keys={[{ k: "discharge", c: "#ff6b00" }]} />
        <div className="grid gap-3 sm:grid-cols-2">
          <ChartCard title="Separator Level %" data={data} keys={[{ k: "sepLevel", c: "#ff9a3c" }]} />
          <ChartCard title="Compressor RPM" data={data} keys={[{ k: "rpm", c: "#3aa0ff" }]} />
          <ChartCard title="Gas Flow (m³/h)" data={data} keys={[{ k: "flow", c: "#00ff88" }]} />
          <ChartCard title="Outlet Purity %" data={data} keys={[{ k: "purity", c: "#ffcc00" }]} />
        </div>
      </div>
      <ControllerPanel />
    </div>
  );
}

function Kpis() {
  const s = useSim();
  const items = [
    { l: "WH PRESS", v: s.wellPressure.toFixed(1), u: "bar" },
    { l: "SEP LVL", v: s.sepLevel.toFixed(0), u: "%" },
    { l: "DISCH", v: s.discharge.toFixed(1), u: "bar" },
    { l: "K-101 RPM", v: s.rpm.toFixed(0), u: "" },
    { l: "POWER", v: s.power.toFixed(0), u: "kW" },
    { l: "PURITY", v: s.purity.toFixed(2), u: "%" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {items.map((it) => (
        <div key={it.l} className="rounded-md border border-border bg-card p-2">
          <div className="font-mono text-[10px] text-muted-foreground">{it.l}</div>
          <div className="scada-value text-lg text-primary">{it.v}<span className="ml-1 text-[10px] text-muted-foreground">{it.u}</span></div>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, data, keys }: { title: string; data: any[]; keys: { k: string; c: string }[] }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="h-40">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="#1f263a" strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke="#5d6680" fontSize={10} />
            <YAxis stroke="#5d6680" fontSize={10} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ background: "#0d111c", border: "1px solid #2a3148", fontSize: 11 }} />
            {keys.map((k) => (
              <Line key={k.k} type="monotone" dataKey={k.k} stroke={k.c} strokeWidth={2} dot={false} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ControllerPanel() {
  const s = useSim();
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-card p-3">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">PIC-103 · Discharge Pressure</div>
        <div className="flex items-center justify-between text-xs">
          <span>Mode</span>
          <button
            onClick={() => useSim.getState().setPID({ pidAuto: !s.pidAuto })}
            className={`rounded px-3 py-1 font-mono text-xs ${s.pidAuto ? "bg-[var(--success)]/20 text-[var(--success)]" : "bg-[var(--warning)]/20 text-[var(--warning)]"}`}
          >
            {s.pidAuto ? "AUTO" : "MANUAL"}
          </button>
        </div>
        <Row k="SP" v={`${s.setpoint.toFixed(1)} bar`} />
        <Row k="PV" v={`${s.discharge.toFixed(2)} bar`} />
        <Row k="OUT (PV-101)" v={`${s.pvOpen.toFixed(1)} %`} />
        <input
          type="range" min={50} max={130} value={s.setpoint}
          onChange={(e) => useSim.getState().setPID({ setpoint: +e.target.value })}
          className="mt-2 w-full accent-[var(--primary)]"
        />
        {!s.pidAuto && (
          <input
            type="range" min={0} max={100} value={s.pvOpen}
            onChange={(e) => useSim.getState().setValve("pv", +e.target.value)}
            className="mt-2 w-full accent-[var(--warning)]"
          />
        )}
      </div>

      <div className="rounded-md border border-border bg-card p-3">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Compressor K-101</div>
        <div className="flex gap-2">
          <button onClick={() => useSim.getState().startCompressor()} className="flex-1 rounded bg-[var(--success)]/20 px-3 py-2 text-xs text-[var(--success)]">START</button>
          <button onClick={() => useSim.getState().stopCompressor()} className="flex-1 rounded bg-[var(--danger)]/20 px-3 py-2 text-xs text-[var(--danger)]">STOP</button>
        </div>
      </div>

      <AlarmList />
    </div>
  );
}

function AlarmList() {
  const alarms = useSim((s) => s.alarms);
  const ack = useSim((s) => s.ackAlarm);
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Alarms <span className="text-[var(--danger)]">{alarms.filter((a) => !a.ack).length} active</span>
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {alarms.length === 0 && <div className="py-4 text-center text-xs text-muted-foreground">No alarms</div>}
        {alarms.map((a) => {
          const color = a.level === "critical" ? "var(--danger)" : a.level === "high" ? "var(--warning)" : "var(--success)";
          return (
            <div key={a.id} className="flex items-center gap-2 rounded border border-border/60 p-2 font-mono text-[11px]">
              <span className={`h-2 w-2 rounded-full ${a.ack ? "" : "animate-alarm"}`} style={{ background: color }} />
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ color }}>{a.tag} · {a.description}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(a.ts).toLocaleTimeString()}</div>
              </div>
              {!a.ack && <button onClick={() => ack(a.id)} className="rounded bg-muted px-2 py-0.5 text-[10px] hover:bg-accent">ACK</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-1 font-mono text-xs">
      <span className="text-muted-foreground">{k}</span><span className="text-foreground">{v}</span>
    </div>
  );
}
