import { useLayoutEffect, useRef, useState } from "react";
import { useOilSim } from "@/lib/sim/oilStore";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, X } from "lucide-react";

const VBW = 1600;
const VBH = 700;

export function OilPlantView() {
  const s = useOilSim();
  const select = useOilSim((x) => x.setSelected);
  const selected = useOilSim((x) => x.selected);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [userZoom, setUserZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = box.w && box.h ? Math.min(box.w / VBW, box.h / VBH) : 1;
  const scale = fit * userZoom;
  const tx = (box.w - VBW * scale) / 2 + pan.x;
  const ty = (box.h - VBH * scale) / 2 + pan.y;
  const reset = () => { setUserZoom(1); setPan({ x: 0, y: 0 }); };

  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = dragRef.current; if (!d) return;
    setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) });
  };
  const onUp = () => { dragRef.current = null; };

  // Colors
  const OIL = "#c87534";
  const WATER = "#0099ff";
  const GAS = "#8a8f9f";

  // Pipe paths
  const pipes = {
    wellChoke: "M 90 320 L 200 320",
    chokeSep: "M 260 320 L 360 320",
    sepGas: "M 540 230 L 660 230 L 660 110 L 1560 110",      // gas → gas sector
    sepOil: "M 540 320 L 660 320 L 720 320",                  // oil → pump
    sepWater: "M 540 410 L 660 410 L 660 540 L 1500 540",     // water → WT
    pumpHX: "M 820 320 L 920 320",
    hxDehy: "M 1100 320 L 1160 320",
    dehyTank: "M 1280 320 L 1360 320 L 1360 360",
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#0a0e1a] touch-none select-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
    >
      <svg
        viewBox={`0 0 ${VBW} ${VBH}`}
        width={VBW}
        height={VBH}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}
      >
        <defs>
          <linearGradient id="oMetal" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3e4868" />
            <stop offset="0.5" stopColor="#1f2740" />
            <stop offset="1" stopColor="#0c1020" />
          </linearGradient>
          <linearGradient id="oVessel" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#161c2e" />
            <stop offset="0.5" stopColor="#3e4868" />
            <stop offset="1" stopColor="#161c2e" />
          </linearGradient>
          <linearGradient id="oOil" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#d68a4a" />
            <stop offset="1" stopColor="#6a3a14" />
          </linearGradient>
          <linearGradient id="oWater" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#33aaff" />
            <stop offset="1" stopColor="#0a3960" />
          </linearGradient>
          <pattern id="oGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0H0V50" fill="none" stroke="#141a2a" strokeWidth="0.8" />
          </pattern>
          <path id="op1" d={pipes.wellChoke} />
          <path id="op2" d={pipes.chokeSep} />
          <path id="op3" d={pipes.sepGas} />
          <path id="op4" d={pipes.sepOil} />
          <path id="op5" d={pipes.sepWater} />
          <path id="op6" d={pipes.pumpHX} />
          <path id="op7" d={pipes.hxDehy} />
          <path id="op8" d={pipes.dehyTank} />
        </defs>
        <rect width={VBW} height={VBH} fill="url(#oGrid)" />

        {/* Pipes */}
        <Pipe d={pipes.wellChoke} color={OIL} />
        <Pipe d={pipes.chokeSep} color={OIL} />
        <Pipe d={pipes.sepGas} color={GAS} dashed />
        <Pipe d={pipes.sepOil} color={OIL} />
        <Pipe d={pipes.sepWater} color={WATER} />
        <Pipe d={pipes.pumpHX} color={OIL} />
        <Pipe d={pipes.hxDehy} color={OIL} />
        <Pipe d={pipes.dehyTank} color={OIL} />

        <Particles href="#op1" color={OIL} n={4} d={3} />
        <Particles href="#op2" color={OIL} n={4} d={3} />
        <Particles href="#op3" color={GAS} n={6} d={2.6} />
        <Particles href="#op4" color={OIL} n={4} d={3} />
        <Particles href="#op5" color={WATER} n={5} d={3.2} />
        <Particles href="#op6" color={OIL} n={4} d={2.6} />
        <Particles href="#op7" color={OIL} n={3} d={3} />
        <Particles href="#op8" color={OIL} n={3} d={3} />

        {/* ===== Well WH-201 ===== */}
        <g onClick={() => select("well")} className="cursor-pointer">
          <rect x="35" y="280" width="70" height="220" fill="url(#oMetal)" stroke="#3a4258" strokeWidth="1.5" />
          <rect x="20" y="220" width="100" height="20" rx="3" fill="url(#oMetal)" stroke="#3a4258" />
          <rect x="40" y="240" width="60" height="40" fill="url(#oMetal)" stroke="#3a4258" />
          <rect x="55" y="195" width="30" height="25" fill="url(#oMetal)" />
          <circle cx="70" cy="230" r="9" fill="#ff4444" className="pulse-glow" />
          <circle cx="22" cy="260" r="13" fill="none" stroke="#0066cc" strokeWidth="3" />
          <line x1="9" y1="260" x2="35" y2="260" stroke="#0066cc" strokeWidth="3" />
          <line x1="22" y1="247" x2="22" y2="273" stroke="#0066cc" strokeWidth="3" />
          <text x="70" y="520" textAnchor="middle" fill="#9aa3b8" fontSize="14" className="scada-value">WH-201</text>
          <text x="70" y="540" textAnchor="middle" fill="#ff8a4d" fontSize="13" className="scada-value">{s.wellPressure.toFixed(0)} bar · {s.wellTemp.toFixed(0)}°C</text>
        </g>
        <SensorDot x={150} y={290} type="PT" id="PT-201" />
        <SensorDot x={150} y={350} type="TT" id="TT-201" />

        {/* ===== Choke CV-201 ===== */}
        <g onClick={() => select("choke")} className="cursor-pointer">
          <rect x="205" y="285" width="55" height="14" fill="#3a4258" />
          <rect x="222" y="245" width="22" height="40" fill="#3a4258" />
          <circle cx="233" cy="240" r="14" fill="none" stroke="#0066cc" strokeWidth="3" />
          <polygon points="205,310 233,325 205,340" fill="url(#oMetal)" stroke="#1a2030" strokeWidth="1.5" />
          <polygon points="261,310 233,325 261,340" fill="url(#oMetal)" stroke="#1a2030" strokeWidth="1.5" />
          <circle cx="233" cy="325" r="5" fill={s.chokeOpen > 50 ? "#00ff88" : s.chokeOpen > 10 ? "#ffaa00" : "#ff4444"} />
          <text x="233" y="370" textAnchor="middle" fill="#9aa3b8" fontSize="12" className="scada-value">CV-201 · {s.chokeOpen.toFixed(0)}%</text>
          <text x="233" y="390" textAnchor="middle" fill="#7d869c" fontSize="10" className="scada-value">{s.upstreamP.toFixed(0)} → {s.downstreamP.toFixed(0)} bar</text>
        </g>

        {/* ===== 3-Phase Separator V-201 (horizontal, large) ===== */}
        <g onClick={() => select("sep")} className="cursor-pointer">
          {/* Saddle supports */}
          <path d="M 380 480 L 410 540 L 460 540 L 440 480 Z" fill="#1a2030" stroke="#3a4258" />
          <path d="M 480 480 L 500 540 L 550 540 L 520 480 Z" fill="#1a2030" stroke="#3a4258" />
          {/* Left elliptical head */}
          <path d="M 360 200 A 30 140 0 0 0 360 480 L 380 480 L 380 200 Z" fill="url(#oVessel)" stroke="#3a4258" strokeWidth="1.5" />
          {/* Cylindrical shell */}
          <rect x="380" y="200" width="320" height="280" fill="url(#oVessel)" stroke="#3a4258" strokeWidth="1.5" />
          {/* Right elliptical head */}
          <path d="M 700 200 A 30 140 0 0 1 700 480 L 680 480 L 680 200 Z" fill="url(#oVessel)" stroke="#3a4258" strokeWidth="1.5" />

          {/* 3 layers inside */}
          <clipPath id="sepClip201"><rect x="381" y="201" width="318" height="278" /></clipPath>
          <g clipPath="url(#sepClip201)">
            {/* Water at bottom */}
            <rect x="380" y={480 - (s.waterLevel / 100) * 130} width="320" height={(s.waterLevel / 100) * 130 + 8} fill="url(#oWater)" opacity="0.9" />
            {/* Oil layer above water */}
            <rect
              x="380"
              y={480 - (s.waterLevel / 100) * 130 - (s.oilLevel / 100) * 130}
              width="320"
              height={(s.oilLevel / 100) * 130}
              fill="url(#oOil)"
              opacity="0.9"
            />
            {/* Interface lines */}
            <line x1="380" y1={480 - (s.waterLevel / 100) * 130} x2="700" y2={480 - (s.waterLevel / 100) * 130} stroke="#a5ddff" strokeWidth="2" opacity="0.8" />
            <line x1="380" y1={480 - (s.waterLevel / 100) * 130 - (s.oilLevel / 100) * 130} x2="700" y2={480 - (s.waterLevel / 100) * 130 - (s.oilLevel / 100) * 130} stroke="#ffd9a0" strokeWidth="2" opacity="0.8" />
            {/* Internal weir */}
            <rect x="620" y="320" width="6" height="160" fill="#1a2030" />
            {/* Mist extractor */}
            <rect x="600" y="215" width="80" height="14" fill="#3a4258" opacity="0.5" />
          </g>

          {/* Nozzles */}
          <rect x="350" y="312" width="14" height="18" fill="#3a4258" />{/* inlet */}
          <rect x="490" y="186" width="22" height="14" fill="#3a4258" />{/* gas out top */}
          <rect x="700" y="310" width="14" height="18" fill="#3a4258" />{/* oil out */}
          <rect x="490" y="480" width="22" height="14" fill="#3a4258" />{/* water out */}

          {/* Manway */}
          <circle cx="450" cy="240" r="18" fill="none" stroke="#3a4258" strokeWidth="2" />
          {[0,1,2,3,4,5].map(i => <circle key={i} cx={450 + 15*Math.cos(i*Math.PI/3)} cy={240 + 15*Math.sin(i*Math.PI/3)} r="1.5" fill="#3a4258" />)}

          {/* Label */}
          <rect x="525" y="335" width="80" height="28" fill="#0a0e1a" stroke="#3a4258" />
          <text x="565" y="354" textAnchor="middle" fill="#0066cc" fontSize="14" className="scada-value">V-201</text>

          <text x="540" y="580" textAnchor="middle" fill="#9aa3b8" fontSize="14" className="scada-value">3-Phase Separator V-201</text>
          <text x="540" y="600" textAnchor="middle" fill="#ff8a4d" fontSize="13" className="scada-value">
            Oil {s.oilLevel.toFixed(0)}% · Water {s.waterLevel.toFixed(0)}% · BS&amp;W {s.bsw.toFixed(2)}%
          </text>
        </g>
        <SensorDot x={400} y={260} type="PT" id="PT-201" />
        <SensorDot x={400} y={300} type="TT" id="TT-201" />
        <SensorDot x={720} y={350} type="LT" id="LT-201" />
        <SensorDot x={720} y={420} type="LT" id="LT-202" />
        <SensorDot x={620} y={180} type="AT" id="AT-201" />

        {/* gas-to-gas-sector arrow */}
        <g>
          <text x="1480" y="90" textAnchor="end" fill="#8a8f9f" fontSize="13" className="scada-value">→ To Gas Sector ({s.sepGasFlow.toFixed(0)} m³/h)</text>
          <polygon points="1560,110 1545,103 1545,117" fill={GAS} />
        </g>

        {/* ===== Crude Pump P-201 ===== */}
        <g onClick={() => select("pump")} className="cursor-pointer">
          {/* Skid */}
          <rect x="715" y="380" width="115" height="14" fill="#1a2030" stroke="#3a4258" />
          {/* Motor */}
          <rect x="715" y="290" width="50" height="90" rx="4" fill="url(#oMetal)" stroke="#3a4258" strokeWidth="1.5" />
          {[0,1,2,3].map(i => <line key={i} x1="720" y1={300+i*18} x2="760" y2={300+i*18} stroke="#1a2030" strokeWidth="1.5" />)}
          {/* Pump casing (volute) — circle with discharge tangent */}
          <circle cx="790" cy="320" r="32" fill="url(#oMetal)" stroke="#3a4258" strokeWidth="1.5" />
          <circle cx="790" cy="320" r="22" fill="#0a0e1a" stroke="#3a4258" />
          {/* Impeller with curved blades */}
          <g className={s.pumpRunning ? "animate-spin-slow" : ""} style={{ transformOrigin: "790px 320px" }}>
            {[0,1,2,3,4,5].map(i => {
              const a = (i * Math.PI) / 3;
              return (
                <path
                  key={i}
                  d={`M 790 320 Q ${790 + 18*Math.cos(a)} ${320 + 18*Math.sin(a)} ${790 + 22*Math.cos(a+0.4)} ${320 + 22*Math.sin(a+0.4)}`}
                  stroke="#0066cc"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
            <circle cx="790" cy="320" r="4" fill="#0066cc" />
          </g>
          {/* Discharge stub up-right */}
          <rect x="815" y="312" width="14" height="16" fill="#3a4258" />
          <text x="790" y="420" textAnchor="middle" fill="#9aa3b8" fontSize="13" className="scada-value">P-201 Crude Pump</text>
          <text x="790" y="438" textAnchor="middle" fill="#ff8a4d" fontSize="12" className="scada-value">
            {s.pumpFlow.toFixed(0)} m³/h · ΔP {s.pumpDP.toFixed(1)} bar · η {s.pumpEff.toFixed(0)}%
          </text>
        </g>
        <SensorDot x={750} y={350} type="FT" id="FT-201" />
        <SensorDot x={830} y={290} type="PT" id="PT-203" />

        {/* ===== Heat Exchanger E-201 (shell & tube) ===== */}
        <g onClick={() => select("hx")} className="cursor-pointer">
          <rect x="920" y="280" width="180" height="80" rx="6" fill="url(#oMetal)" stroke="#3a4258" strokeWidth="1.5" />
          {/* tube bundle */}
          {[0,1,2,3,4,5].map(i => (
            <line key={i} x1="930" y1={295 + i*10} x2="1090" y2={295 + i*10} stroke="#0066cc" strokeWidth="2" opacity="0.6" />
          ))}
          {/* heads */}
          <rect x="912" y="280" width="10" height="80" fill="#3a4258" />
          <rect x="1098" y="280" width="10" height="80" fill="#3a4258" />
          {/* utility nozzles */}
          <rect x="950" y="265" width="16" height="18" fill="#3a4258" />
          <rect x="1055" y="357" width="16" height="18" fill="#3a4258" />
          <text x="956" y="258" fill="#ff5577" fontSize="10" className="scada-value">UT IN</text>
          <text x="1063" y="392" fill="#ff5577" fontSize="10" className="scada-value">UT OUT</text>
          <text x="1010" y="408" textAnchor="middle" fill="#9aa3b8" fontSize="13" className="scada-value">E-201 Heat Exchanger</text>
          <text x="1010" y="425" textAnchor="middle" fill="#ff8a4d" fontSize="12" className="scada-value">
            {s.hxCrudeIn.toFixed(0)}→{s.hxCrudeOut.toFixed(0)}°C · Q {s.hxDuty.toFixed(0)} kW
          </text>
          <text x="1010" y="441" textAnchor="middle" fill="#7d869c" fontSize="10" className="scada-value">
            LMTD {s.hxLMTD.toFixed(1)}°C · fouling {(s.hxFouling*100).toFixed(1)}%
          </text>
        </g>
        <SensorDot x={905} y={320} type="TT" id="TT-202" />
        <SensorDot x={1115} y={320} type="TT" id="TT-203" />

        {/* ===== Dehydrator D-201 ===== */}
        <g onClick={() => select("dehy")} className="cursor-pointer">
          <rect x="1160" y="270" width="120" height="100" rx="10" fill="url(#oVessel)" stroke="#3a4258" strokeWidth="1.5" />
          {/* Electrode plates */}
          <line x1="1180" y1="290" x2="1260" y2="290" stroke={s.dehydratorOn ? "#ffcc00" : "#444"} strokeWidth="3" />
          <line x1="1180" y1="350" x2="1260" y2="350" stroke={s.dehydratorOn ? "#ffcc00" : "#444"} strokeWidth="3" />
          {/* Sparks */}
          {s.dehydratorOn && [0,1,2,3].map(i => (
            <line key={i} x1={1190 + i*20} y1="290" x2={1190 + i*20} y2="350" stroke="#ffee66" strokeWidth="1" strokeDasharray="2 3" opacity="0.7">
              <animate attributeName="opacity" values="0.2;1;0.2" dur="0.6s" repeatCount="indefinite" begin={`${i*0.15}s`} />
            </line>
          ))}
          <text x="1220" y="395" textAnchor="middle" fill="#9aa3b8" fontSize="13" className="scada-value">D-201</text>
          <text x="1220" y="412" textAnchor="middle" fill="#ff8a4d" fontSize="11" className="scada-value">
            BS&amp;W {s.bswIn.toFixed(2)}→{s.bswOut.toFixed(2)}% · {s.dehydratorKV.toFixed(0)} kV
          </text>
        </g>

        {/* ===== Storage Tank TK-201 (floating roof) ===== */}
        <g onClick={() => select("tank")} className="cursor-pointer">
          <rect x="1320" y="360" width="220" height="220" fill="url(#oVessel)" stroke="#3a4258" strokeWidth="1.5" />
          {/* Liquid */}
          <clipPath id="tankClip"><rect x="1321" y="361" width="218" height="218" /></clipPath>
          <g clipPath="url(#tankClip)">
            <rect x="1320" y={580 - (s.tankLevel / 100) * 218} width="220" height={(s.tankLevel / 100) * 218 + 4} fill="url(#oOil)" opacity="0.85" />
            {/* Floating roof */}
            <rect x="1325" y={580 - (s.tankLevel / 100) * 218 - 6} width="210" height="10" fill="#3a4258" stroke="#1a2030" />
            <rect x="1325" y={580 - (s.tankLevel / 100) * 218 - 6} width="210" height="3" fill="#5a6480" />
          </g>
          {/* Roof rails */}
          <line x1="1320" y1="360" x2="1320" y2="580" stroke="#3a4258" strokeWidth="3" />
          <line x1="1540" y1="360" x2="1540" y2="580" stroke="#3a4258" strokeWidth="3" />
          {/* Stairs */}
          <line x1="1540" y1="580" x2="1570" y2="380" stroke="#3a4258" strokeWidth="2" />
          {/* Level indicator gauge */}
          <rect x="1550" y="380" width="10" height="200" fill="#0a0e1a" stroke="#3a4258" />
          <rect x="1550" y={580 - (s.tankLevel / 100) * 200} width="10" height={(s.tankLevel / 100) * 200} fill="#ff8a4d" />
          <text x="1430" y="610" textAnchor="middle" fill="#9aa3b8" fontSize="14" className="scada-value">TK-201 Floating Roof Tank</text>
          <text x="1430" y="628" textAnchor="middle" fill="#ff8a4d" fontSize="12" className="scada-value">
            Lvl {s.tankLevel.toFixed(0)}% · {s.tankVolume.toFixed(0)} m³ · {s.tankTemp.toFixed(0)}°C
          </text>
        </g>
        <SensorDot x={1300} y={420} type="LT" id="LT-203" />
        <SensorDot x={1300} y={480} type="TT" id="TT-204" />

        {/* ===== Water Treatment WT-201 ===== */}
        <g onClick={() => select("wt")} className="cursor-pointer">
          <rect x="1430" y="500" width="100" height="80" rx="6" fill="url(#oMetal)" stroke="#3a4258" strokeWidth="1.5" />
          {/* coalescer plates */}
          {[0,1,2,3].map(i => (
            <line key={i} x1="1440" y1={515 + i*15} x2="1520" y2={515 + i*15} stroke="#0099ff" strokeWidth="1.5" opacity="0.6" />
          ))}
          <text x="1480" y="600" textAnchor="middle" fill="#9aa3b8" fontSize="12" className="scada-value">WT-201</text>
          <text x="1480" y="616" textAnchor="middle" fill={s.wtOilInWater > 40 ? "#ff4444" : "#00ff88"} fontSize="11" className="scada-value">
            {s.wtOilInWater.toFixed(0)} ppm O-in-W
          </text>
        </g>

        {/* Valve markers */}
        <ValveMark x={720} y={320} label="LV-201" open={s.lv201} />
        <ValveMark x={720} y={410} label="LV-202" open={s.lv202} />
        <ValveMark x={1360} y={400} label="EV-201" open={s.exportValve} />
      </svg>

      {/* Zoom controls */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
        <button onClick={() => setUserZoom((z) => Math.min(4, +(z + 0.2).toFixed(2)))} className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 hover:bg-muted backdrop-blur"><ZoomIn className="h-4 w-4" /></button>
        <button onClick={() => setUserZoom((z) => Math.max(0.3, +(z - 0.2).toFixed(2)))} className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 hover:bg-muted backdrop-blur"><ZoomOut className="h-4 w-4" /></button>
        <button onClick={reset} className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 hover:bg-muted backdrop-blur"><Maximize2 className="h-4 w-4" /></button>
        <button onClick={reset} className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 hover:bg-muted backdrop-blur"><RotateCcw className="h-4 w-4" /></button>
        <div className="rounded-md border border-border bg-card/90 px-1 py-0.5 text-center font-mono text-[10px] text-muted-foreground backdrop-blur">{Math.round(scale * 100)}%</div>
      </div>

      <div className="pointer-events-none absolute left-2 top-2 rounded-md border border-border bg-card/80 p-2 font-mono text-[10px] backdrop-blur">
        <div className="mb-1 text-muted-foreground">LINES</div>
        <div className="flex flex-wrap gap-2">
          <span><span className="inline-block h-2 w-3 align-middle" style={{ background: OIL }} /> CRUDE</span>
          <span><span className="inline-block h-2 w-3 align-middle" style={{ background: WATER }} /> WATER</span>
          <span><span className="inline-block h-2 w-3 align-middle" style={{ background: GAS }} /> GAS</span>
        </div>
      </div>

      {selected && <DetailPanel id={selected} />}
    </div>
  );
}

function Pipe({ d, color, dashed }: { d: string; color: string; dashed?: boolean }) {
  return (
    <g>
      <path d={d} stroke="#141a2a" strokeWidth="22" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke="#2a3148" strokeWidth="18" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed ? "12 8" : undefined} opacity="0.85" />
    </g>
  );
}

function Particles({ href, color, n, d }: { href: string; color: string; n: number; d: number }) {
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <circle key={i} r="3.5" fill={color}>
          <animateMotion dur={`${d}s`} repeatCount="indefinite" begin={`${(i * d) / n}s`} rotate="auto">
            <mpath href={href} />
          </animateMotion>
        </circle>
      ))}
    </g>
  );
}

function SensorDot({ x, y, type, id }: { x: number; y: number; type: "PT" | "TT" | "FT" | "LT" | "AT"; id: string }) {
  const colors: Record<string, string> = { PT: "#3aa0ff", TT: "#ff5577", FT: "#00ff88", LT: "#ff9a3c", AT: "#cc66ff" };
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r="14" fill={colors[type]} opacity="0.18" />
      <circle cx={x} cy={y} r="9" fill={colors[type]} stroke="#0a0e1a" strokeWidth="2" />
      <text x={x} y={y + 3.5} textAnchor="middle" fill="#0a0e1a" fontSize="8" fontWeight="700">{type}</text>
      <text x={x} y={y + 26} textAnchor="middle" fill="#7d869c" fontSize="9" className="scada-value">{id}</text>
    </g>
  );
}

function ValveMark({ x, y, label, open }: { x: number; y: number; label: string; open: number }) {
  const c = open > 50 ? "#00ff88" : open > 10 ? "#ffaa00" : "#ff4444";
  return (
    <g className="pointer-events-none">
      <polygon points={`${x-14},${y-12} ${x},${y} ${x-14},${y+12}`} fill="url(#oMetal)" stroke="#1a2030" />
      <polygon points={`${x+14},${y-12} ${x},${y} ${x+14},${y+12}`} fill="url(#oMetal)" stroke="#1a2030" />
      <rect x={x-3} y={y-22} width="6" height="10" fill="#3a4258" />
      <circle cx={x} cy={y} r="4" fill={c} />
      <text x={x} y={y + 28} textAnchor="middle" fill="#9aa3b8" fontSize="10" className="scada-value">{label} {open.toFixed(0)}%</text>
    </g>
  );
}

function DetailPanel({ id }: { id: string }) {
  const s = useOilSim();
  const close = () => useOilSim.getState().setSelected(null);
  const data: Record<string, { title: string; rows: [string, string][] }> = {
    well: { title: "Wellhead WH-201", rows: [["Pressure", `${s.wellPressure.toFixed(1)} bar`], ["Temp", `${s.wellTemp.toFixed(0)} °C`]] },
    choke: { title: "Choke Valve CV-201", rows: [["Opening", `${s.chokeOpen.toFixed(0)} %`], ["Upstream", `${s.upstreamP.toFixed(1)} bar`], ["Downstream", `${s.downstreamP.toFixed(1)} bar`]] },
    sep: { title: "3-Phase Separator V-201", rows: [["Pressure", `${s.sepPressure.toFixed(1)} bar`], ["Temp", `${s.sepTemp.toFixed(1)} °C`], ["Oil level", `${s.oilLevel.toFixed(0)} %`], ["Water level", `${s.waterLevel.toFixed(0)} %`], ["BS&W", `${s.bsw.toFixed(2)} %`], ["Gas out", `${s.sepGasFlow.toFixed(0)} m³/h`]] },
    pump: { title: "Crude Pump P-201", rows: [["Status", s.pumpRunning ? "RUNNING" : "STOPPED"], ["Flow", `${s.pumpFlow.toFixed(1)} m³/h`], ["ΔP", `${s.pumpDP.toFixed(2)} bar`], ["Efficiency", `${s.pumpEff.toFixed(0)} %`], ["Speed", `${s.pumpRpm.toFixed(0)} rpm`]] },
    hx: { title: "Heat Exchanger E-201", rows: [["Crude in", `${s.hxCrudeIn.toFixed(1)} °C`], ["Crude out", `${s.hxCrudeOut.toFixed(1)} °C`], ["Duty", `${s.hxDuty.toFixed(0)} kW`], ["LMTD", `${s.hxLMTD.toFixed(2)} °C`], ["Fouling", `${(s.hxFouling * 100).toFixed(1)} %`], ["Utility flow", `${s.utilityFlow.toFixed(0)} %`]] },
    dehy: { title: "Electrostatic Dehydrator D-201", rows: [["Status", s.dehydratorOn ? "ENERGIZED" : "OFF"], ["Voltage", `${s.dehydratorKV.toFixed(1)} kV`], ["BS&W in", `${s.bswIn.toFixed(2)} %`], ["BS&W out", `${s.bswOut.toFixed(2)} %`]] },
    tank: { title: "Storage Tank TK-201", rows: [["Level", `${s.tankLevel.toFixed(1)} %`], ["Volume", `${s.tankVolume.toFixed(0)} m³`], ["Temp", `${s.tankTemp.toFixed(1)} °C`], ["Vapor P", `${s.vaporP.toFixed(2)} barg`]] },
    wt: { title: "Water Treatment WT-201", rows: [["Oil-in-water", `${s.wtOilInWater.toFixed(0)} ppm`], ["Discharge limit", "40 ppm"]] },
  };
  const d = data[id];
  if (!d) return null;
  return (
    <div className="absolute bottom-3 left-3 right-3 z-10 rounded-md border border-border bg-card/95 p-3 backdrop-blur sm:right-auto sm:max-w-xs">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-widest text-primary">{d.title}</div>
        <button onClick={close} className="rounded p-1 hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="space-y-1">
        {d.rows.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-border/40 py-1 font-mono text-xs">
            <span className="text-muted-foreground">{k}</span><span className="scada-value">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
