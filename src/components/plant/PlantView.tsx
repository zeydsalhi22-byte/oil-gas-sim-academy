import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSim, mA, levelOf } from "@/lib/sim/store";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";

const VBW = 1100;
const VBH = 620;


const colorFor = (lvl: ReturnType<typeof levelOf>) =>
  lvl === "critical" ? "var(--danger)" : lvl === "high" ? "var(--warning)" : "var(--success)";

export function PlantView() {
  const s = useSim();
  const select = useSim((s) => s.setSelected);
  const [zoom, setZoom] = useState(1);

  const wellLvl = levelOf(s.wellPressure, 60, 110, 40, 130);
  const sepLvlA = levelOf(s.sepLevel, 20, 80, 10, 90);
  const dischLvl = levelOf(s.discharge, 50, 120, 30, 140);

  // pipe paths (M ... L ...) — IDs referenced by particle animateMotion
  const pipes = {
    p1: "M 130 280 L 290 280",                          // well -> separator
    p2: "M 470 260 L 600 260 L 720 260",                // separator gas -> FV -> compressor
    p3: "M 870 260 L 960 260 L 960 400",                // compressor -> treatment
    p4: "M 470 360 L 600 360 L 600 470 L 770 470",     // separator liquid -> LV drain
    p5: "M 600 320 L 600 380",                          // recycle PV from discharge to suction (visual)
  };

  return (
    <div className="relative h-full w-full overflow-auto bg-[#0a0e1a]">
      <svg viewBox="0 0 1100 620" className="block" preserveAspectRatio="xMidYMid meet" style={{ height: "100%", width: "auto", minWidth: "100%", transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform .2s" }}>


        <defs>
          <linearGradient id="metal" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#4a5470" />
            <stop offset="0.5" stopColor="#222a40" />
            <stop offset="1" stopColor="#0e1322" />
          </linearGradient>
          <linearGradient id="vessel" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#1a2030" />
            <stop offset="0.4" stopColor="#4a5470" />
            <stop offset="0.6" stopColor="#4a5470" />
            <stop offset="1" stopColor="#1a2030" />
          </linearGradient>
          <linearGradient id="liquid" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffa64d" />
            <stop offset="1" stopColor="#6a2e00" />
          </linearGradient>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0H0V50" fill="none" stroke="#161c2c" strokeWidth="0.8" />
          </pattern>
          {/* invisible motion paths */}
          <path id="mp1" d={pipes.p1} />
          <path id="mp2" d={pipes.p2} />
          <path id="mp3" d={pipes.p3} />
          <path id="mp4" d={pipes.p4} />
        </defs>
        <rect width="1100" height="620" fill="url(#grid)" />

        {/* Pipelines (thicker) */}
        <Pipe d={pipes.p1} color={colorFor(wellLvl)} />
        <Pipe d={pipes.p2} color={colorFor(wellLvl)} />
        <Pipe d={pipes.p3} color={colorFor(dischLvl)} />
        <Pipe d={pipes.p4} color={colorFor(sepLvlA)} />

        {/* Flow particles — visualise gas direction */}
        <FlowParticles href="#mp1" color={colorFor(wellLvl)} count={4} dur={3} />
        <FlowParticles href="#mp2" color={colorFor(wellLvl)} count={5} dur={2.6} />
        <FlowParticles href="#mp3" color={colorFor(dischLvl)} count={5} dur={2.4} />
        <FlowParticles href="#mp4" color="#ffa64d" count={3} dur={4} liquid />

        {/* ===== Well Head ===== */}
        <g onClick={() => select("well")} className="cursor-pointer">
          <rect x="55" y="240" width="80" height="220" fill="url(#metal)" stroke="#3a4258" strokeWidth="1.5" />
          {/* Christmas tree */}
          <rect x="40" y="170" width="110" height="20" rx="4" fill="url(#metal)" stroke="#3a4258" />
          <rect x="60" y="190" width="70" height="50" fill="url(#metal)" stroke="#3a4258" />
          <rect x="80" y="150" width="30" height="22" fill="url(#metal)" />
          <circle cx="95" cy="180" r="11" fill={colorFor(wellLvl)} className="pulse-glow" style={{ color: colorFor(wellLvl) }} />
          {/* hand wheel */}
          <circle cx="40" cy="215" r="14" fill="none" stroke="#ff6b00" strokeWidth="3" />
          <line x1="26" y1="215" x2="54" y2="215" stroke="#ff6b00" strokeWidth="3" />
          <line x1="40" y1="201" x2="40" y2="229" stroke="#ff6b00" strokeWidth="3" />
          <text x="95" y="490" textAnchor="middle" fill="#9aa3b8" fontSize="14" className="scada-value">WH-101</text>
          <text x="95" y="510" textAnchor="middle" fill={colorFor(wellLvl)} fontSize="15" className="scada-value">{s.wellPressure.toFixed(1)} bar</text>
        </g>
        <SensorDot x={200} y={280} type="PT" id="PT-101" />

        {/* ===== Vertical Separator V-101 (realistic) ===== */}
        <g onClick={() => select("sep")} className="cursor-pointer">
          {/* Skirt / support */}
          <rect x="335" y="470" width="100" height="60" fill="url(#metal)" stroke="#3a4258" />
          <line x1="345" y1="470" x2="345" y2="530" stroke="#1a2030" strokeWidth="2" />
          <line x1="425" y1="470" x2="425" y2="530" stroke="#1a2030" strokeWidth="2" />
          {/* Bottom elliptical head */}
          <path d="M 290 460 A 90 30 0 0 0 480 460 Z" fill="url(#vessel)" stroke="#3a4258" strokeWidth="1.5" />
          {/* Cylindrical shell */}
          <rect x="290" y="170" width="190" height="290" fill="url(#vessel)" stroke="#3a4258" strokeWidth="1.5" />
          {/* Top elliptical head */}
          <path d="M 290 170 A 90 30 0 0 1 480 170 Z" fill="url(#vessel)" stroke="#3a4258" strokeWidth="1.5" />
          {/* Liquid fill inside shell */}
          <clipPath id="sepClip"><rect x="291" y="171" width="188" height="289" /></clipPath>
          <g clipPath="url(#sepClip)">
            <rect
              x="290"
              y={460 - (s.sepLevel / 100) * 280}
              width="190"
              height={(s.sepLevel / 100) * 280 + 10}
              fill="url(#liquid)"
              opacity="0.9"
            />
            <line x1="290" y1={460 - (s.sepLevel / 100) * 280} x2="480" y2={460 - (s.sepLevel / 100) * 280} stroke="#ffe1b3" strokeWidth="2" opacity="0.8" />
          </g>
          {/* Sight glass */}
          <rect x="455" y="200" width="10" height="240" fill="#0a0e1a" stroke="#3a4258" />
          <rect x="455" y={440 - (s.sepLevel / 100) * 240} width="10" height={(s.sepLevel / 100) * 240} fill="#ffa64d" opacity="0.9" />
          {/* Nozzles */}
          <rect x="280" y="270" width="14" height="22" fill="#3a4258" />
          <rect x="476" y="250" width="14" height="22" fill="#3a4258" />
          <rect x="476" y="350" width="14" height="22" fill="#3a4258" />
          {/* Manway */}
          <circle cx="385" cy="230" r="16" fill="none" stroke="#3a4258" strokeWidth="2" />
          {[0,1,2,3,4,5].map(i => <circle key={i} cx={385 + 14*Math.cos(i*Math.PI/3)} cy={230 + 14*Math.sin(i*Math.PI/3)} r="1.5" fill="#3a4258" />)}
          {/* Label plate */}
          <rect x="350" y="310" width="70" height="26" fill="#0a0e1a" stroke="#3a4258" />
          <text x="385" y="328" textAnchor="middle" fill="#ff6b00" fontSize="13" className="scada-value">V-101</text>

          <text x="385" y="560" textAnchor="middle" fill="#9aa3b8" fontSize="14" className="scada-value">Separator V-101</text>
          <text x="385" y="580" textAnchor="middle" fill={colorFor(sepLvlA)} fontSize="14" className="scada-value">L {s.sepLevel.toFixed(0)}%  ·  P {s.sepPressure.toFixed(1)} bar</text>
        </g>
        <SensorDot x={500} y={260} type="LT" id="LT-101" />
        <SensorDot x={500} y={360} type="PT" id="PT-102" />

        {/* FV valve before compressor */}
        <Valve x={660} y={260} open={s.fvOpen} id="FV-101" onClick={() => select("fv")} />

        {/* ===== Compressor K-101 (larger) ===== */}
        <g onClick={() => select("comp")} className="cursor-pointer">
          {/* Base skid */}
          <rect x="715" y="320" width="160" height="20" fill="#1a2030" stroke="#3a4258" />
          {/* Motor */}
          <rect x="715" y="220" width="60" height="100" rx="6" fill="url(#metal)" stroke="#3a4258" strokeWidth="1.5" />
          {[0,1,2,3,4].map(i => <line key={i} x1="722" y1={235+i*16} x2="768" y2={235+i*16} stroke="#1a2030" strokeWidth="1.5" />)}
          {/* Compressor body */}
          <rect x="775" y="210" width="100" height="110" rx="10" fill="url(#metal)" stroke="#3a4258" strokeWidth="1.5" />
          {/* Coupling */}
          <rect x="770" y="255" width="10" height="20" fill="#ff6b00" />
          {/* Impeller window */}
          <circle cx="825" cy="265" r="34" fill="#0a0e1a" stroke="#3a4258" strokeWidth="2" />
          <g className={s.compRunning ? "animate-spin-slow" : ""} style={{ transformOrigin: "825px 265px" }}>
            <rect x="822" y="234" width="6" height="62" fill="#ff6b00" />
            <rect x="794" y="262" width="62" height="6" fill="#ff6b00" />
            <rect x="803" y="243" width="44" height="6" fill="#ff8a30" transform="rotate(45 825 265)" />
            <rect x="803" y="281" width="44" height="6" fill="#ff8a30" transform="rotate(45 825 265)" />
          </g>
          <circle cx="825" cy="265" r="6" fill="#3a4258" />
          {/* Discharge stub */}
          <rect x="870" y="252" width="14" height="22" fill="#3a4258" />
          <text x="825" y="365" textAnchor="middle" fill="#9aa3b8" fontSize="14" className="scada-value">Compressor K-101</text>
          <text x="825" y="385" textAnchor="middle" fill={colorFor(dischLvl)} fontSize="14" className="scada-value">{s.discharge.toFixed(1)} bar · {s.rpm.toFixed(0)} rpm</text>
        </g>
        <SensorDot x={755} y={210} type="PT" id="PT-103-S" />
        <SensorDot x={875} y={210} type="PT" id="PT-103" />
        <SensorDot x={875} y={310} type="TT" id="TT-102" />

        {/* PV recycle valve */}
        <Valve x={600} y={350} open={s.pvOpen} id="PV-101" onClick={() => select("pv")} />

        {/* ===== Treatment column T-101 ===== */}
        <g onClick={() => select("treat")} className="cursor-pointer">
          {/* Top head */}
          <path d="M 920 400 A 50 18 0 0 1 1020 400 Z" fill="url(#vessel)" stroke="#3a4258" strokeWidth="1.5" />
          <rect x="920" y="400" width="100" height="180" fill="url(#vessel)" stroke="#3a4258" strokeWidth="1.5" />
          <path d="M 920 580 A 50 18 0 0 0 1020 580 Z" fill="url(#vessel)" stroke="#3a4258" strokeWidth="1.5" />
          {/* trays */}
          {[0,1,2,3,4].map(i => (
            <g key={i}>
              <line x1="920" y1={425+i*30} x2="1020" y2={425+i*30} stroke="#1a2030" strokeWidth="2" />
              <line x1="930" y1={425+i*30} x2="930" y2={425+i*30+8} stroke="#3a4258" />
              <line x1="1010" y1={425+i*30} x2="1010" y2={425+i*30+8} stroke="#3a4258" />
            </g>
          ))}
          <rect x="945" y="475" width="50" height="22" fill="#0a0e1a" stroke="#3a4258" />
          <text x="970" y="491" textAnchor="middle" fill="#ff6b00" fontSize="12" className="scada-value">T-101</text>
          <text x="970" y="610" textAnchor="middle" fill="var(--success)" fontSize="14" className="scada-value">{s.purity.toFixed(2)}% pure</text>
        </g>

        {/* LV liquid drain */}
        <Valve x={770} y={470} open={s.lvOpen} id="LV-101" onClick={() => select("lv")} />
        <text x={830} y={475} fill="#9aa3b8" fontSize="11" className="scada-value">→ drain</text>
      </svg>

      {/* Zoom controls */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
        <button onClick={() => setZoom(z => Math.min(2, +(z + 0.2).toFixed(2)))} className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 text-foreground hover:bg-muted backdrop-blur" aria-label="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.2).toFixed(2)))} className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 text-foreground hover:bg-muted backdrop-blur" aria-label="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button onClick={() => setZoom(1)} className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 text-foreground hover:bg-muted backdrop-blur" aria-label="Reset zoom">
          <Maximize2 className="h-4 w-4" />
        </button>
        <div className="rounded-md border border-border bg-card/90 px-1 py-0.5 text-center font-mono text-[10px] text-muted-foreground backdrop-blur">{Math.round(zoom * 100)}%</div>
      </div>

      <Legend />
      <DetailPanel />
    </div>
  );
}

function Pipe({ d, color }: { d: string; color: string }) {
  return (
    <g>
      <path d={d} stroke="#1a2030" strokeWidth="22" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke="#3a4258" strokeWidth="18" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" className="flow-pipe" opacity="0.85" />
    </g>
  );
}

function FlowParticles({ href, color, count, dur, liquid }: { href: string; color: string; count: number; dur: number; liquid?: boolean }) {
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => (
        <circle key={i} r={liquid ? 4 : 3.5} fill={color} opacity="0.95">
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${(i * dur) / count}s`} rotate="auto">
            <mpath href={href} />
          </animateMotion>
        </circle>
      ))}
    </g>
  );
}

function SensorDot({ x, y, type, id }: { x: number; y: number; type: "PT" | "TT" | "FT" | "LT"; id: string }) {
  const colors: Record<string, string> = { PT: "#3aa0ff", TT: "#ff5577", FT: "#00ff88", LT: "#ff9a3c" };
  const select = useSim((s) => s.setSelected);
  return (
    <g onClick={(e) => { e.stopPropagation(); select(id); }} className="cursor-pointer">
      <circle cx={x} cy={y} r="16" fill={colors[type]} opacity="0.18" />
      <circle cx={x} cy={y} r="10" fill={colors[type]} stroke="#0a0e1a" strokeWidth="2" />
      <text x={x} y={y + 4} textAnchor="middle" fill="#0a0e1a" fontSize="9" fontWeight="700" className="scada-value">{type}</text>
      <text x={x} y={y + 30} textAnchor="middle" fill="#7d869c" fontSize="10" className="scada-value">{id}</text>
    </g>
  );
}

function Valve({ x, y, open, id, onClick }: { x: number; y: number; open: number; id: string; onClick: () => void }) {
  const c = open > 50 ? "var(--success)" : open > 10 ? "var(--warning)" : "var(--danger)";
  return (
    <g onClick={(e) => { e.stopPropagation(); onClick(); }} className="cursor-pointer">
      {/* actuator on top */}
      <rect x={x - 14} y={y - 44} width="28" height="14" rx="2" fill="#3a4258" stroke="#1a2030" />
      <rect x={x - 4} y={y - 30} width="8" height="14" fill="#3a4258" />
      {/* valve body — bowtie */}
      <polygon points={`${x - 22},${y - 18} ${x},${y} ${x - 22},${y + 18}`} fill="url(#metal)" stroke="#1a2030" strokeWidth="1.5" />
      <polygon points={`${x + 22},${y - 18} ${x},${y} ${x + 22},${y + 18}`} fill="url(#metal)" stroke="#1a2030" strokeWidth="1.5" />
      <circle cx={x} cy={y} r="6" fill={c} className="pulse-glow" style={{ color: c }} />
      <text x={x} y={y + 36} textAnchor="middle" fill="#9aa3b8" fontSize="11" className="scada-value">{id}</text>
      <text x={x} y={y + 50} textAnchor="middle" fill="#e6e8ee" fontSize="11" className="scada-value">{open.toFixed(0)}%</text>
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
        className="absolute bottom-2 right-2 z-10 w-72 max-w-[calc(100vw-1rem)] rounded-lg border border-border bg-card/95 p-3 backdrop-blur sm:top-2 sm:bottom-auto"
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
