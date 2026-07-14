import { useLayoutEffect, useRef, useState } from "react";
import { useStorageSim } from "@/lib/sim/storageStore";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, X, Smartphone } from "lucide-react";

const VBW = 1800;
const VBH = 1000;

const OIL = "#ff8800";
const GAS = "#ffd11a";
const STG = "#00aa44";

type SensorType = "PT" | "TT" | "FT" | "LT";

/* Pipe geometry — same layout as before, keyed for motion paths */
const pipes = {
  inGas: "M 60 280 L 170 280 L 170 310",
  inOil: "M 60 360 L 170 360 L 170 330",
  manToTk1: "M 230 320 L 380 320 L 380 440",
  manToTk2: "M 380 320 L 720 320 L 720 440",
  tk1Out: "M 380 800 L 380 870 L 1000 870",
  tk2Out: "M 720 800 L 720 870",
  lvToPump: "M 1060 870 L 1180 870",
  pumpToMeter: "M 1260 870 L 1360 870",
  meterToXv: "M 1440 870 L 1540 870",
  xvToExport: "M 1590 870 L 1740 870",
  manToSph1: "M 230 320 L 1000 320 L 1000 460",
  manToSph2: "M 1000 320 L 1320 320 L 1320 460",
  sph1Out: "M 1000 620 L 1000 700 L 1180 700",
  sph2Out: "M 1320 620 L 1320 700 L 1180 700",
  compToMeterG: "M 1260 700 L 1360 700",
  meterToXvG: "M 1440 700 L 1540 700",
  xvToExportG: "M 1590 700 L 1740 700",
} as const;

export function StoragePlantView() {
  const s = useStorageSim();
  const setSelected = useStorageSim((x) => x.setSelected);
  const selected = useStorageSim((x) => x.selected);

  const ref = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [userZoom, setUserZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hideHint, setHideHint] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setBox({ w: e.contentRect.width, h: e.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ready = box.w > 0 && box.h > 0;
  const fit = ready ? Math.min(box.w / VBW, box.h / VBH) : 1;
  const scale = fit * userZoom;
  const tx = ready ? (box.w - VBW * scale) / 2 + pan.x : 0;
  const ty = ready ? (box.h - VBH * scale) / 2 + pan.y : 0;

  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) });
  };
  const onUp = () => {
    drag.current = null;
  };
  const reset = () => {
    setUserZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const sel = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(id);
  };

  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden bg-[#0a0e1a] touch-none select-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onClick={() => setSelected(null)}
      style={{ cursor: drag.current ? "grabbing" : "grab" }}
    >
      {!hideHint && (
        <div className="absolute left-2 right-2 top-2 z-20 flex items-center justify-between rounded border border-black/30 bg-black/70 px-2 py-1 font-mono text-[10px] text-white sm:hidden">
          <span className="flex items-center gap-1">
            <Smartphone className="h-3 w-3" /> Rotate phone for best view · pinch to zoom
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHideHint(true);
            }}
            className="opacity-70"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <svg
        viewBox={`0 0 ${VBW} ${VBH}`}
        width={VBW}
        height={VBH}
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
        }}
      >
        <defs>
          <linearGradient id="metal-stg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#4a5470" />
            <stop offset="0.5" stopColor="#222a40" />
            <stop offset="1" stopColor="#0e1322" />
          </linearGradient>
          <linearGradient id="vessel-stg" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#1a2030" />
            <stop offset="0.4" stopColor="#4a5470" />
            <stop offset="0.6" stopColor="#4a5470" />
            <stop offset="1" stopColor="#1a2030" />
          </linearGradient>
          <linearGradient id="liquid-stg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ff9933" />
            <stop offset="1" stopColor="#6a2e00" />
          </linearGradient>
          <linearGradient id="gas-stg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffeb3b" />
            <stop offset="1" stopColor="#f9a825" />
          </linearGradient>
          <pattern id="grid-stg" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0H0V50" fill="none" stroke="#161c2c" strokeWidth="0.8" />
          </pattern>
          {Object.entries(pipes).map(([k, d]) => (
            <path key={k} id={`mp-${k}`} d={d} />
          ))}
        </defs>

        <rect width={VBW} height={VBH} fill="url(#grid-stg)" />

        {/* Header bar (kept, restyled to SCADA typography) */}
        <rect x="0" y="0" width={VBW} height="56" fill="#0f1626" stroke="#232a3d" />
        <text x="20" y="36" fill={STG} fontSize="20" className="scada-value" fontWeight="700">
          STOCKAGE ET EXPEDITION · STG-01
        </text>
        <text
          x={VBW - 20}
          y="36"
          fill="#9aa3b8"
          fontSize="14"
          className="scada-value"
          textAnchor="end"
        >
          GAS &amp; OIL STORAGE TERMINAL
        </text>

        {/* === Pipes (3-layer style, matching Gas view) === */}
        <Pipe d={pipes.inGas} color={GAS} thin />
        <Pipe d={pipes.inOil} color={OIL} thin />
        <Pipe d={pipes.manToTk1} color={OIL} />
        <Pipe d={pipes.manToTk2} color={OIL} />
        <Pipe d={pipes.tk1Out} color={OIL} />
        <Pipe d={pipes.tk2Out} color={OIL} />
        <Pipe d={pipes.lvToPump} color={OIL} />
        <Pipe d={pipes.pumpToMeter} color={OIL} />
        <Pipe d={pipes.meterToXv} color={OIL} />
        <Pipe d={pipes.xvToExport} color={OIL} />
        <Pipe d={pipes.manToSph1} color={GAS} />
        <Pipe d={pipes.manToSph2} color={GAS} />
        <Pipe d={pipes.sph1Out} color={GAS} />
        <Pipe d={pipes.sph2Out} color={GAS} />
        <Pipe d={pipes.compToMeterG} color={GAS} />
        <Pipe d={pipes.meterToXvG} color={GAS} />
        <Pipe d={pipes.xvToExportG} color={GAS} />

        {/* Flow particles */}
        <FlowParticles href="#mp-inGas" color={GAS} count={3} dur={3} />
        <FlowParticles href="#mp-inOil" color={OIL} count={3} dur={3.5} liquid />
        <FlowParticles href="#mp-manToTk1" color={OIL} count={4} dur={3.4} liquid />
        <FlowParticles href="#mp-manToTk2" color={OIL} count={5} dur={3.6} liquid />
        <FlowParticles href="#mp-tk1Out" color={OIL} count={5} dur={3.8} liquid />
        <FlowParticles href="#mp-tk2Out" color={OIL} count={3} dur={3.4} liquid />
        <FlowParticles href="#mp-lvToPump" color={OIL} count={3} dur={2.8} liquid />
        <FlowParticles href="#mp-pumpToMeter" color={OIL} count={3} dur={2.4} liquid />
        <FlowParticles href="#mp-meterToXv" color={OIL} count={3} dur={2.6} liquid />
        <FlowParticles href="#mp-xvToExport" color={OIL} count={3} dur={2.6} liquid />
        <FlowParticles href="#mp-manToSph1" color={GAS} count={5} dur={3.4} />
        <FlowParticles href="#mp-manToSph2" color={GAS} count={5} dur={3.6} />
        <FlowParticles href="#mp-sph1Out" color={GAS} count={4} dur={3.2} />
        <FlowParticles href="#mp-sph2Out" color={GAS} count={4} dur={3.2} />
        <FlowParticles href="#mp-compToMeterG" color={GAS} count={3} dur={2.4} />
        <FlowParticles href="#mp-meterToXvG" color={GAS} count={3} dur={2.6} />
        <FlowParticles href="#mp-xvToExportG" color={GAS} count={3} dur={2.6} />

        {/* Inlet source labels */}
        <text x="60" y="268" fill="#9aa3b8" fontSize="12" className="scada-value">
          FROM GAS
        </text>
        <text x="60" y="382" fill="#9aa3b8" fontSize="12" className="scada-value">
          FROM OIL
        </text>

        {/* === MAN-301 inlet manifold === */}
        <g onClick={sel("MAN-301")} className="cursor-pointer">
          <rect
            x="170"
            y="270"
            width="60"
            height="100"
            rx="3"
            fill="url(#metal-stg)"
            stroke="#3a4258"
            strokeWidth="1.5"
          />
          <rect x="178" y="286" width="44" height="16" fill="#0a0e1a" stroke="#3a4258" />
          <text
            x="200"
            y="298"
            textAnchor="middle"
            fill={STG}
            fontSize="10"
            className="scada-value"
            fontWeight="700"
          >
            MAN-301
          </text>
          <text
            x="200"
            y="322"
            textAnchor="middle"
            fill="#e6e8ee"
            fontSize="11"
            className="scada-value"
          >
            {s.inletFlow.toFixed(0)}
          </text>
          <text
            x="200"
            y="336"
            textAnchor="middle"
            fill="#9aa3b8"
            fontSize="9"
            className="scada-value"
          >
            m³/h
          </text>
        </g>
        <SensorDot x={250} y={240} type="FT" id="FI-301" onClick={sel("FI-301")} />

        {/* MOV valves above tanks */}
        <Valve x={380} y={400} open={s.mov141} id="MOV-141" onClick={sel("MOV-141")} />
        <Valve x={720} y={400} open={s.mov142} id="MOV-142" onClick={sel("MOV-142")} />

        {/* Tanks */}
        <Tank
          x={300}
          y={440}
          tag="TK-301"
          level={s.tk301Level}
          temp={s.tk301Temp}
          capacity={s.tankCapacity}
          onClick={sel("TK-301")}
        />
        <Tank
          x={640}
          y={440}
          tag="TK-302"
          level={s.tk302Level}
          temp={s.tk302Temp}
          capacity={s.tankCapacity}
          onClick={sel("TK-302")}
        />

        {/* LV-301 outlet control + LIC bubble */}
        <Valve x={1030} y={870} open={s.lv301} id="LV-301" onClick={sel("LV-301")} />
        <g>
          <line x1={1030} y1={826} x2={1030} y2={782} stroke="#5a6478" strokeDasharray="4 3" />
          <circle cx={1030} cy={762} r="22" fill="#0a0e1a" stroke={STG} strokeWidth="1.5" />
          <text
            x={1030}
            y={758}
            textAnchor="middle"
            fill={STG}
            fontSize="11"
            className="scada-value"
            fontWeight="700"
          >
            LIC
          </text>
          <text
            x={1030}
            y={772}
            textAnchor="middle"
            fill={STG}
            fontSize="11"
            className="scada-value"
          >
            301
          </text>
        </g>

        {/* Pump P-301 & Compressor K-301 */}
        <Pump
          x={1220}
          y={870}
          tag="P-301"
          subtitle="CRUDE"
          running={s.p301}
          onClick={sel("P-301")}
        />
        <Compressor
          x={1220}
          y={700}
          tag="K-301"
          subtitle="GAS"
          running={s.p302}
          press={s.s301Press}
          onClick={sel("P-302")}
        />

        {/* Metering stations */}
        <Meter x={1400} y={870} tag="MS-301" flow={s.exportCrude} onClick={sel("MS-301")} />
        <Meter x={1400} y={700} tag="MS-302" flow={s.exportGas} onClick={sel("MS-302")} />

        {/* XV isolation valves */}
        <Valve x={1565} y={870} open={s.xv301} id="XV-301" onClick={sel("XV-301")} />
        <Valve x={1565} y={700} open={s.xv302} id="XV-302" onClick={sel("XV-302")} />

        {/* Export terminators */}
        <ExportBox
          x={1700}
          y={840}
          label="CRUDE"
          flow={`${s.exportCrude.toFixed(0)} m³/h`}
          color={OIL}
        />
        <ExportBox
          x={1700}
          y={670}
          label="GAS"
          flow={`${s.exportGas.toFixed(0)} m³/h`}
          color={GAS}
        />

        {/* PV-301 gas pressure control valve */}
        <Valve x={1160} y={320} open={s.pv301} id="PV-301" onClick={sel("PV-301")} />

        {/* Spheres */}
        <Sphere
          x={1000}
          y={540}
          tag="S-301"
          press={s.s301Press}
          level={s.s301Level}
          capacity={s.sphereCapacity}
          psv={s.psv301Open}
          onClick={sel("S-301")}
          onPsv={sel("PSV-301")}
        />
        <Sphere
          x={1320}
          y={540}
          tag="S-302"
          press={s.s302Press}
          level={s.s302Level}
          capacity={s.sphereCapacity}
          psv={s.psv302Open}
          onClick={sel("S-302")}
          onPsv={sel("PSV-302")}
        />

        {/* Sensor dots on pipes */}
        <SensorDot x={1080} y={300} type="PT" id="PT-302" onClick={sel("PT-302")} />
        <SensorDot x={1240} y={300} type="PT" id="PT-303" onClick={sel("PT-303")} />
        <SensorDot x={460} y={850} type="LT" id="LT-301" onClick={sel("LT-301")} />
        <SensorDot x={800} y={850} type="LT" id="LT-302" onClick={sel("LT-302")} />
        <SensorDot x={1490} y={840} type="FT" id="FT-301" onClick={sel("FT-301")} />

        {/* Status panel (bottom) */}
        <g>
          <rect
            x="20"
            y={VBH - 70}
            width={VBW - 40}
            height="50"
            rx="4"
            fill="#0f1626"
            stroke="#232a3d"
          />
          <StatusDot
            x={50}
            y={VBH - 45}
            ok={s.tk301Level <= 85}
            label={`TK-301 ${s.tk301Level.toFixed(0)}%`}
          />
          <StatusDot
            x={240}
            y={VBH - 45}
            ok={s.tk302Level <= 85}
            label={`TK-302 ${s.tk302Level.toFixed(0)}%`}
          />
          <StatusDot
            x={430}
            y={VBH - 45}
            ok={s.s301Press < 18}
            label={`S-301 ${s.s301Press.toFixed(1)} bar`}
          />
          <StatusDot
            x={620}
            y={VBH - 45}
            ok={s.s302Press < 18}
            label={`S-302 ${s.s302Press.toFixed(1)} bar`}
          />
          <text x={830} y={VBH - 40} fill="#9aa3b8" fontSize="12" className="scada-value">
            Total inv:
          </text>
          <text x={935} y={VBH - 40} fill={STG} fontSize="13" className="scada-value">
            {(
              ((s.tk301Level + s.tk302Level) / 100) * s.tankCapacity +
              ((s.s301Level + s.s302Level) / 100) * s.sphereCapacity
            ).toFixed(0)}{" "}
            m³
          </text>
          <text x={830} y={VBH - 25} fill="#9aa3b8" fontSize="12" className="scada-value">
            Daily export:
          </text>
          <text x={955} y={VBH - 25} fill={STG} fontSize="13" className="scada-value">
            {s.dailyExport.toFixed(0)} m³
          </text>
        </g>

        {/* PID indicator box */}
        <g>
          <rect
            x={VBW - 360}
            y={VBH - 170}
            width="320"
            height="90"
            rx="4"
            fill="#0f1626"
            stroke="#232a3d"
            strokeWidth="1.5"
          />
          <text
            x={VBW - 350}
            y={VBH - 150}
            fill={STG}
            fontSize="12"
            className="scada-value"
            fontWeight="700"
          >
            LIC-301 {s.licAuto ? "AUTO" : "MAN"}
          </text>
          <text x={VBW - 350} y={VBH - 132} fill="#e6e8ee" fontSize="11" className="scada-value">
            SP: {s.licSP.toFixed(0)}% PV: {s.tk301Level.toFixed(1)}%
          </text>
          <text x={VBW - 350} y={VBH - 116} fill="#e6e8ee" fontSize="11" className="scada-value">
            e: {(s.tk301Level - s.licSP).toFixed(2)} OUT(LV-301): {s.lv301.toFixed(0)}%
          </text>
          <text x={VBW - 350} y={VBH - 100} fill="#7d869c" fontSize="10" className="scada-value">
            Kp={s.kp.toFixed(2)} Ki={s.ki.toFixed(2)} Kd={s.kd.toFixed(2)}
          </text>
        </g>
      </svg>

      {/* Zoom controls (same style as Gas view) */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setUserZoom((z) => Math.min(4, +(z + 0.2).toFixed(2)));
          }}
          className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 text-foreground hover:bg-muted backdrop-blur"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setUserZoom((z) => Math.max(0.4, +(z - 0.2).toFixed(2)));
          }}
          className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 text-foreground hover:bg-muted backdrop-blur"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            reset();
          }}
          className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 text-foreground hover:bg-muted backdrop-blur"
          aria-label="Fit"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            reset();
          }}
          className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 text-foreground hover:bg-muted backdrop-blur"
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <div className="rounded-md border border-border bg-card/90 px-1 py-0.5 text-center font-mono text-[10px] text-muted-foreground backdrop-blur">
          {Math.round(scale * 100)}%
        </div>
      </div>

      <Legend />
      {selected && <DetailPanel id={selected} />}
    </div>
  );
}

/* ============== Primitives (mirrors Gas PlantView) ============== */

function Pipe({ d, color, thin }: { d: string; color: string; thin?: boolean }) {
  const outer = thin ? 14 : 22;
  const mid = thin ? 11 : 18;
  const inner = thin ? 4 : 6;
  return (
    <g>
      <path
        d={d}
        stroke="#1a2030"
        strokeWidth={outer}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        stroke="#3a4258"
        strokeWidth={mid}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        stroke={color}
        strokeWidth={inner}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flow-pipe"
        opacity="0.85"
      />
    </g>
  );
}

function FlowParticles({
  href,
  color,
  count,
  dur,
  liquid,
}: {
  href: string;
  color: string;
  count: number;
  dur: number;
  liquid?: boolean;
}) {
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => (
        <circle key={i} r={liquid ? 4 : 3.5} fill={color} opacity="0.95">
          <animateMotion
            dur={`${dur}s`}
            repeatCount="indefinite"
            begin={`${(i * dur) / count}s`}
            rotate="auto"
          >
            <mpath href={href} />
          </animateMotion>
        </circle>
      ))}
    </g>
  );
}

function SensorDot({
  x,
  y,
  type,
  id,
  onClick,
}: {
  x: number;
  y: number;
  type: SensorType;
  id: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const colors: Record<SensorType, string> = {
    PT: "#3aa0ff",
    TT: "#ff5577",
    FT: "#00ff88",
    LT: "#ff9a3c",
  };
  return (
    <g onClick={onClick} className="cursor-pointer">
      <circle cx={x} cy={y} r="16" fill={colors[type]} opacity="0.18" />
      <circle cx={x} cy={y} r="10" fill={colors[type]} stroke="#0a0e1a" strokeWidth="2" />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fill="#0a0e1a"
        fontSize="9"
        fontWeight="700"
        className="scada-value"
      >
        {type}
      </text>
      <text
        x={x}
        y={y + 30}
        textAnchor="middle"
        fill="#7d869c"
        fontSize="10"
        className="scada-value"
      >
        {id}
      </text>
    </g>
  );
}

function Valve({
  x,
  y,
  open,
  id,
  onClick,
}: {
  x: number;
  y: number;
  open: number;
  id: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const c = open > 50 ? "var(--success)" : open > 10 ? "var(--warning)" : "var(--danger)";
  return (
    <g onClick={onClick} className="cursor-pointer">
      {/* actuator */}
      <rect x={x - 14} y={y - 44} width="28" height="14" rx="2" fill="#3a4258" stroke="#1a2030" />
      <rect x={x - 4} y={y - 30} width="8" height="14" fill="#3a4258" />
      {/* bowtie body */}
      <polygon
        points={`${x - 22},${y - 18} ${x},${y} ${x - 22},${y + 18}`}
        fill="url(#metal-stg)"
        stroke="#1a2030"
        strokeWidth="1.5"
      />
      <polygon
        points={`${x + 22},${y - 18} ${x},${y} ${x + 22},${y + 18}`}
        fill="url(#metal-stg)"
        stroke="#1a2030"
        strokeWidth="1.5"
      />
      <circle cx={x} cy={y} r="6" fill={c} className="pulse-glow" style={{ color: c }} />
      <text
        x={x}
        y={y + 36}
        textAnchor="middle"
        fill="#9aa3b8"
        fontSize="11"
        className="scada-value"
      >
        {id}
      </text>
      <text
        x={x}
        y={y + 50}
        textAnchor="middle"
        fill="#e6e8ee"
        fontSize="11"
        className="scada-value"
      >
        {open.toFixed(0)}%
      </text>
    </g>
  );
}

function StatusDot({ x, y, ok, label }: { x: number; y: number; ok: boolean; label: string }) {
  const c = ok ? "var(--success)" : "var(--danger)";
  return (
    <g>
      <circle cx={x} cy={y} r="7" fill={c} className={ok ? "" : "animate-alarm"} />
      <text x={x + 14} y={y + 4} fill="#e6e8ee" fontSize="12" className="scada-value">
        {label}
      </text>
    </g>
  );
}

function Tank({
  x,
  y,
  tag,
  level,
  temp,
  capacity,
  onClick,
}: {
  x: number;
  y: number;
  tag: string;
  level: number;
  temp: number;
  capacity: number;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const W = 160,
    H = 320;
  const lvlY = y + H - (level / 100) * H;
  const danger = level > 85;
  const vol = (level / 100) * capacity;
  const clipId = `tk-clip-${tag}`;
  return (
    <g onClick={onClick} className="cursor-pointer">
      {/* skirt/base */}
      <rect x={x - 4} y={y + H} width={W + 8} height="18" fill="url(#metal-stg)" stroke="#3a4258" />
      {/* roof */}
      <ellipse
        cx={x + W / 2}
        cy={y}
        rx={W / 2}
        ry="14"
        fill="url(#metal-stg)"
        stroke="#3a4258"
        strokeWidth="1.5"
      />
      {/* shell */}
      <rect
        x={x}
        y={y}
        width={W}
        height={H}
        fill="url(#vessel-stg)"
        stroke="#3a4258"
        strokeWidth="1.5"
      />
      {/* liquid */}
      <clipPath id={clipId}>
        <rect x={x + 1} y={y + 1} width={W - 2} height={H - 2} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect x={x} y={lvlY} width={W} height={H} fill="url(#liquid-stg)" opacity="0.9" />
        <line
          x1={x}
          y1={lvlY}
          x2={x + W}
          y2={lvlY}
          stroke="#ffe1b3"
          strokeWidth="2"
          opacity="0.8"
        />
      </g>
      {/* Sight glass */}
      <rect x={x + W - 14} y={y + 10} width="8" height={H - 20} fill="#0a0e1a" stroke="#3a4258" />
      <rect x={x + W - 14} y={lvlY} width="8" height={y + H - 10 - lvlY} fill={OIL} opacity="0.9" />
      {/* Manway */}
      <circle cx={x + W / 2} cy={y + 40} r="10" fill="none" stroke="#3a4258" strokeWidth="1.5" />
      {/* Label plate */}
      <rect
        x={x + W / 2 - 30}
        y={y + H / 2 - 12}
        width="60"
        height="24"
        fill="#0a0e1a"
        stroke="#3a4258"
      />
      <text
        x={x + W / 2}
        y={y + H / 2 + 4}
        textAnchor="middle"
        fill={STG}
        fontSize="12"
        className="scada-value"
        fontWeight="700"
      >
        {tag}
      </text>
      {/* TI badge on roof */}
      <g>
        <rect
          x={x + W / 2 - 30}
          y={y - 36}
          width="60"
          height="20"
          rx="3"
          fill="#0a0e1a"
          stroke="#ff5577"
        />
        <text
          x={x + W / 2}
          y={y - 22}
          textAnchor="middle"
          fill="#ff5577"
          fontSize="11"
          className="scada-value"
        >
          TI {temp.toFixed(0)}°C
        </text>
      </g>
      {/* Bottom label / status */}
      <text
        x={x + W / 2}
        y={y + H + 42}
        textAnchor="middle"
        fill="#9aa3b8"
        fontSize="12"
        className="scada-value"
      >
        {tag} · {vol.toFixed(0)} m³
      </text>
      <text
        x={x + W / 2}
        y={y + H + 58}
        textAnchor="middle"
        fill={danger ? "var(--danger)" : "var(--success)"}
        fontSize="12"
        className="scada-value"
      >
        L {level.toFixed(0)}%
      </text>
    </g>
  );
}

function Sphere({
  x,
  y,
  tag,
  press,
  level,
  capacity,
  psv,
  onClick,
  onPsv,
}: {
  x: number;
  y: number;
  tag: string;
  press: number;
  level: number;
  capacity: number;
  psv: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onPsv?: (e: React.MouseEvent) => void;
}) {
  const r = 80;
  const pressDanger = press > 17;
  const lvlDanger = level > 85;
  const vol = (level / 100) * capacity;
  const fillY = y + r - (level / 100) * (r * 2);
  const clipId = `sph-${tag}`;
  return (
    <g>
      <g onClick={onClick} className="cursor-pointer">
        <clipPath id={clipId}>
          <circle cx={x} cy={y} r={r - 2} />
        </clipPath>
        {/* body */}
        <circle cx={x} cy={y} r={r} fill="url(#vessel-stg)" stroke="#3a4258" strokeWidth="2" />
        <g clipPath={`url(#${clipId})`}>
          <rect
            x={x - r}
            y={fillY}
            width={r * 2}
            height={r * 2}
            fill="url(#gas-stg)"
            opacity="0.55"
          />
        </g>
        {/* highlight */}
        <ellipse cx={x - 28} cy={y - 30} rx="22" ry="10" fill="#ffffff" opacity="0.1" />
        {/* legs */}
        <line
          x1={x - r * 0.7}
          y1={y + r * 0.7}
          x2={x - r * 0.7}
          y2={y + r + 30}
          stroke="url(#metal-stg)"
          strokeWidth="4"
        />
        <line
          x1={x + r * 0.7}
          y1={y + r * 0.7}
          x2={x + r * 0.7}
          y2={y + r + 30}
          stroke="url(#metal-stg)"
          strokeWidth="4"
        />
        <line x1={x} y1={y + r} x2={x} y2={y + r + 30} stroke="url(#metal-stg)" strokeWidth="4" />
        {/* Label plate */}
        <rect x={x - 32} y={y - 12} width="64" height="24" fill="#0a0e1a" stroke="#3a4258" />
        <text
          x={x}
          y={y + 5}
          textAnchor="middle"
          fill={STG}
          fontSize="13"
          className="scada-value"
          fontWeight="700"
        >
          {tag}
        </text>
        {/* Press readout */}
        <text
          x={x}
          y={y - r - 22}
          textAnchor="middle"
          fill="#9aa3b8"
          fontSize="11"
          className="scada-value"
        >
          Sphere {tag}
        </text>
        <text
          x={x}
          y={y - r - 6}
          textAnchor="middle"
          fill={pressDanger ? "var(--danger)" : "var(--success)"}
          fontSize="13"
          className="scada-value"
        >
          P {press.toFixed(1)} bar
        </text>
        {/* Level readout */}
        <text
          x={x}
          y={y + r + 52}
          textAnchor="middle"
          fill={lvlDanger ? "var(--danger)" : "var(--success)"}
          fontSize="12"
          className="scada-value"
        >
          L {level.toFixed(0)}% · {vol.toFixed(0)} m³
        </text>
      </g>
      {/* PSV */}
      <g onClick={onPsv} className={`cursor-pointer ${psv ? "animate-alarm" : ""}`}>
        <line x1={x} y1={y - r} x2={x} y2={y - r - 40} stroke="#3a4258" strokeWidth="3" />
        <rect
          x={x - 10}
          y={y - r - 52}
          width="20"
          height="14"
          fill={psv ? "var(--danger)" : "#3a4258"}
          stroke="#1a2030"
        />
        <text x={x + 32} y={y - r - 42} fill="#9aa3b8" fontSize="9" className="scada-value">
          PSV-30{tag === "S-301" ? "1" : "2"}
        </text>
      </g>
    </g>
  );
}

function Pump({
  x,
  y,
  tag,
  subtitle,
  running,
  onClick,
}: {
  x: number;
  y: number;
  tag: string;
  subtitle: string;
  running: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const c = running ? "var(--success)" : "var(--danger)";
  return (
    <g onClick={onClick} className="cursor-pointer">
      {/* Base skid */}
      <rect x={x - 55} y={y + 34} width="110" height="14" fill="#1a2030" stroke="#3a4258" />
      {/* Motor barrel (left of pump) */}
      <rect
        x={x - 68}
        y={y - 22}
        width="42"
        height="44"
        rx="4"
        fill="url(#metal-stg)"
        stroke="#3a4258"
        strokeWidth="1.5"
      />
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          x1={x - 64}
          y1={y - 14 + i * 12}
          x2={x - 30}
          y2={y - 14 + i * 12}
          stroke="#1a2030"
          strokeWidth="1.5"
        />
      ))}
      <rect x={x - 55} y={y - 32} width="16" height="10" fill="#3a4258" stroke="#1a2030" />
      {/* Coupling */}
      <rect x={x - 26} y={y - 4} width="10" height="8" fill="#ff6b00" stroke="#1a2030" />
      {/* Pump volute — circle housing */}
      <circle cx={x} cy={y} r="30" fill="url(#metal-stg)" stroke="#3a4258" strokeWidth="2" />
      <circle cx={x} cy={y} r="20" fill="#0a0e1a" stroke="#3a4258" strokeWidth="1.5" />
      {/* Impeller */}
      <g transform={`translate(${x} ${y})`}>
        <g>
          {running && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur="0.6s"
              repeatCount="indefinite"
            />
          )}
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i * Math.PI) / 2.5;
            return (
              <path
                key={i}
                d={`M 0 0 Q ${10 * Math.cos(a)} ${10 * Math.sin(a)} ${16 * Math.cos(a + 0.5)} ${16 * Math.sin(a + 0.5)}`}
                stroke={OIL}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            );
          })}
          <circle r="4" fill="#3a4258" stroke={OIL} strokeWidth="1.2" />
        </g>
      </g>
      {/* Discharge nozzle top */}
      <rect x={x - 6} y={y - 44} width="12" height="14" fill="#3a4258" />
      {/* Suction nozzle right */}
      <rect x={x + 30} y={y - 6} width="14" height="12" fill="#3a4258" />
      {/* Status glow */}
      <circle cx={x + 22} cy={y - 22} r="4" fill={c} className="pulse-glow" style={{ color: c }} />
      {/* Labels */}
      <text
        x={x}
        y={y + 56}
        textAnchor="middle"
        fill="#9aa3b8"
        fontSize="12"
        className="scada-value"
      >
        {tag} · {subtitle}
      </text>
      <text x={x} y={y + 72} textAnchor="middle" fill={c} fontSize="12" className="scada-value">
        {running ? "RUNNING" : "STOPPED"}
      </text>
    </g>
  );
}

function Compressor({
  x,
  y,
  tag,
  subtitle,
  running,
  press,
  onClick,
}: {
  x: number;
  y: number;
  tag: string;
  subtitle: string;
  running: boolean;
  press?: number;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const c = running ? "var(--success)" : "var(--danger)";
  return (
    <g onClick={onClick} className="cursor-pointer">
      {/* Skid */}
      <rect x={x - 75} y={y + 38} width="150" height="14" fill="#1a2030" stroke="#3a4258" />
      {/* Motor */}
      <rect
        x={x - 82}
        y={y - 34}
        width="50"
        height="70"
        rx="5"
        fill="url(#metal-stg)"
        stroke="#3a4258"
        strokeWidth="1.5"
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={x - 78}
          y1={y - 26 + i * 12}
          x2={x - 34}
          y2={y - 26 + i * 12}
          stroke="#1a2030"
          strokeWidth="1.5"
        />
      ))}
      <rect x={x - 66} y={y - 44} width="18" height="10" fill="#3a4258" stroke="#1a2030" />
      {/* Coupling */}
      <rect x={x - 32} y={y - 4} width="10" height="8" fill="#ff6b00" stroke="#1a2030" />
      {/* Barrel casing */}
      <ellipse
        cx={x}
        cy={y}
        rx="42"
        ry="38"
        fill="url(#metal-stg)"
        stroke="#3a4258"
        strokeWidth="2"
      />
      <ellipse
        cx={x}
        cy={y}
        rx="42"
        ry="38"
        fill="none"
        stroke="#1a2030"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <circle cx={x} cy={y} r="26" fill="#0a0e1a" stroke="#3a4258" strokeWidth="1.5" />
      {/* Impeller */}
      <g transform={`translate(${x} ${y})`}>
        <g>
          {running && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur="0.5s"
              repeatCount="indefinite"
            />
          )}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i * Math.PI) / 4;
            return (
              <path
                key={i}
                d={`M 0 0 Q ${13 * Math.cos(a)} ${13 * Math.sin(a)} ${22 * Math.cos(a + 0.55)} ${22 * Math.sin(a + 0.55)}`}
                stroke={GAS}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            );
          })}
          <circle r="4" fill="#3a4258" stroke={GAS} strokeWidth="1.2" />
        </g>
      </g>
      {/* Nozzles */}
      <rect x={x - 8} y={y - 52} width="16" height="16" fill="#3a4258" />
      <rect x={x + 42} y={y - 8} width="14" height="16" fill="#3a4258" />
      {/* Status */}
      <circle cx={x + 32} cy={y - 28} r="4" fill={c} className="pulse-glow" style={{ color: c }} />
      {/* Labels */}
      <text
        x={x}
        y={y + 60}
        textAnchor="middle"
        fill="#9aa3b8"
        fontSize="12"
        className="scada-value"
      >
        {tag} · {subtitle}
      </text>
      {press !== undefined && (
        <text x={x} y={y + 76} textAnchor="middle" fill={c} fontSize="12" className="scada-value">
          {press.toFixed(1)} bar · {running ? "2950" : "0"} rpm
        </text>
      )}
    </g>
  );
}

function Meter({
  x,
  y,
  tag,
  flow,
  onClick,
}: {
  x: number;
  y: number;
  tag: string;
  flow: number;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <g onClick={onClick} className="cursor-pointer">
      <rect
        x={x - 42}
        y={y - 26}
        width="84"
        height="52"
        rx="3"
        fill="url(#metal-stg)"
        stroke="#3a4258"
        strokeWidth="1.5"
      />
      <rect x={x - 36} y={y - 20} width="72" height="24" fill="#0a0e1a" stroke="#3a4258" />
      <text
        x={x}
        y={y - 3}
        textAnchor="middle"
        fill="#00ff88"
        fontSize="14"
        className="scada-value"
        fontWeight="700"
      >
        {flow.toFixed(0)}
      </text>
      <text
        x={x}
        y={y + 18}
        textAnchor="middle"
        fill="#9aa3b8"
        fontSize="10"
        className="scada-value"
      >
        {tag}
      </text>
      <text
        x={x}
        y={y + 40}
        textAnchor="middle"
        fill="#7d869c"
        fontSize="9"
        className="scada-value"
      >
        m³/h
      </text>
    </g>
  );
}

function ExportBox({
  x,
  y,
  label,
  flow,
  color,
}: {
  x: number;
  y: number;
  label: string;
  flow: string;
  color: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width="90"
        height="70"
        rx="3"
        fill="url(#metal-stg)"
        stroke="#3a4258"
        strokeWidth="1.5"
      />
      <rect x={x + 6} y={y + 8} width="78" height="20" fill="#0a0e1a" stroke="#3a4258" />
      <text
        x={x + 45}
        y={y + 22}
        textAnchor="middle"
        fill={color}
        fontSize="12"
        className="scada-value"
        fontWeight="700"
      >
        {label} →
      </text>
      <text
        x={x + 45}
        y={y + 44}
        textAnchor="middle"
        fill="#e6e8ee"
        fontSize="12"
        className="scada-value"
      >
        {flow}
      </text>
      <text
        x={x + 45}
        y={y + 60}
        textAnchor="middle"
        fill="#7d869c"
        fontSize="9"
        className="scada-value"
      >
        EXPORT
      </text>
    </g>
  );
}

function Legend() {
  return (
    <div className="pointer-events-none absolute left-2 bottom-24 rounded-md border border-border bg-card/80 p-2 font-mono text-[10px] backdrop-blur">
      <div className="mb-1 text-muted-foreground">SENSORS</div>
      <div className="flex flex-wrap gap-2 text-foreground">
        <span>
          <span className="inline-block h-2 w-2 rounded-full bg-[#3aa0ff]" /> PT
        </span>
        <span>
          <span className="inline-block h-2 w-2 rounded-full bg-[#ff5577]" /> TT
        </span>
        <span>
          <span className="inline-block h-2 w-2 rounded-full bg-[#00ff88]" /> FT
        </span>
        <span>
          <span className="inline-block h-2 w-2 rounded-full bg-[#ff9a3c]" /> LT
        </span>
      </div>
    </div>
  );
}

/* ============== Detail Panel ============== */

function DetailPanel({ id }: { id: string }) {
  const s = useStorageSim();
  const close = () => useStorageSim.getState().setSelected(null);

  const eq: Record<
    string,
    { title: string; rows: [string, string][]; design?: string; status?: string }
  > = {
    "MAN-301": {
      title: "Inlet Manifold MAN-301",
      rows: [
        ["Inlet flow", `${s.inletFlow.toFixed(0)} m³/h`],
        ["Sources", "Gas + Oil sectors"],
      ],
      design: "Header DN 600",
    },
    "TK-301": {
      title: "Crude Tank TK-301",
      rows: [
        ["Level", `${s.tk301Level.toFixed(1)} %`],
        ["Volume", `${((s.tk301Level / 100) * s.tankCapacity).toFixed(0)} m³`],
        ["Temp", `${s.tk301Temp.toFixed(1)} °C`],
        ["Capacity", `${s.tankCapacity} m³`],
      ],
      design: "Floating roof, MAWP atm + 50 mbar",
      status: s.tk301Level > 85 ? "ALARM" : s.tk301Level > 75 ? "WARNING" : "NORMAL",
    },
    "TK-302": {
      title: "Crude Tank TK-302",
      rows: [
        ["Level", `${s.tk302Level.toFixed(1)} %`],
        ["Volume", `${((s.tk302Level / 100) * s.tankCapacity).toFixed(0)} m³`],
        ["Temp", `${s.tk302Temp.toFixed(1)} °C`],
        ["Capacity", `${s.tankCapacity} m³`],
      ],
      design: "Floating roof, MAWP atm + 50 mbar",
      status: s.tk302Level > 85 ? "ALARM" : "NORMAL",
    },
    "S-301": {
      title: "Gas Sphere S-301",
      rows: [
        ["Pressure", `${s.s301Press.toFixed(2)} bar`],
        ["Level", `${s.s301Level.toFixed(0)} %`],
        ["Volume", `${((s.s301Level / 100) * s.sphereCapacity).toFixed(0)} m³`],
      ],
      design: "Capacity 4 000 m³ · MAWP 20 bar",
      status: s.s301Press > 18 ? "ALARM" : "NORMAL",
    },
    "S-302": {
      title: "Gas Sphere S-302",
      rows: [
        ["Pressure", `${s.s302Press.toFixed(2)} bar`],
        ["Level", `${s.s302Level.toFixed(0)} %`],
        ["Volume", `${((s.s302Level / 100) * s.sphereCapacity).toFixed(0)} m³`],
      ],
      design: "Capacity 4 000 m³ · MAWP 20 bar",
      status: s.s302Press > 18 ? "ALARM" : "NORMAL",
    },
    "P-301": {
      title: "Crude Transfer Pump P-301",
      rows: [
        ["Status", s.p301 ? "RUNNING" : "STOPPED"],
        ["Discharge flow", `${s.exportCrude.toFixed(0)} m³/h`],
      ],
      design: "Centrifugal · 250 m³/h @ 12 bar",
    },
    "P-302": {
      title: "Gas Transfer Compressor K-301",
      rows: [
        ["Status", s.p302 ? "RUNNING" : "STOPPED"],
        ["Discharge flow", `${s.exportGas.toFixed(0)} m³/h`],
      ],
      design: "Reciprocating · 200 m³/h",
    },
    "MS-301": {
      title: "Crude Metering MS-301",
      rows: [
        ["Flow", `${s.exportCrude.toFixed(0)} m³/h`],
        ["Daily volume", `${s.dailyExport.toFixed(0)} m³`],
      ],
      design: "Ultrasonic fiscal meter",
    },
    "MS-302": {
      title: "Gas Metering MS-302",
      rows: [["Flow", `${s.exportGas.toFixed(0)} m³/h`]],
      design: "Ultrasonic fiscal meter",
    },
  };

  const valve = (label: string, type: string, open: number, extra: [string, string][] = []) => ({
    title: `${label} — ${type}`,
    rows: [
      ["Type", type],
      ["Position", `${open.toFixed(0)} %`],
      ["State", open >= 95 ? "OPEN" : open <= 5 ? "CLOSED" : "PARTIAL"],
      ...extra,
    ] as [string, string][],
  });

  const valveMap: Record<string, () => { title: string; rows: [string, string][] }> = {
    "MOV-141": () => valve("MOV-141", "Gate (Tank inlet)", s.mov141, [["Tank", "TK-301"]]),
    "MOV-142": () => valve("MOV-142", "Gate (Tank inlet)", s.mov142, [["Tank", "TK-302"]]),
    "LV-301": () =>
      valve("LV-301", "Control (Level)", s.lv301, [
        ["Loop", "LIC-301"],
        ["SP", `${s.licSP.toFixed(0)} %`],
      ]),
    "PV-301": () => valve("PV-301", "Control (Pressure)", s.pv301, [["Service", "Sphere inlet"]]),
    "XV-301": () => valve("XV-301", "Gate (Crude export)", s.xv301),
    "XV-302": () => valve("XV-302", "Gate (Gas export)", s.xv302),
    "PSV-301": () =>
      valve("PSV-301", "Safety Relief", s.psv301Open ? 100 : 0, [
        ["Set pressure", "20 bar"],
        ["Actual", `${s.s301Press.toFixed(1)} bar`],
        ["State", s.psv301Open ? "RELIEVING" : "CLOSED"],
      ]),
    "PSV-302": () =>
      valve("PSV-302", "Safety Relief", s.psv302Open ? 100 : 0, [
        ["Set pressure", "20 bar"],
        ["Actual", `${s.s302Press.toFixed(1)} bar`],
        ["State", s.psv302Open ? "RELIEVING" : "CLOSED"],
      ]),
  };

  const sensor = (
    tag: string,
    type: string,
    value: string,
    num: number,
    range: [number, number],
    lo: string,
    hi: string,
  ) => {
    const mA = (4 + ((num - range[0]) / (range[1] - range[0])) * 16).toFixed(2);
    return {
      title: `${tag} — ${type}`,
      rows: [
        ["Value", value],
        ["4-20 mA", `${mA} mA`],
        ["LL alarm", lo],
        ["HH alarm", hi],
        ["Range", `${range[0]} – ${range[1]}`],
      ] as [string, string][],
    };
  };

  const sensorMap: Record<string, () => { title: string; rows: [string, string][] }> = {
    "FI-301": () =>
      sensor(
        "FI-301",
        "Flow",
        `${s.inletFlow.toFixed(0)} m³/h`,
        s.inletFlow,
        [0, 800],
        "50 m³/h",
        "750 m³/h",
      ),
    "FT-301": () =>
      sensor(
        "FT-301",
        "Flow",
        `${s.exportCrude.toFixed(0)} m³/h`,
        s.exportCrude,
        [0, 500],
        "50 m³/h",
        "450 m³/h",
      ),
    "LT-301": () =>
      sensor(
        "LT-301",
        "Level",
        `${s.tk301Level.toFixed(1)} %`,
        s.tk301Level,
        [0, 100],
        "10 %",
        "85 %",
      ),
    "LT-302": () =>
      sensor(
        "LT-302",
        "Level",
        `${s.tk302Level.toFixed(1)} %`,
        s.tk302Level,
        [0, 100],
        "10 %",
        "85 %",
      ),
    "PT-302": () =>
      sensor(
        "PT-302",
        "Pressure",
        `${s.s301Press.toFixed(2)} bar`,
        s.s301Press,
        [0, 25],
        "5 bar",
        "18 bar",
      ),
    "PT-303": () =>
      sensor(
        "PT-303",
        "Pressure",
        `${s.s302Press.toFixed(2)} bar`,
        s.s302Press,
        [0, 25],
        "5 bar",
        "18 bar",
      ),
    "TT-301": () =>
      sensor(
        "TT-301",
        "Temperature",
        `${s.tk301Temp.toFixed(1)} °C`,
        s.tk301Temp,
        [0, 100],
        "20 °C",
        "80 °C",
      ),
    "TT-302": () =>
      sensor(
        "TT-302",
        "Temperature",
        `${s.tk302Temp.toFixed(1)} °C`,
        s.tk302Temp,
        [0, 100],
        "20 °C",
        "80 °C",
      ),
  };

  const panel = eq[id] ?? valveMap[id]?.() ?? sensorMap[id]?.();
  if (!panel) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 320, opacity: 0 }}
        className="absolute bottom-2 right-2 z-10 w-72 max-w-[calc(100vw-1rem)] rounded-lg border border-border bg-card/95 p-3 backdrop-blur sm:top-14 sm:bottom-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="font-mono text-[11px] uppercase tracking-widest" style={{ color: STG }}>
            {panel.title}
          </div>
          <button onClick={close} className="rounded p-1 hover:bg-muted">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-1">
          {panel.rows.map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between border-b border-border/60 py-1 font-mono text-xs"
            >
              <span className="text-muted-foreground">{k}</span>
              <span className="scada-value" style={{ color: "#e6e8ee" }}>
                {v}
              </span>
            </div>
          ))}
          {(panel as any).design && (
            <div className="pt-2 font-mono text-[10px] text-muted-foreground">
              Design: {(panel as any).design}
            </div>
          )}
          {(panel as any).status && (
            <div
              className="font-mono text-[10px]"
              style={{ color: (panel as any).status === "NORMAL" ? STG : "var(--danger)" }}
            >
              Status: {(panel as any).status}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
