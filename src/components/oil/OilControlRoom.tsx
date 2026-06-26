import { useOilSim } from "@/lib/sim/oilStore";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function OilControlRoom() {
  const s = useOilSim();
  const data = s.trend.map((p) => ({ ...p, t: new Date(p.t).toLocaleTimeString().slice(3, 8) }));

  return (
    <div className="grid h-full gap-3 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <Kpis />
        <ChartCard title="Crude Flow (m³/h)" data={data} keys={[{ k: "crudeFlow", c: "#ff8a4d" }]} />
        <div className="grid gap-3 sm:grid-cols-2">
          <ChartCard title="BS&W % (target < 0.5)" data={data} keys={[{ k: "bsw", c: "#ffcc00" }]} />
          <ChartCard title="Tank Level %" data={data} keys={[{ k: "tankLevel", c: "#ff8a4d" }]} />
          <ChartCard title="HX Outlet Temp (°C)" data={data} keys={[{ k: "hxOut", c: "#ff5577" }]} />
          <ChartCard title="Pump Efficiency %" data={data} keys={[{ k: "pumpEff", c: "#00ff88" }]} />
        </div>
      </div>
      <Controllers />
    </div>
  );
}

function Kpis() {
  const s = useOilSim();
  const items: { l: string; v: string; u: string }[] = [
    { l: "WH PRESS", v: s.wellPressure.toFixed(0), u: "bar" },
    { l: "SEP OIL", v: s.oilLevel.toFixed(0), u: "%" },
    { l: "SEP H₂O", v: s.waterLevel.toFixed(0), u: "%" },
    { l: "CRUDE Q", v: s.crudeFlow.toFixed(0), u: "m³/h" },
    { l: "PUMP ΔP", v: s.pumpDP.toFixed(1), u: "bar" },
    { l: "BS&W", v: s.bswOut.toFixed(2), u: "%" },
    { l: "TK LVL", v: s.tankLevel.toFixed(0), u: "%" },
    { l: "EXP T", v: s.hxCrudeOut.toFixed(0), u: "°C" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
      {items.map((it) => (
        <div key={it.l} className="rounded-md border border-border bg-card p-2">
          <div className="font-mono text-[10px] text-muted-foreground">{it.l}</div>
          <div className="scada-value text-base text-primary">{it.v}<span className="ml-1 text-[10px] text-muted-foreground">{it.u}</span></div>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, data, keys }: { title: string; data: any[]; keys: { k: string; c: string }[] }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="h-36">
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

function Controllers() {
  const s = useOilSim();
  const set = useOilSim((x) => x.setController);
  return (
    <div className="space-y-3">
      <Loop title="LIC-201 · Oil Level" auto={s.lic201Auto} sp={s.lic201SP} pv={s.oilLevel} unit="%" min={20} max={80}
        onAuto={(v) => set({ lic201Auto: v })} onSP={(v) => set({ lic201SP: v })} />
      <Loop title="LIC-202 · Water Level" auto={s.lic202Auto} sp={s.lic202SP} pv={s.waterLevel} unit="%" min={15} max={60}
        onAuto={(v) => set({ lic202Auto: v })} onSP={(v) => set({ lic202SP: v })} />
      <Loop title="FIC-201 · Crude Flow" auto={s.fic201Auto} sp={s.fic201SP} pv={s.crudeFlow} unit="m³/h" min={50} max={230}
        onAuto={(v) => set({ fic201Auto: v })} onSP={(v) => set({ fic201SP: v })} />
      <Loop title="TIC-201 · HX Outlet Temp" auto={s.tic201Auto} sp={s.tic201SP} pv={s.hxCrudeOut} unit="°C" min={60} max={140}
        onAuto={(v) => set({ tic201Auto: v })} onSP={(v) => set({ tic201SP: v })} />

      <div className="rounded-md border border-border bg-card p-3">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">P-201 Pump</div>
        <div className="flex gap-2">
          <button onClick={() => useOilSim.getState().startPump()} className="flex-1 rounded bg-[var(--success)]/20 px-3 py-2 text-xs text-[var(--success)]">START</button>
          <button onClick={() => useOilSim.getState().stopPump()} className="flex-1 rounded bg-[var(--danger)]/20 px-3 py-2 text-xs text-[var(--danger)]">STOP</button>
        </div>
      </div>
      <AlarmList />
    </div>
  );
}

function Loop({ title, auto, sp, pv, unit, min, max, onAuto, onSP }: {
  title: string; auto: boolean; sp: number; pv: number; unit: string; min: number; max: number;
  onAuto: (v: boolean) => void; onSP: (v: number) => void;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{title}</div>
        <button onClick={() => onAuto(!auto)} className={`rounded px-2 py-0.5 font-mono text-[10px] ${auto ? "bg-[var(--success)]/20 text-[var(--success)]" : "bg-[var(--warning)]/20 text-[var(--warning)]"}`}>
          {auto ? "AUTO" : "MAN"}
        </button>
      </div>
      <div className="flex justify-between font-mono text-xs">
        <span className="text-muted-foreground">SP</span><span>{sp.toFixed(1)} {unit}</span>
      </div>
      <div className="flex justify-between font-mono text-xs">
        <span className="text-muted-foreground">PV</span><span className="text-primary">{pv.toFixed(1)} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={0.5} value={sp} onChange={(e) => onSP(+e.target.value)} className="mt-2 w-full accent-[var(--primary)]" />
    </div>
  );
}

function AlarmList() {
  const alarms = useOilSim((s) => s.alarms);
  const ack = useOilSim((s) => s.ackAlarm);
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
