import { useLayoutEffect, useRef, useState } from "react";
import { useStorageSim } from "@/lib/sim/storageStore";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, X, Smartphone } from "lucide-react";

const VBW = 1800;
const VBH = 950;
const BG = "#0a0e1a";
const PIPE = "#5a6478";
const OIL = "#8B4513";
const GAS = "#666666";
const WATER = "#1565C0";
const STG = "#00aa44";
type PipeKind = "crude" | "gas" | "water";
const pipeColor = (k?: PipeKind) => (k === "crude" ? OIL : k === "gas" ? GAS : k === "water" ? WATER : PIPE);

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
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
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
    const d = drag.current; if (!d) return;
    setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) });
  };
  const onUp = () => { drag.current = null; };
  const reset = () => { setUserZoom(1); setPan({ x: 0, y: 0 }); };

  const sel = (id: string) => (e: React.MouseEvent) => { e.stopPropagation(); setSelected(id); };

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden touch-none select-none" style={{ background: BG }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onClick={() => setSelected(null)}>

      {!hideHint && (
        <div className="absolute left-2 right-2 top-2 z-20 flex items-center justify-between rounded border border-black/30 bg-black/70 px-2 py-1 font-mono text-[10px] text-white sm:hidden">
          <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> Rotate phone for best view · pinch to zoom</span>
          <button onClick={(e) => { e.stopPropagation(); setHideHint(true); }} className="opacity-70"><X className="h-3 w-3" /></button>
        </div>
      )}

      <svg viewBox={`0 0 ${VBW} ${VBH}`} width={VBW} height={VBH}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}>
        <defs>
          <pattern id="dcsGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#141a2a" strokeWidth="0.6" />
          </pattern>
          <linearGradient id="liquidOil" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#6aa9ff" />
            <stop offset="1" stopColor="#1b4d8a" />
          </linearGradient>
          <linearGradient id="gasFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#8ebbff" />
            <stop offset="1" stopColor="#2a5da6" />
          </linearGradient>
        </defs>

        <rect width={VBW} height={VBH} fill={BG} />
        <rect width={VBW} height={VBH} fill="url(#dcsGrid)" />

        {/* Header bar */}
        <rect x="0" y="0" width={VBW} height="56" fill="#0f1626" />
        <text x="20" y="36" fill={STG} fontSize="22" className="scada-value" fontWeight="700">STOCKAGE ET EXPEDITION · STG-01</text>
        <text x={VBW - 20} y="36" fill="#9aa3b8" fontSize="16" className="scada-value" textAnchor="end">GAS &amp; OIL STORAGE TERMINAL</text>

        {/* === PIPES === */}
        {/* manifold inlet stubs from left */}
        <Pipe d="M 60 280 L 170 280 L 170 310" kind="gas" thin />
        <Pipe d="M 60 360 L 170 360 L 170 330" kind="crude" thin />
        {/* inlet manifold to crude tanks */}
        <Pipe d="M 230 320 L 380 320 L 380 440" kind="crude" />
        <Pipe d="M 380 320 L 720 320 L 720 440" kind="crude" />
        {/* tanks outlet to LV-301 */}
        <Pipe d="M 380 800 L 380 870 L 1000 870" kind="crude" />
        <Pipe d="M 720 800 L 720 870" kind="crude" />
        {/* LV-301 to pump P-301 */}
        <Pipe d="M 1060 870 L 1180 870" kind="crude" />
        {/* P-301 to MS-301 to XV-301 to export */}
        <Pipe d="M 1260 870 L 1360 870" kind="crude" />
        <Pipe d="M 1440 870 L 1540 870" kind="crude" />
        <Pipe d="M 1590 870 L 1740 870" kind="crude" />
        {/* inlet manifold gas branch to spheres */}
        <Pipe d="M 230 320 L 1000 320 L 1000 460" kind="gas" />
        <Pipe d="M 1000 320 L 1320 320 L 1320 460" kind="gas" />
        {/* spheres to PV-301 / gas pump */}
        <Pipe d="M 1000 620 L 1000 700 L 1180 700" kind="gas" />
        <Pipe d="M 1320 620 L 1320 700 L 1180 700" kind="gas" />
        <Pipe d="M 1260 700 L 1360 700" kind="gas" />
        <Pipe d="M 1440 700 L 1540 700" kind="gas" />
        <Pipe d="M 1590 700 L 1740 700" kind="gas" />

        {/* Direction arrows */}
        <Arrow x={300} y={320} dir="right" />
        <Arrow x={550} y={320} dir="right" />
        <Arrow x={1150} y={320} dir="right" />
        <Arrow x={650} y={870} dir="right" />
        <Arrow x={1110} y={870} dir="right" />
        <Arrow x={1490} y={870} dir="right" />
        <Arrow x={1670} y={870} dir="right" />
        <Arrow x={1110} y={700} dir="right" />
        <Arrow x={1490} y={700} dir="right" />
        <Arrow x={1670} y={700} dir="right" />

        {/* === Inlet sources labels === */}
        <text x="60" y="270" fill="#0f1626" fontSize="13" className="scada-value">FROM GAS</text>
        <text x="60" y="380" fill="#0f1626" fontSize="13" className="scada-value">FROM OIL</text>

        {/* === MAN-301 inlet manifold === */}
        <g onClick={sel("MAN-301")} className="cursor-pointer">
          <rect x="170" y="280" width="60" height="80" fill="#0f1626" stroke="#3a4258" strokeWidth="1.5" />
          <text x="200" y="310" textAnchor="middle" fill={STG} fontSize="12" className="scada-value">INLET</text>
          <text x="200" y="328" textAnchor="middle" fill="#fff" fontSize="11" className="scada-value">MAN-301</text>
          <text x="200" y="350" textAnchor="middle" fill="#ffcc00" fontSize="11" className="scada-value">{s.inletFlow.toFixed(0)}</text>
        </g>
        <SensorBadge x={250} y={250} tag="FI-301" value={`${s.inletFlow.toFixed(0)} m³/h`} color="#0a7a2a" onClick={sel("FI-301")} />

        {/* === MOV-141 / MOV-142 above tanks === */}
        <MOV x={380} y={400} label="MOV-141" open={s.mov141} onClick={sel("MOV-141")} />
        <MOV x={720} y={400} label="MOV-142" open={s.mov142} onClick={sel("MOV-142")} />

        {/* === Tanks TK-301 / TK-302 === */}
        <Tank x={300} y={440} tag="TK-301" level={s.tk301Level} temp={s.tk301Temp} capacity={s.tankCapacity} onClick={sel("TK-301")} />
        <Tank x={640} y={440} tag="TK-302" level={s.tk302Level} temp={s.tk302Temp} capacity={s.tankCapacity} onClick={sel("TK-302")} />

        {/* === LV-301 outlet control valve === */}
        <ControlValve x={1030} y={870} label="LV-301" open={s.lv301} onClick={sel("LV-301")} />
        {/* LIC-301 controller bubble linked to LV-301 */}
        <g>
          <line x1="1030" y1="820" x2="1030" y2="780" stroke="#5a6478" strokeDasharray="4 3" />
          <circle cx="1030" cy="760" r="22" fill="#0f1626" stroke={STG} strokeWidth="1.5" />
          <text x="1030" y="757" textAnchor="middle" fill={STG} fontSize="11" className="scada-value" fontWeight="700">LIC</text>
          <text x="1030" y="772" textAnchor="middle" fill={STG} fontSize="11" className="scada-value">301</text>
        </g>

        {/* === Pumps P-301 / P-302 === */}
        <Pump x={1220} y={870} tag="P-301" running={s.p301} subtitle="CRUDE" onClick={sel("P-301")} />
        <Compressor x={1220} y={700} tag="K-301" running={s.p302} subtitle="GAS" press={s.s301Press} onClick={sel("P-302")} />

        {/* === Metering stations === */}
        <Meter x={1360} y={870} tag="MS-301" flow={s.exportCrude} onClick={sel("MS-301")} />
        <Meter x={1360} y={700} tag="MS-302" flow={s.exportGas} onClick={sel("MS-302")} />

        {/* === XV-301 / XV-302 isolation valves === */}
        <GateValve x={1565} y={870} label="XV-301" open={s.xv301} onClick={sel("XV-301")} />
        <GateValve x={1565} y={700} label="XV-302" open={s.xv302} onClick={sel("XV-302")} />

        {/* === Export labels === */}
        <g>
          <rect x="1700" y="840" width="80" height="60" fill="#0f1626" stroke="#3a4258" />
          <text x="1740" y="862" textAnchor="middle" fill={OIL} fontSize="11" className="scada-value" fontWeight="700">CRUDE</text>
          <text x="1740" y="877" textAnchor="middle" fill={OIL} fontSize="10" className="scada-value">EXPORT →</text>
          <text x="1740" y="892" textAnchor="middle" fill="#e6ebf5" fontSize="11" className="scada-value">{s.exportCrude.toFixed(0)} m³/h</text>
        </g>
        <g>
          <rect x="1700" y="670" width="80" height="60" fill="#0f1626" stroke="#3a4258" />
          <text x="1740" y="692" textAnchor="middle" fill="#0066cc" fontSize="11" className="scada-value" fontWeight="700">GAS</text>
          <text x="1740" y="707" textAnchor="middle" fill="#0066cc" fontSize="10" className="scada-value">EXPORT →</text>
          <text x="1740" y="722" textAnchor="middle" fill="#e6ebf5" fontSize="11" className="scada-value">{s.exportGas.toFixed(0)} m³/h</text>
        </g>

        {/* === PV-301 gas pressure control valve (on sphere inlet header) === */}
        <ControlValve x={1160} y={320} label="PV-301" open={s.pv301} onClick={sel("PV-301")} />

        {/* === Spheres S-301 / S-302 === */}
        <Sphere x={1000} y={540} tag="S-301" press={s.s301Press} level={s.s301Level} capacity={s.sphereCapacity} psv={s.psv301Open} onClick={sel("S-301")} onPsv={sel("PSV-301")} />
        <Sphere x={1320} y={540} tag="S-302" press={s.s302Press} level={s.s302Level} capacity={s.sphereCapacity} psv={s.psv302Open} onClick={sel("S-302")} onPsv={sel("PSV-302")} />

        {/* Sensor badges on pipes */}
        <SensorBadge x={1080} y={300} tag="PT-302" value={`${s.s301Press.toFixed(1)} bar`} color="#0066cc" onClick={sel("PT-302")} />
        <SensorBadge x={1240} y={300} tag="PT-303" value={`${s.s302Press.toFixed(1)} bar`} color="#0066cc" onClick={sel("PT-303")} />
        <SensorBadge x={460} y={850} tag="LT-301" value={`${s.tk301Level.toFixed(0)} %`} color="#cc6600" onClick={sel("LT-301")} />
        <SensorBadge x={800} y={850} tag="LT-302" value={`${s.tk302Level.toFixed(0)} %`} color="#cc6600" onClick={sel("LT-302")} />
        <SensorBadge x={1450} y={850} tag="FT-301" value={`${s.exportCrude.toFixed(0)} m³/h`} color="#0a7a2a" onClick={sel("FT-301")} />

        {/* === Status panel (bottom) === */}
        <g>
          <rect x="20" y={VBH - 70} width={VBW - 40} height="50" fill="#0f1626" stroke="#3a4258" />
          <StatusDot x={50} y={VBH - 45} ok={s.tk301Level <= 85} label={`TK-301 ${s.tk301Level.toFixed(0)}%`} />
          <StatusDot x={240} y={VBH - 45} ok={s.tk302Level <= 85} label={`TK-302 ${s.tk302Level.toFixed(0)}%`} />
          <StatusDot x={430} y={VBH - 45} ok={s.s301Press < 18} label={`S-301 ${s.s301Press.toFixed(1)}b`} />
          <StatusDot x={610} y={VBH - 45} ok={s.s302Press < 18} label={`S-302 ${s.s302Press.toFixed(1)}b`} />
          <text x={830} y={VBH - 40} fill="#9aa3b8" fontSize="12" className="scada-value">Total inv:</text>
          <text x={930} y={VBH - 40} fill={STG} fontSize="13" className="scada-value">{(((s.tk301Level + s.tk302Level) / 100) * s.tankCapacity + ((s.s301Level + s.s302Level) / 100) * s.sphereCapacity).toFixed(0)} m³</text>
          <text x={830} y={VBH - 25} fill="#9aa3b8" fontSize="12" className="scada-value">Daily export:</text>
          <text x={950} y={VBH - 25} fill={STG} fontSize="13" className="scada-value">{s.dailyExport.toFixed(0)} m³</text>
        </g>

        {/* === PID indicator box (bottom right) === */}
        <g>
          <rect x={VBW - 360} y={VBH - 170} width="320" height="90" fill="#0f1626" stroke="#3a4258" strokeWidth="1.5" />
          <text x={VBW - 350} y={VBH - 150} fill={STG} fontSize="12" className="scada-value" fontWeight="700">LIC-301 {s.licAuto ? "AUTO" : "MAN"}</text>
          <text x={VBW - 350} y={VBH - 132} fill="#e6ebf5" fontSize="11" className="scada-value">SP: {s.licSP.toFixed(0)}%   PV: {s.tk301Level.toFixed(1)}%</text>
          <text x={VBW - 350} y={VBH - 116} fill="#e6ebf5" fontSize="11" className="scada-value">e: {(s.tk301Level - s.licSP).toFixed(2)}   OUT(LV-301): {s.lv301.toFixed(0)}%</text>
          <text x={VBW - 350} y={VBH - 100} fill="#666" fontSize="10" className="scada-value">Kp={s.kp.toFixed(2)} Ki={s.ki.toFixed(2)} Kd={s.kd.toFixed(2)}</text>
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1">
        <button onClick={(e) => { e.stopPropagation(); setUserZoom((z) => Math.min(4, z + 0.2)); }} className="rounded bg-black/70 p-2 text-white hover:bg-black"><ZoomIn className="h-4 w-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); setUserZoom((z) => Math.max(0.4, z - 0.2)); }} className="rounded bg-black/70 p-2 text-white hover:bg-black"><ZoomOut className="h-4 w-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); reset(); }} className="rounded bg-black/70 p-2 text-white hover:bg-black" title="Fit"><Maximize2 className="h-4 w-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); setUserZoom(1); setPan({ x: 0, y: 0 }); }} className="rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-white hover:bg-black">1:1</button>
        <button onClick={(e) => { e.stopPropagation(); reset(); }} className="rounded bg-black/70 p-2 text-white hover:bg-black" title="Reset"><RotateCcw className="h-4 w-4" /></button>
      </div>

      {selected && <DetailPanel id={selected} />}
    </div>
  );
}

/* ============== Primitives ============== */

function Pipe({ d, kind, thin }: { d: string; kind?: PipeKind; thin?: boolean }) {
  const color = pipeColor(kind);
  const dashed = kind === "crude" || kind === "gas";
  const width = thin ? 1.5 : 2.5;
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dashed ? "10 6" : undefined} strokeLinecap="round" strokeLinejoin="round" />;
}

function Arrow({ x, y, dir }: { x: number; y: number; dir: "right" | "down" }) {
  const pts = dir === "right" ? `${x - 6},${y - 5} ${x + 4},${y} ${x - 6},${y + 5}` : `${x - 5},${y - 6} ${x},${y + 4} ${x + 5},${y - 6}`;
  return <polygon points={pts} fill="#8a94a8" />;
}

function SensorBadge({ x, y, tag, value, color, onClick }: { x: number; y: number; tag: string; value: string; color: string; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <g onClick={onClick} className="cursor-pointer">
      <rect x={x - 38} y={y - 14} width="76" height="28" rx="3" fill="#0f1626" stroke={color} strokeWidth="1.5" />
      <text x={x} y={y - 2} textAnchor="middle" fill={color} fontSize="11" className="scada-value" fontWeight="700">{tag}</text>
      <text x={x} y={y + 11} textAnchor="middle" fill="#e6ebf5" fontSize="10" className="scada-value">{value}</text>
    </g>
  );
}

function StatusDot({ x, y, ok, label }: { x: number; y: number; ok: boolean; label: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="7" fill={ok ? "#00cc44" : "#ff3333"} className={ok ? "" : "animate-alarm"} />
      <text x={x + 14} y={y + 4} fill="#fff" fontSize="12" className="scada-value">{label}</text>
    </g>
  );
}

function MOV({ x, y, label, open, onClick }: { x: number; y: number; label: string; open: number; onClick?: (e: React.MouseEvent) => void }) {
  const c = open > 50 ? "#00cc44" : "#ff3333";
  return (
    <g onClick={onClick} className="cursor-pointer">
      <polygon points={`${x - 14},${y - 12} ${x},${y} ${x - 14},${y + 12}`} fill={c} stroke="#3a4258" strokeWidth="1.2" />
      <polygon points={`${x + 14},${y - 12} ${x},${y} ${x + 14},${y + 12}`} fill={c} stroke="#3a4258" strokeWidth="1.2" />
      <rect x={x - 6} y={y - 24} width="12" height="12" fill="#333" />
      <text x={x} y={y - 30} textAnchor="middle" fill="#0f1626" fontSize="10" className="scada-value" fontWeight="700">{label}</text>
    </g>
  );
}

function ControlValve({ x, y, label, open, onClick }: { x: number; y: number; label: string; open: number; onClick?: (e: React.MouseEvent) => void }) {
  const c = open > 50 ? "#00cc44" : open > 10 ? "#ffaa00" : "#ff3333";
  return (
    <g onClick={onClick} className="cursor-pointer">
      <polygon points={`${x - 14},${y - 12} ${x},${y} ${x - 14},${y + 12}`} fill={c} stroke="#3a4258" strokeWidth="1.2" />
      <polygon points={`${x + 14},${y - 12} ${x},${y} ${x + 14},${y + 12}`} fill={c} stroke="#3a4258" strokeWidth="1.2" />
      {/* diaphragm actuator */}
      <rect x={x - 2} y={y - 32} width="4" height="18" fill="#333" />
      <ellipse cx={x} cy={y - 36} rx="14" ry="8" fill="#fff" stroke="#3a4258" />
      <text x={x} y={y + 30} textAnchor="middle" fill="#0f1626" fontSize="10" className="scada-value" fontWeight="700">{label}</text>
      <text x={x} y={y + 44} textAnchor="middle" fill={c} fontSize="10" className="scada-value">{open.toFixed(0)}%</text>
    </g>
  );
}

function GateValve({ x, y, label, open, onClick }: { x: number; y: number; label: string; open: number; onClick?: (e: React.MouseEvent) => void }) {
  const c = open > 50 ? "#00cc44" : "#ff3333";
  return (
    <g onClick={onClick} className="cursor-pointer">
      <polygon points={`${x - 14},${y - 12} ${x},${y} ${x - 14},${y + 12}`} fill={c} stroke="#3a4258" strokeWidth="1.2" />
      <polygon points={`${x + 14},${y - 12} ${x},${y} ${x + 14},${y + 12}`} fill={c} stroke="#3a4258" strokeWidth="1.2" />
      <line x1={x} y1={y - 24} x2={x} y2={y - 12} stroke="#333" strokeWidth="2" />
      <line x1={x - 8} y1={y - 26} x2={x + 8} y2={y - 26} stroke="#0066cc" strokeWidth="2" />
      <text x={x} y={y + 28} textAnchor="middle" fill="#0f1626" fontSize="10" className="scada-value" fontWeight="700">{label}</text>
    </g>
  );
}

function Tank({ x, y, tag, level, temp, capacity, onClick }: { x: number; y: number; tag: string; level: number; temp: number; capacity: number; onClick?: (e: React.MouseEvent) => void }) {
  const W = 160, H = 320;
  const lvlY = y + H - (level / 100) * H;
  const danger = level > 85;
  const vol = (level / 100) * capacity;
  return (
    <g onClick={onClick} className="cursor-pointer">
      {/* top ellipse roof */}
      <ellipse cx={x + W / 2} cy={y} rx={W / 2} ry="14" fill="#2a3548" stroke="#3a4258" strokeWidth="1.5" />
      {/* shell */}
      <rect x={x} y={y} width={W} height={H} fill="#1a2030" stroke="#3a4258" strokeWidth="1.5" />
      {/* liquid */}
      <clipPath id={`tk-clip-${tag}`}><rect x={x + 1} y={y + 1} width={W - 2} height={H - 2} /></clipPath>
      <g clipPath={`url(#tk-clip-${tag})`}>
        <rect x={x} y={lvlY} width={W} height={H} fill="url(#liquidOil)" opacity="0.95" />
        <line x1={x} y1={lvlY} x2={x + W} y2={lvlY} stroke="#fff" strokeWidth="2" opacity="0.7" />
      </g>
      {/* level scale on left */}
      <rect x={x - 12} y={y} width="8" height={H} fill="#0f1626" stroke="#3a4258" />
      <rect x={x - 12} y={lvlY} width="8" height={y + H - lvlY} fill={danger ? "#ff3333" : "#0099ff"} />
      {/* support legs */}
      <line x1={x + 20} y1={y + H} x2={x + 20} y2={y + H + 20} stroke="#3a4258" strokeWidth="3" />
      <line x1={x + W - 20} y1={y + H} x2={x + W - 20} y2={y + H + 20} stroke="#3a4258" strokeWidth="3" />
      <line x1={x + W / 2} y1={y + H} x2={x + W / 2} y2={y + H + 20} stroke="#3a4258" strokeWidth="3" />
      {/* TI on roof */}
      <rect x={x + W / 2 - 28} y={y - 38} width="56" height="20" fill="#ff8a00" stroke="#3a4258" />
      <text x={x + W / 2} y={y - 24} textAnchor="middle" fill="#fff" fontSize="11" className="scada-value">TI {temp.toFixed(0)}°C</text>
      {/* Volume top right */}
      <rect x={x + W - 4} y={y + 6} width="78" height="20" fill="#0066cc" stroke="#3a4258" />
      <text x={x + W + 35} y={y + 20} textAnchor="middle" fill="#fff" fontSize="11" className="scada-value">{vol.toFixed(0)} m³</text>
      {/* LI bottom */}
      <rect x={x + W / 2 - 38} y={y + H + 24} width="76" height="22" fill={danger ? "#cc0000" : "#0a7a2a"} stroke="#3a4258" />
      <text x={x + W / 2} y={y + H + 39} textAnchor="middle" fill="#fff" fontSize="12" className="scada-value" fontWeight="700">{tag} {level.toFixed(0)}%</text>
    </g>
  );
}

function Sphere({ x, y, tag, press, level, capacity, psv, onClick, onPsv }: { x: number; y: number; tag: string; press: number; level: number; capacity: number; psv: boolean; onClick?: (e: React.MouseEvent) => void; onPsv?: (e: React.MouseEvent) => void }) {
  const r = 80;
  const pressDanger = press > 17;
  const lvlDanger = level > 85;
  const vol = (level / 100) * capacity;
  const fillY = y + r - (level / 100) * (r * 2);
  return (
    <g>
      <g onClick={onClick} className="cursor-pointer">
        <clipPath id={`sph-${tag}`}><circle cx={x} cy={y} r={r} /></clipPath>
        <circle cx={x} cy={y} r={r} fill="#1a2030" stroke="#3a4258" strokeWidth="2" />
        <g clipPath={`url(#sph-${tag})`}>
          <rect x={x - r} y={fillY} width={r * 2} height={r * 2} fill="url(#gasFill)" opacity="0.9" />
        </g>
        {/* highlight */}
        <ellipse cx={x - 28} cy={y - 30} rx="22" ry="12" fill="#fff" opacity="0.15" />
        {/* support legs */}
        <line x1={x - r * 0.7} y1={y + r * 0.7} x2={x - r * 0.7} y2={y + r + 30} stroke="#3a4258" strokeWidth="3" />
        <line x1={x + r * 0.7} y1={y + r * 0.7} x2={x + r * 0.7} y2={y + r + 30} stroke="#3a4258" strokeWidth="3" />
        <line x1={x} y1={y + r} x2={x} y2={y + r + 30} stroke="#3a4258" strokeWidth="3" />
        {/* label center */}
        <text x={x} y={y + 5} textAnchor="middle" fill="#fff" fontSize="14" className="scada-value" fontWeight="700">{tag}</text>
        {/* Press box */}
        <rect x={x - 50} y={y - r - 56} width="100" height="20" fill={pressDanger ? "#cc0000" : "#0a7a2a"} stroke="#3a4258" />
        <text x={x} y={y - r - 42} textAnchor="middle" fill="#fff" fontSize="11" className="scada-value">{press.toFixed(1)} bar</text>
        {/* Level box */}
        <rect x={x - 50} y={y + r + 40} width="100" height="20" fill={lvlDanger ? "#cc0000" : "#0a7a2a"} stroke="#3a4258" />
        <text x={x} y={y + r + 54} textAnchor="middle" fill="#fff" fontSize="11" className="scada-value">{level.toFixed(0)}% · {vol.toFixed(0)} m³</text>
      </g>
      {/* PSV on top */}
      <g onClick={onPsv} className={`cursor-pointer ${psv ? "animate-alarm" : ""}`}>
        <line x1={x} y1={y - r} x2={x} y2={y - r - 24} stroke="#333" strokeWidth="3" />
        <rect x={x - 10} y={y - r - 34} width="20" height="14" fill={psv ? "#ff3333" : "#666"} stroke="#3a4258" />
        <text x={x + 14} y={y - r - 22} fill="#0f1626" fontSize="9" className="scada-value">PSV-30{tag === "S-301" ? "1" : "2"}</text>
      </g>
    </g>
  );
}

function Pump({ x, y, tag, running, subtitle, onClick }: { x: number; y: number; tag: string; running: boolean; subtitle: string; onClick?: (e: React.MouseEvent) => void }) {
  const border = running ? "#00cc44" : "#ff3333";
  const R = 28;
  return (
    <g onClick={onClick} className="cursor-pointer">
      {/* suction / discharge stubs */}
      <line x1={x - R - 12} y1={y} x2={x - R} y2={y} stroke={PIPE} strokeWidth="2.5" />
      <line x1={x + R} y1={y} x2={x + R + 12} y2={y} stroke={PIPE} strokeWidth="2.5" />
      {/* Motor "M" */}
      <line x1={x} y1={y - R} x2={x} y2={y - R - 12} stroke="#5a6478" strokeWidth="2" />
      <circle cx={x} cy={y - R - 22} r="10" fill="#0f1626" stroke="#5a6478" strokeWidth="1.5" />
      <text x={x} y={y - R - 18} textAnchor="middle" fill="#e6ebf5" fontSize="11" className="scada-value" fontWeight="700">M</text>
      {/* Pump body: circle + triangle pointing right (standard centrifugal P&ID symbol) */}
      <circle cx={x} cy={y} r={R} fill="#0f1626" stroke={border} strokeWidth="2.5" />
      <polygon
        points={`${x - R * 0.65},${y - R * 0.7} ${x - R * 0.65},${y + R * 0.7} ${x + R * 0.75},${y}`}
        fill={running ? "#0a7a2a" : "#3a1a1a"}
        stroke={border}
        strokeWidth="1.5"
      />
      {/* Tag */}
      <text x={x} y={y + R + 20} textAnchor="middle" fill="#e6ebf5" fontSize="13" className="scada-value" fontWeight="700">{tag}</text>
      <text x={x} y={y + R + 34} textAnchor="middle" fill="#9aa3b8" fontSize="10" className="scada-value">{subtitle}</text>
      <rect x={x - 30} y={y + R + 42} width="60" height="18" fill={running ? "#0a7a2a" : "#cc0000"} stroke="#3a4258" />
      <text x={x} y={y + R + 55} textAnchor="middle" fill="#fff" fontSize="11" className="scada-value">{running ? "RUN" : "STOP"}</text>
    </g>
  );
}

function Compressor({ x, y, tag, running, subtitle, press, onClick }: { x: number; y: number; tag: string; running: boolean; subtitle: string; press?: number; onClick?: (e: React.MouseEvent) => void }) {
  const border = running ? "#00cc44" : "#ff3333";
  const R = 30;
  return (
    <g onClick={onClick} className="cursor-pointer">
      <line x1={x - R - 12} y1={y} x2={x - R} y2={y} stroke={PIPE} strokeWidth="2.5" />
      <line x1={x + R} y1={y} x2={x + R + 12} y2={y} stroke={PIPE} strokeWidth="2.5" />
      {/* Motor */}
      <line x1={x} y1={y - R} x2={x} y2={y - R - 12} stroke="#5a6478" strokeWidth="2" />
      <circle cx={x} cy={y - R - 22} r="10" fill="#0f1626" stroke="#5a6478" strokeWidth="1.5" />
      <text x={x} y={y - R - 18} textAnchor="middle" fill="#e6ebf5" fontSize="11" className="scada-value" fontWeight="700">M</text>
      {/* Casing */}
      <circle cx={x} cy={y} r={R} fill="#0f1626" stroke={border} strokeWidth="2.5" />
      {/* Back-to-back triangles inside — standard compressor symbol */}
      <g transform={`translate(${x} ${y})`}>
        <g className={running ? "animate-spin-slow" : ""} style={{ transformOrigin: "0px 0px" }}>
          <polygon points={`${-R * 0.75},${-R * 0.55} 0,0 ${-R * 0.75},${R * 0.55}`} fill={running ? "#0a7a2a" : "#3a1a1a"} stroke={border} strokeWidth="1.2" />
          <polygon points={`${R * 0.75},${-R * 0.55} 0,0 ${R * 0.75},${R * 0.55}`} fill={running ? "#0a7a2a" : "#3a1a1a"} stroke={border} strokeWidth="1.2" />
        </g>
      </g>
      <text x={x} y={y + R + 20} textAnchor="middle" fill="#e6ebf5" fontSize="13" className="scada-value" fontWeight="700">{tag}</text>
      <text x={x} y={y + R + 34} textAnchor="middle" fill="#9aa3b8" fontSize="10" className="scada-value">{subtitle}</text>
      {press !== undefined && <text x={x} y={y + R + 48} textAnchor="middle" fill="#9aa3b8" fontSize="10" className="scada-value">{press.toFixed(1)} bar · {running ? "2950" : "0"} rpm</text>}
      <rect x={x - 30} y={y + R + 56} width="60" height="18" fill={running ? "#0a7a2a" : "#cc0000"} stroke="#3a4258" />
      <text x={x} y={y + R + 69} textAnchor="middle" fill="#fff" fontSize="11" className="scada-value">{running ? "RUN" : "STOP"}</text>
    </g>
  );
}

function Meter({ x, y, tag, flow, onClick }: { x: number; y: number; tag: string; flow: number; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <g onClick={onClick} className="cursor-pointer">
      <rect x={x - 40} y={y - 24} width="80" height="48" fill="#0f1626" stroke="#3a4258" strokeWidth="1.5" />
      <text x={x} y={y - 10} textAnchor="middle" fill={STG} fontSize="11" className="scada-value">{tag}</text>
      <rect x={x - 34} y={y - 4} width="68" height="22" fill="#000" />
      <text x={x} y={y + 12} textAnchor="middle" fill="#00ff66" fontSize="12" className="scada-value">{flow.toFixed(0)}</text>
      <text x={x} y={y + 36} textAnchor="middle" fill="#0f1626" fontSize="9" className="scada-value">m³/h</text>
    </g>
  );
}

/* ============== Detail Panel ============== */

function DetailPanel({ id }: { id: string }) {
  const s = useStorageSim();
  const close = () => useStorageSim.getState().setSelected(null);

  const eq: Record<string, { title: string; rows: [string, string][]; design?: string; status?: string }> = {
    "MAN-301": { title: "Inlet Manifold MAN-301", rows: [["Inlet flow", `${s.inletFlow.toFixed(0)} m³/h`], ["Sources", "Gas + Oil sectors"]], design: "Header DN 600" },
    "TK-301": { title: "Crude Tank TK-301", rows: [["Level", `${s.tk301Level.toFixed(1)} %`], ["Volume", `${((s.tk301Level / 100) * s.tankCapacity).toFixed(0)} m³`], ["Temp", `${s.tk301Temp.toFixed(1)} °C`], ["Capacity", `${s.tankCapacity} m³`]], design: "Floating roof, MAWP atm + 50 mbar", status: s.tk301Level > 85 ? "ALARM" : s.tk301Level > 75 ? "WARNING" : "NORMAL" },
    "TK-302": { title: "Crude Tank TK-302", rows: [["Level", `${s.tk302Level.toFixed(1)} %`], ["Volume", `${((s.tk302Level / 100) * s.tankCapacity).toFixed(0)} m³`], ["Temp", `${s.tk302Temp.toFixed(1)} °C`], ["Capacity", `${s.tankCapacity} m³`]], design: "Floating roof, MAWP atm + 50 mbar", status: s.tk302Level > 85 ? "ALARM" : "NORMAL" },
    "S-301": { title: "Gas Sphere S-301", rows: [["Pressure", `${s.s301Press.toFixed(2)} bar`], ["Level", `${s.s301Level.toFixed(0)} %`], ["Volume", `${((s.s301Level / 100) * s.sphereCapacity).toFixed(0)} m³`]], design: "Capacity 4 000 m³ · MAWP 20 bar", status: s.s301Press > 18 ? "ALARM" : "NORMAL" },
    "S-302": { title: "Gas Sphere S-302", rows: [["Pressure", `${s.s302Press.toFixed(2)} bar`], ["Level", `${s.s302Level.toFixed(0)} %`], ["Volume", `${((s.s302Level / 100) * s.sphereCapacity).toFixed(0)} m³`]], design: "Capacity 4 000 m³ · MAWP 20 bar", status: s.s302Press > 18 ? "ALARM" : "NORMAL" },
    "P-301": { title: "Crude Transfer Pump P-301", rows: [["Status", s.p301 ? "RUNNING" : "STOPPED"], ["Discharge flow", `${s.exportCrude.toFixed(0)} m³/h`]], design: "Centrifugal · 250 m³/h @ 12 bar" },
    "P-302": { title: "Gas Transfer Compressor P-302", rows: [["Status", s.p302 ? "RUNNING" : "STOPPED"], ["Discharge flow", `${s.exportGas.toFixed(0)} m³/h`]], design: "Reciprocating · 200 m³/h" },
    "MS-301": { title: "Crude Metering MS-301", rows: [["Flow", `${s.exportCrude.toFixed(0)} m³/h`], ["Daily volume", `${s.dailyExport.toFixed(0)} m³`]], design: "Ultrasonic fiscal meter" },
    "MS-302": { title: "Gas Metering MS-302", rows: [["Flow", `${s.exportGas.toFixed(0)} m³/h`]], design: "Ultrasonic fiscal meter" },
  };

  const valve = (label: string, type: string, open: number, extra: [string, string][] = []) => ({
    title: `${label} — ${type}`,
    rows: [["Type", type], ["Position", `${open.toFixed(0)} %`], ["State", open >= 95 ? "OPEN" : open <= 5 ? "CLOSED" : "PARTIAL"], ...extra] as [string, string][],
  });

  const valveMap: Record<string, () => { title: string; rows: [string, string][] }> = {
    "MOV-141": () => valve("MOV-141", "Gate (Tank inlet)", s.mov141, [["Tank", "TK-301"]]),
    "MOV-142": () => valve("MOV-142", "Gate (Tank inlet)", s.mov142, [["Tank", "TK-302"]]),
    "LV-301": () => valve("LV-301", "Control (Level)", s.lv301, [["Loop", "LIC-301"], ["SP", `${s.licSP.toFixed(0)} %`]]),
    "PV-301": () => valve("PV-301", "Control (Pressure)", s.pv301, [["Service", "Sphere inlet"]]),
    "XV-301": () => valve("XV-301", "Gate (Crude export)", s.xv301),
    "XV-302": () => valve("XV-302", "Gate (Gas export)", s.xv302),
    "PSV-301": () => valve("PSV-301", "Safety Relief", s.psv301Open ? 100 : 0, [["Set pressure", "20 bar"], ["Actual", `${s.s301Press.toFixed(1)} bar`], ["State", s.psv301Open ? "RELIEVING" : "CLOSED"]]),
    "PSV-302": () => valve("PSV-302", "Safety Relief", s.psv302Open ? 100 : 0, [["Set pressure", "20 bar"], ["Actual", `${s.s302Press.toFixed(1)} bar`], ["State", s.psv302Open ? "RELIEVING" : "CLOSED"]]),
  };

  const sensor = (tag: string, type: string, value: string, num: number, range: [number, number], lo: string, hi: string) => {
    const mA = (4 + ((num - range[0]) / (range[1] - range[0])) * 16).toFixed(2);
    return { title: `${tag} — ${type}`, rows: [["Value", value], ["4-20 mA", `${mA} mA`], ["LL alarm", lo], ["HH alarm", hi], ["Range", `${range[0]} – ${range[1]}`]] as [string, string][] };
  };

  const sensorMap: Record<string, () => { title: string; rows: [string, string][] }> = {
    "FI-301": () => sensor("FI-301", "Flow", `${s.inletFlow.toFixed(0)} m³/h`, s.inletFlow, [0, 800], "50 m³/h", "750 m³/h"),
    "FT-301": () => sensor("FT-301", "Flow", `${s.exportCrude.toFixed(0)} m³/h`, s.exportCrude, [0, 500], "50 m³/h", "450 m³/h"),
    "LT-301": () => sensor("LT-301", "Level", `${s.tk301Level.toFixed(1)} %`, s.tk301Level, [0, 100], "10 %", "85 %"),
    "LT-302": () => sensor("LT-302", "Level", `${s.tk302Level.toFixed(1)} %`, s.tk302Level, [0, 100], "10 %", "85 %"),
    "PT-302": () => sensor("PT-302", "Pressure", `${s.s301Press.toFixed(2)} bar`, s.s301Press, [0, 25], "5 bar", "18 bar"),
    "PT-303": () => sensor("PT-303", "Pressure", `${s.s302Press.toFixed(2)} bar`, s.s302Press, [0, 25], "5 bar", "18 bar"),
    "TT-301": () => sensor("TT-301", "Temperature", `${s.tk301Temp.toFixed(1)} °C`, s.tk301Temp, [0, 100], "20 °C", "80 °C"),
    "TT-302": () => sensor("TT-302", "Temperature", `${s.tk302Temp.toFixed(1)} °C`, s.tk302Temp, [0, 100], "20 °C", "80 °C"),
  };

  const panel = eq[id] ?? (valveMap[id]?.()) ?? (sensorMap[id]?.());
  if (!panel) return null;

  return (
    <div className="absolute bottom-3 left-3 right-3 z-10 rounded-md border border-border bg-card/95 p-3 backdrop-blur sm:right-auto sm:max-w-xs" onClick={(e) => e.stopPropagation()}>
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-widest" style={{ color: STG }}>{panel.title}</div>
        <button onClick={close} className="rounded p-1 hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="space-y-1">
        {panel.rows.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-border/40 py-1 font-mono text-xs">
            <span className="text-muted-foreground">{k}</span><span className="scada-value">{v}</span>
          </div>
        ))}
        {(panel as any).design && <div className="pt-2 font-mono text-[10px] text-muted-foreground">Design: {(panel as any).design}</div>}
        {(panel as any).status && <div className="font-mono text-[10px]" style={{ color: (panel as any).status === "NORMAL" ? STG : "var(--danger)" }}>Status: {(panel as any).status}</div>}
      </div>
    </div>
  );
}
