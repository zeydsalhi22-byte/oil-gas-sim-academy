import { useSim, mA, levelOf } from "@/lib/sim/store";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const colorFor = (lvl: ReturnType<typeof levelOf>) =>
  lvl === "critical" ? "var(--danger)" : lvl === "high" ? "var(--warning)" : "var(--success)";

export function PlantView() {
  const s = useSim();
  const select = useSim((s) => s.setSelected);

  const wellLvl = levelOf(s.wellPressure, 60, 110, 40, 130);
  const sepLvlA = levelOf(s.sepLevel, 20, 80, 10, 90);
  const dischLvl = levelOf(s.discharge, 50, 120, 30, 140);
  const tempLvl = levelOf(s.compTemp, 50, 110, 40, 130);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-[#0d111c]">
      <svg viewBox="0 0 1000 560" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="metal" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3a4258" />
            <stop offset="0.5" stopColor="#1c2235" />
            <stop offset="1" stopColor="#0e1322" />
          </linearGradient>
          <linearGradient id="liquid" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ff8c00" />
            <stop offset="1" stopColor="#7a3a00" />
          </linearGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#1a2030" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="1000" height="560" fill="url(#grid)" />

        {/* Pipelines */}
        <Pipe d="M 130 200 L 260 200" color={colorFor(wellLvl)} />
        <Pipe d="M 410 240 L 540 240 L 540 320" color={colorFor(sepLvlA)} />
        <Pipe d="M 410 200 L 540 200 L 660 200" color={colorFor(wellLvl)} />
        <Pipe d="M 780 200 L 880 200 L 880 320" color={colorFor(dischLvl)} />
        <Pipe d="M 720 380 L 720 440" color={colorFor(sepLvlA)} />

        {/* Well Head */}
        <g onClick={() => select("well")} className="cursor-pointer">
          <rect x="80" y="180" width="50" height="180" fill="url(#metal)" stroke="#2a3148" />
          <rect x="70" y="140" width="70" height="40" rx="4" fill="url(#metal)" stroke="#2a3148" />
          <circle cx="105" cy="160" r="8" fill={colorFor(wellLvl)} className="pulse-glow" style={{ color: colorFor(wellLvl) }} />
          <text x="105" y="395" textAnchor="middle" className="scada-value" fill="#9aa3b8" fontSize="11">WH-101</text>
          <text x="105" y="415" textAnchor="middle" className="scada-value" fill={colorFor(wellLvl)} fontSize="13">{s.wellPressure.toFixed(1)} bar</text>
        </g>
        <SensorDot x={170} y={200} type="PT" id="PT-101" />

        {/* Separator */}
        <g onClick={() => select("sep")} className="cursor-pointer">
          <rect x="260" y="150" width="150" height="220" rx="60" fill="url(#metal)" stroke="#2a3148" />
          {/* liquid fill */}
          <clipPath id="sepClip"><rect x="262" y="152" width="146" height="216" rx="58" /></clipPath>
          <rect
            x="260"
            y={150 + 220 - (s.sepLevel / 100) * 218}
            width="150"
            height={(s.sepLevel / 100) * 218}
            fill="url(#liquid)"
            opacity="0.85"
            clipPath="url(#sepClip)"
          />
          <line x1="260" y1={150 + 220 - (s.sepLevel / 100) * 218} x2="410" y2={150 + 220 - (s.sepLevel / 100) * 218} stroke="#ffdd99" strokeWidth="1.5" opacity="0.7" />
          <text x="335" y="395" textAnchor="middle" className="scada-value" fill="#9aa3b8" fontSize="11">V-101  Separator</text>
          <text x="335" y="415" textAnchor="middle" className="scada-value" fill={colorFor(sepLvlA)} fontSize="13">L {s.sepLevel.toFixed(0)}% · P {s.sepPressure.toFixed(1)}</text>
        </g>
        <SensorDot x={420} y={170} type="LT" id="LT-101" />
        <SensorDot x={420} y={220} type="PT" id="PT-102" />

        {/* FV valve before compressor */}
        <Valve x={620} y={185} open={s.fvOpen} id="FV-101" onClick={() => select("fv")} />

        {/* Compressor */}
        <g onClick={() => select("comp")} className="cursor-pointer">
          <rect x="660" y="170" width="120" height="60" rx="30" fill="url(#metal)" stroke="#2a3148" />
          <circle cx="720" cy="200" r="22" fill="#0c111e" stroke="#2a3148" />
          <g className={s.compRunning ? "animate-spin-slow" : ""} style={{ transformOrigin: "720px 200px" }}>
            <rect x="717" y="180" width="6" height="40" fill="#ff6b00" />
            <rect x="700" y="197" width="40" height="6" fill="#ff6b00" />
          </g>
          <text x="720" y="255" textAnchor="middle" className="scada-value" fill="#9aa3b8" fontSize="11">K-101</text>
          <text x="720" y="272" textAnchor="middle" className="scada-value" fill={colorFor(dischLvl)} fontSize="12">{s.discharge.toFixed(1)} bar · {s.rpm.toFixed(0)} rpm</text>
        </g>
        <SensorDot x={680} y={170} type="PT" id="PT-103-S" />
        <SensorDot x={780} y={170} type="PT" id="PT-103" />
        <SensorDot x={760} y={230} type="TT" id="TT-102" />

        {/* PV recycle valve */}
        <Valve x={540} y={280} open={s.pvOpen} id="PV-101" onClick={() => select("pv")} />

        {/* Treatment column */}
        <g onClick={() => select("treat")} className="cursor-pointer">
          <rect x="850" y="320" width="60" height="180" rx="6" fill="url(#metal)" stroke="#2a3148" />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1="850" y1={355 + i * 40} x2="910" y2={355 + i * 40} stroke="#2a3148" />
          ))}
          <text x="880" y="520" textAnchor="middle" className="scada-value" fill="#9aa3b8" fontSize="11">T-101</text>
          <text x="880" y="538" textAnchor="middle" className="scada-value" fill="var(--success)" fontSize="12">{s.purity.toFixed(2)}%</text>
        </g>

        {/* LV liquid drain */}
        <Valve x={720} y={410} open={s.lvOpen} id="LV-101" onClick={() => select("lv")} />
        <text x="755" y="480" className="scada-value" fill="#9aa3b8" fontSize="10">to drain</text>
      </svg>

      <Legend />
      <DetailPanel />
    </div>
  );
}

function Pipe({ d, color }: { d: string; color: string }) {
  return (
    <g>
      <path d={d} stroke="#2a3148" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d={d} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" className="flow-pipe" opacity="0.9" />
    </g>
  );
}

function SensorDot({ x, y, type, id }: { x: number; y: number; type: "PT" | "TT" | "FT" | "LT"; id: string }) {
  const colors: Record<string, string> = { PT: "#3aa0ff", TT: "#ff5577", FT: "#00ff88", LT: "#ff9a3c" };
  const select = useSim((s) => s.setSelected);
  return (
    <g onClick={(e) => { e.stopPropagation(); select(id); }} className="cursor-pointer">
      <circle cx={x} cy={y} r="10" fill={colors[type]} opacity="0.25" />
      <circle cx={x} cy={y} r="6" fill={colors[type]} />
      <text x={x} y={y + 22} textAnchor="middle" fill="#7d869c" fontSize="9" className="scada-value">{type}</text>
    </g>
  );
}

function Valve({ x, y, open, id, onClick }: { x: number; y: number; open: number; id: string; onClick: () => void }) {
  return (
    <g onClick={(e) => { e.stopPropagation(); onClick(); }} className="cursor-pointer">
      <rect x={x - 18} y={y - 18} width="36" height="36" rx="4" fill="url(#metal)" stroke="#2a3148" />
      <polygon points={`${x - 12},${y + 12} ${x + 12},${y + 12} ${x},${y - 12}`} fill={open > 50 ? "var(--success)" : open > 10 ? "var(--warning)" : "var(--danger)"} opacity="0.8" />
      <rect x={x - 3} y={y - 30} width="6" height="14" fill="#3a4258" />
      <text x={x} y={y + 32} textAnchor="middle" fill="#9aa3b8" fontSize="9" className="scada-value">{id}</text>
      <text x={x} y={y + 44} textAnchor="middle" fill="#e6e8ee" fontSize="10" className="scada-value">{open.toFixed(0)}%</text>
    </g>
  );
}

function Legend() {
  return (
    <div className="pointer-events-none absolute left-2 top-2 rounded-md border border-border bg-card/80 p-2 font-mono text-[10px] backdrop-blur">
      <div className="mb-1 text-muted-foreground">SENSORS</div>
      <div className="flex flex-wrap gap-2 text-foreground">
        <span><span className="inline-block h-2 w-2 rounded-full bg-[#3aa0ff]" /> PT</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-[#ff5577]" /> TT</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-[#00ff88]" /> FT</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-[#ff9a3c]" /> LT</span>
      </div>
    </div>
  );
}

function DetailPanel() {
  const s = useSim();
  const id = s.selected;
  const close = () => s.setSelected(null);
  if (!id) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 320, opacity: 0 }}
        className="absolute right-2 top-2 z-10 w-72 rounded-lg border border-border bg-card/95 p-3 backdrop-blur"
      >
        <div className="flex items-center justify-between">
          <h4 className="font-mono text-xs uppercase tracking-widest text-primary">{id}</h4>
          <button onClick={close} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-2 space-y-1 font-mono text-xs">
          {renderDetail(id, s)}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Row({ k, v, c }: { k: string; v: string | number; c?: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span style={{ color: c }}>{typeof v === "number" ? v.toFixed(2) : v}</span>
    </div>
  );
}

function renderDetail(id: string, s: ReturnType<typeof useSim.getState>) {
  if (id === "well") return <><Row k="Wellhead Pressure" v={`${s.wellPressure.toFixed(1)} bar`} /><Row k="Temperature" v={`${s.wellTemp.toFixed(1)} °C`} /><Row k="Status" v="OPEN" c="var(--success)" /></>;
  if (id === "sep") return <><Row k="Level" v={`${s.sepLevel.toFixed(1)} %`} /><Row k="Pressure" v={`${s.sepPressure.toFixed(2)} bar`} /><Row k="Temp" v={`${s.sepTemp.toFixed(1)} °C`} /><Row k="Gas Out" v={`${s.gasFlow.toFixed(0)} m³/h`} /><Row k="Liq Out" v={`${s.liqFlow.toFixed(1)} m³/h`} /></>;
  if (id === "comp") return <><Row k="Suction" v={`${s.suction.toFixed(2)} bar`} /><Row k="Discharge" v={`${s.discharge.toFixed(2)} bar`} /><Row k="RPM" v={s.rpm.toFixed(0)} /><Row k="Temp" v={`${s.compTemp.toFixed(1)} °C`} /><Row k="Power" v={`${s.power.toFixed(0)} kW`} /><Row k="Status" v={s.compRunning ? "RUNNING" : "STOPPED"} c={s.compRunning ? "var(--success)" : "var(--danger)"} /></>;
  if (id === "treat") return <><Row k="Inlet" v="CH4 + H2O + CO2" /><Row k="Outlet Purity" v={`${s.purity.toFixed(2)} %`} c="var(--success)" /><Row k="Top Temp" v="38 °C" /><Row k="Bottom Temp" v="92 °C" /></>;
  if (id === "pv" || id === "fv" || id === "lv") {
    const open = id === "pv" ? s.pvOpen : id === "fv" ? s.fvOpen : s.lvOpen;
    const dp = id === "pv" ? Math.abs(s.discharge - s.suction) : 1.5;
    const cv = 25;
    return <><Row k="Position" v={`${open.toFixed(1)} %`} /><Row k="Cv" v={cv} /><Row k="ΔP" v={`${dp.toFixed(2)} bar`} /><Row k="Flow" v={`${(cv * Math.sqrt(dp) * (open / 100)).toFixed(1)} m³/h`} /></>;
  }
  // sensors
  const map: Record<string, [number, number, number]> = {
    "PT-101": [s.wellPressure, 0, 150],
    "PT-102": [s.sepPressure, 0, 100],
    "PT-103": [s.discharge, 0, 200],
    "PT-103-S": [s.suction, 0, 100],
    "TT-102": [s.compTemp, 0, 200],
    "LT-101": [s.sepLevel, 0, 100],
  };
  const d = map[id];
  if (d) {
    const [v, lo, hi] = d;
    return <><Row k="Process Value" v={v} /><Row k="Range" v={`${lo} – ${hi}`} /><Row k="Signal" v={`${mA(v, lo, hi).toFixed(2)} mA`} c="var(--primary)" /><Row k="LO / HI" v={`${(lo + (hi - lo) * 0.1).toFixed(0)} / ${(lo + (hi - lo) * 0.9).toFixed(0)}`} /></>;
  }
  return <Row k="info" v="—" />;
}
