import { useLayoutEffect, useRef, useState } from "react";
import { useOilSim } from "@/lib/sim/oilStore";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, X } from "lucide-react";

// Portrait viewBox — top-to-bottom P&ID flow
const VBW = 900;
const VBH = 1700;

const OIL = "#c87534";
const WATER = "#0099ff";
const GAS = "#8a8f9f";

type SelKey =
  | "well" | "choke" | "sep" | "pump" | "hx" | "dehy" | "tank" | "wt" | "wtank"
  | "SDV-201" | "CV-201" | "LV-201" | "LV-202" | "PV-201" | "XV-201" | "FV-201"
  | "CV-202" | "TV-201" | "PSV-201" | "PSV-202" | "XV-202"
  | "PT-201" | "TT-201" | "PT-202" | "TT-202" | "LT-201" | "LT-202" | "AT-201"
  | "FT-201" | "PT-203" | "TT-203" | "TT-204" | "LT-203" | "FT-202" | "AT-202";

export function OilPlantView() {
  const s = useOilSim();
  const setSelected = useOilSim((x) => x.setSelected);
  const selected = useOilSim((x) => x.selected) as SelKey | null;

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

  const sel = (id: SelKey) => (e: React.MouseEvent) => { e.stopPropagation(); setSelected(id as string); };

  // Approximate PSV state (relief above 15 bar set point)
  const psv201Open = s.sepPressure > 15;
  const psv202Open = s.vaporP > 5;

  // Vertical pipe paths
  const P = {
    whSdv:   "M 450 230 L 450 280",                                   // wellhead down to SDV
    sdvChoke:"M 450 320 L 450 360",                                   // SDV down to choke
    chokeSep:"M 450 400 L 450 460",                                   // choke into separator top
    sepGasUp:"M 250 460 L 250 380 L 80 380",                          // gas out top-left → off screen
    sepOilDown:"M 500 600 L 500 660 L 450 660 L 450 760",             // oil bottom-center → pump suction
    pumpOut: "M 450 880 L 450 940",                                   // pump discharge → HX
    hxOut:   "M 450 1040 L 450 1100",                                 // HX → dehy
    dehyOut: "M 450 1230 L 450 1290",                                 // dehy → tank
    tankOut: "M 590 1490 L 700 1490 L 700 1560",                      // tank → export (down)
    sepWaterDown:"M 650 600 L 650 720 L 760 720",                     // water bottom-right → WT
    wtOut:   "M 820 800 L 820 880",                                   // WT → water tank
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
      onClick={() => setSelected(null)}
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
          {Object.entries(P).map(([k, d]) => <path key={k} id={`op-${k}`} d={d} />)}
        </defs>

        <rect width={VBW} height={VBH} fill="url(#oGrid)" />

        {/* === Pipes (thickness scales with flow) === */}
        <Pipe d={P.whSdv} color={OIL} thick={14} />
        <Pipe d={P.sdvChoke} color={OIL} thick={14} />
        <Pipe d={P.chokeSep} color={OIL} thick={Math.max(8, Math.min(18, s.inletFlow / 12))} />
        <Pipe d={P.sepGasUp} color={GAS} dashed thick={Math.max(6, Math.min(14, s.sepGasFlow / 80))} />
        <Pipe d={P.sepOilDown} color={OIL} thick={Math.max(8, Math.min(16, s.crudeFlow / 14))} />
        <Pipe d={P.pumpOut} color={OIL} thick={Math.max(8, Math.min(16, s.crudeFlow / 14))} />
        <Pipe d={P.hxOut} color={OIL} thick={Math.max(8, Math.min(16, s.crudeFlow / 14))} />
        <Pipe d={P.dehyOut} color={OIL} thick={Math.max(8, Math.min(16, s.crudeFlow / 14))} />
        <Pipe d={P.tankOut} color={OIL} thick={12} />
        <Pipe d={P.sepWaterDown} color={WATER} thick={12} />
        <Pipe d={P.wtOut} color={WATER} thick={10} />

        <Particles href="#op-whSdv" color={OIL} n={3} d={2.6} />
        <Particles href="#op-sdvChoke" color={OIL} n={3} d={2.6} />
        <Particles href="#op-chokeSep" color={OIL} n={3} d={2.6} />
        <Particles href="#op-sepGasUp" color={GAS} n={5} d={2.4} />
        <Particles href="#op-sepOilDown" color={OIL} n={4} d={2.6} />
        <Particles href="#op-pumpOut" color={OIL} n={4} d={2.2} />
        <Particles href="#op-hxOut" color={OIL} n={3} d={2.6} />
        <Particles href="#op-dehyOut" color={OIL} n={3} d={2.6} />
        <Particles href="#op-tankOut" color={OIL} n={3} d={3} />
        <Particles href="#op-sepWaterDown" color={WATER} n={5} d={2.8} />
        <Particles href="#op-wtOut" color={WATER} n={4} d={2.8} />

        {/* === Wellhead WH-201 === */}
        <g onClick={sel("well")} className="cursor-pointer">
          <rect x="380" y="100" width="140" height="110" fill="url(#oMetal)" stroke="#3a4258" strokeWidth="1.5" />
          <rect x="360" y="80" width="180" height="25" rx="3" fill="url(#oMetal)" stroke="#3a4258" />
          <rect x="420" y="40" width="60" height="50" fill="url(#oMetal)" stroke="#3a4258" />
          <circle cx="450" cy="155" r="12" fill="#ff4444" className="pulse-glow" />
          {/* hand wheel */}
          <circle cx="340" cy="155" r="18" fill="none" stroke="#0066cc" strokeWidth="3" />
          <line x1="322" y1="155" x2="358" y2="155" stroke="#0066cc" strokeWidth="3" />
          <line x1="340" y1="137" x2="340" y2="173" stroke="#0066cc" strokeWidth="3" />
          <text x="450" y="20" textAnchor="middle" fill="#9aa3b8" fontSize="14" className="scada-value">WH-201 Wellhead</text>
          <text x="450" y="240" textAnchor="middle" fill="#ff8a4d" fontSize="13" className="scada-value">
            {s.wellPressure.toFixed(0)} bar · {s.wellTemp.toFixed(0)}°C
          </text>
        </g>
        <SensorBadge x={580} y={150} type="PT" id="PT-201" value={`${s.wellPressure.toFixed(0)} bar`} onClick={sel("PT-201")} />
        <SensorBadge x={580} y={190} type="TT" id="TT-201" value={`${s.wellTemp.toFixed(0)}°C`} onClick={sel("TT-201")} />

        {/* === SDV-201 Shutdown Gate Valve === */}
        <GateValve x={450} y={300} label="SDV-201" open={100} orient="v" onClick={sel("SDV-201")} />

        {/* === CV-201 Choke Control Valve === */}
        <ControlValve x={450} y={380} label="CV-201" open={s.chokeOpen} tag="" orient="v" onClick={sel("CV-201")} />

        {/* === 3-Phase Separator V-201 (horizontal) === */}
        <g onClick={sel("sep")} className="cursor-pointer">
          {/* Saddle supports */}
          <path d="M 220 600 L 200 660 L 260 660 L 260 600 Z" fill="#1a2030" stroke="#3a4258" />
          <path d="M 600 600 L 580 660 L 640 660 L 640 600 Z" fill="#1a2030" stroke="#3a4258" />
          {/* Left elliptical head */}
          <path d="M 160 460 A 30 70 0 0 0 160 600 L 180 600 L 180 460 Z" fill="url(#oVessel)" stroke="#3a4258" strokeWidth="1.5" />
          {/* Cylindrical shell */}
          <rect x="180" y="460" width="540" height="140" fill="url(#oVessel)" stroke="#3a4258" strokeWidth="1.5" />
          {/* Right elliptical head */}
          <path d="M 720 460 A 30 70 0 0 1 720 600 L 700 600 L 700 460 Z" fill="url(#oVessel)" stroke="#3a4258" strokeWidth="1.5" />

          {/* Three layers inside */}
          <clipPath id="sepClipV201"><rect x="181" y="461" width="538" height="138" /></clipPath>
          <g clipPath="url(#sepClipV201)">
            <rect x="180" y={600 - (s.waterLevel / 100) * 70} width="540" height={(s.waterLevel / 100) * 70 + 4} fill="url(#oWater)" opacity="0.9" />
            <rect x="180" y={600 - (s.waterLevel / 100) * 70 - (s.oilLevel / 100) * 60} width="540" height={(s.oilLevel / 100) * 60} fill="url(#oOil)" opacity="0.9" />
            <line x1="180" y1={600 - (s.waterLevel / 100) * 70} x2="720" y2={600 - (s.waterLevel / 100) * 70} stroke="#a5ddff" strokeWidth="2" opacity="0.8" />
            <line x1="180" y1={600 - (s.waterLevel / 100) * 70 - (s.oilLevel / 100) * 60} x2="720" y2={600 - (s.waterLevel / 100) * 70 - (s.oilLevel / 100) * 60} stroke="#ffd9a0" strokeWidth="2" opacity="0.8" />
            {/* Weir between oil & water buckets */}
            <rect x="540" y="490" width="6" height="110" fill="#1a2030" />
            {/* Mist extractor */}
            <rect x="200" y="468" width="100" height="10" fill="#3a4258" opacity="0.6" />
          </g>

          {/* Inlet nozzle (top) */}
          <rect x="443" y="446" width="14" height="20" fill="#3a4258" />
          {/* Gas outlet (top left) */}
          <rect x="243" y="446" width="14" height="20" fill="#3a4258" />
          {/* Oil outlet (bottom, right of weir) */}
          <rect x="493" y="598" width="14" height="20" fill="#3a4258" />
          {/* Water outlet (bottom, right side) */}
          <rect x="643" y="598" width="14" height="20" fill="#3a4258" />

          {/* Manway */}
          <circle cx="400" cy="500" r="14" fill="none" stroke="#3a4258" strokeWidth="2" />

          {/* Label box */}
          <rect x="360" y="525" width="100" height="26" fill="#0a0e1a" stroke="#3a4258" />
          <text x="410" y="544" textAnchor="middle" fill="#0080ff" fontSize="14" className="scada-value">V-201</text>

          <text x="450" y="685" textAnchor="middle" fill="#9aa3b8" fontSize="14" className="scada-value">3-Phase Separator V-201</text>
          <text x="450" y="703" textAnchor="middle" fill="#ff8a4d" fontSize="12" className="scada-value">
            Oil {s.oilLevel.toFixed(0)}% · Water {s.waterLevel.toFixed(0)}% · BS&amp;W {s.bsw.toFixed(2)}% · {s.sepPressure.toFixed(1)} bar
          </text>
        </g>

        {/* Separator sensors */}
        <SensorBadge x={130} y={500} type="PT" id="PT-202" value={`${s.sepPressure.toFixed(1)} bar`} onClick={sel("PT-202")} />
        <SensorBadge x={130} y={540} type="TT" id="TT-202" value={`${s.sepTemp.toFixed(0)}°C`} onClick={sel("TT-202")} />
        <SensorBadge x={770} y={500} type="LT" id="LT-201" value={`${s.oilLevel.toFixed(0)}%`} onClick={sel("LT-201")} />
        <SensorBadge x={770} y={555} type="LT" id="LT-202" value={`${s.waterLevel.toFixed(0)}%`} onClick={sel("LT-202")} />
        <SensorBadge x={350} y={440} type="AT" id="AT-201" value={`${s.bsw.toFixed(2)}%`} onClick={sel("AT-201")} />

        {/* PSV-201 on top of separator (left of gas outlet) */}
        <PSV x={170} y={420} label="PSV-201" setP={15} actual={s.sepPressure} open={psv201Open} onClick={sel("PSV-201")} />

        {/* Gas outlet to gas sector */}
        <ControlValve x={250} y={420} label="PV-201" open={70} tag="" orient="v" onClick={sel("PV-201")} />
        <g>
          <text x="90" y="370" textAnchor="start" fill="#9aa3b8" fontSize="12" className="scada-value">→ TO GAS SECTOR</text>
          <text x="90" y="388" textAnchor="start" fill="#ff8a4d" fontSize="11" className="scada-value">{s.sepGasFlow.toFixed(0)} m³/h</text>
          <polygon points="60,380 75,373 75,387" fill={GAS} />
        </g>

        {/* === LV-201 oil level control valve on oil pipe === */}
        <ControlValve x={500} y={640} label="LV-201" open={s.lv201} tag={`${s.lv201.toFixed(0)}%`} orient="v" onClick={sel("LV-201")} />

        {/* === LV-202 water control valve === */}
        <ControlValve x={720} y={720} label="LV-202" open={s.lv202} tag={`${s.lv202.toFixed(0)}%`} orient="h" onClick={sel("LV-202")} />

        {/* === XV-201 pump suction isolation === */}
        <GateValve x={450} y={730} label="XV-201" open={s.pumpRunning ? 100 : 100} orient="v" onClick={sel("XV-201")} />

        {/* === Crude Pump P-201 (large, centered) === */}
        <g onClick={sel("pump")} className="cursor-pointer">
          {/* Skid */}
          <rect x="320" y="870" width="260" height="18" fill="#1a2030" stroke="#3a4258" />
          {/* Motor (left) */}
          <rect x="320" y="780" width="80" height="100" rx="6" fill="url(#oMetal)" stroke="#3a4258" strokeWidth="1.5" />
          {[0,1,2,3,4].map(i => <line key={i} x1="328" y1={790+i*18} x2="392" y2={790+i*18} stroke="#1a2030" strokeWidth="1.5" />)}
          <rect x="395" y="822" width="20" height="16" fill="#3a4258" />
          {/* Pump casing (volute) */}
          <circle cx="470" cy="830" r="55" fill="url(#oMetal)" stroke="#3a4258" strokeWidth="2" />
          <circle cx="470" cy="830" r="42" fill="#0a0e1a" stroke="#3a4258" strokeWidth="1.5" />
          {/* Impeller curved blades */}
          <g className={s.pumpRunning ? "animate-spin-fast" : ""} style={{ transformOrigin: "470px 830px" }}>
            {[0,1,2,3,4,5,6].map(i => {
              const a = (i * Math.PI) / 3.5;
              return (
                <path
                  key={i}
                  d={`M 470 830 Q ${470 + 22*Math.cos(a)} ${830 + 22*Math.sin(a)} ${470 + 38*Math.cos(a+0.5)} ${830 + 38*Math.sin(a+0.5)}`}
                  stroke="#0080ff"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
            <circle cx="470" cy="830" r="6" fill="#0080ff" />
          </g>
          {/* Discharge stub (up from casing) */}
          <rect x="462" y="765" width="16" height="20" fill="#3a4258" />

          {/* Label box */}
          <rect x="535" y="800" width="120" height="80" fill="#0a0e1a" stroke="#3a4258" rx="3" />
          <text x="595" y="820" textAnchor="middle" fill="#0080ff" fontSize="13" className="scada-value">P-201</text>
          <text x="595" y="838" textAnchor="middle" fill="#ff8a4d" fontSize="11" className="scada-value">{s.pumpFlow.toFixed(0)} m³/h</text>
          <text x="595" y="852" textAnchor="middle" fill="#9aa3b8" fontSize="11" className="scada-value">{s.pumpRpm.toFixed(0)} rpm</text>
          <text x="595" y="866" textAnchor="middle" fill="#9aa3b8" fontSize="11" className="scada-value">η {s.pumpEff.toFixed(0)}%  ΔP {s.pumpDP.toFixed(1)}</text>

          <text x="450" y="910" textAnchor="middle" fill="#9aa3b8" fontSize="13" className="scada-value">
            P-201 Centrifugal Crude Pump — {s.pumpRunning ? "RUNNING" : "STOPPED"}
          </text>
        </g>
        <SensorBadge x={395} y={760} type="PT" id="PT-203" value={`${(s.sepPressure*0.9).toFixed(1)} bar`} onClick={sel("PT-203")} />
        <SensorBadge x={395} y={905} type="FT" id="FT-201" value={`${s.pumpFlow.toFixed(0)} m³/h`} onClick={sel("FT-201")} />

        {/* === CV-202 check valve (post-pump) === */}
        <CheckValve x={450} y={960} label="CV-202" orient="v" onClick={sel("CV-202")} />

        {/* === FV-201 flow control === */}
        <ControlValve x={450} y={1000} label="FV-201" open={s.fv201} tag={`${s.fv201.toFixed(0)}%`} orient="v" onClick={sel("FV-201")} />

        {/* === Heat Exchanger E-201 === */}
        <g onClick={sel("hx")} className="cursor-pointer">
          <rect x="290" y="1040" width="320" height="100" rx="8" fill="url(#oMetal)" stroke="#3a4258" strokeWidth="1.5" />
          {[0,1,2,3,4,5,6].map(i => (
            <line key={i} x1="300" y1={1055 + i*12} x2="600" y2={1055 + i*12} stroke="#0080ff" strokeWidth="2" opacity="0.6" />
          ))}
          <rect x="280" y="1040" width="12" height="100" fill="#3a4258" />
          <rect x="608" y="1040" width="12" height="100" fill="#3a4258" />
          {/* Utility nozzles */}
          <rect x="320" y="1022" width="18" height="20" fill="#3a4258" />
          <rect x="562" y="1138" width="18" height="20" fill="#3a4258" />
          <text x="329" y="1015" fill="#ff5577" fontSize="10" className="scada-value">UT IN</text>
          <text x="571" y="1175" fill="#ff5577" fontSize="10" className="scada-value">UT OUT</text>
          <text x="450" y="1175" textAnchor="middle" fill="#9aa3b8" fontSize="13" className="scada-value">E-201 Shell &amp; Tube HX</text>
          <text x="450" y="1192" textAnchor="middle" fill="#ff8a4d" fontSize="11" className="scada-value">
            {s.hxCrudeIn.toFixed(0)}→{s.hxCrudeOut.toFixed(0)}°C · Q {s.hxDuty.toFixed(0)} kW · LMTD {s.hxLMTD.toFixed(1)}°C
          </text>
        </g>
        <SensorBadge x={245} y={1090} type="TT" id="TT-202" value={`${s.hxCrudeIn.toFixed(0)}°C`} onClick={sel("TT-202")} />
        <SensorBadge x={655} y={1090} type="TT" id="TT-203" value={`${s.hxCrudeOut.toFixed(0)}°C`} onClick={sel("TT-203")} />

        {/* === TV-201 temperature control valve === */}
        <ControlValve x={580} y={1180} label="TV-201" open={s.utilityFlow} tag={`${s.utilityFlow.toFixed(0)}%`} orient="h" onClick={sel("TV-201")} />

        {/* === Electrostatic Dehydrator D-201 === */}
        <g onClick={sel("dehy")} className="cursor-pointer">
          <rect x="350" y="1100" width="200" height="130" rx="12" fill="url(#oVessel)" stroke="#3a4258" strokeWidth="1.5" />
          <line x1="370" y1="1125" x2="530" y2="1125" stroke={s.dehydratorOn ? "#ffcc00" : "#444"} strokeWidth="3" />
          <line x1="370" y1="1205" x2="530" y2="1205" stroke={s.dehydratorOn ? "#ffcc00" : "#444"} strokeWidth="3" />
          {s.dehydratorOn && [0,1,2,3,4,5,6,7].map(i => (
            <line key={i} x1={380 + i*20} y1="1125" x2={380 + i*20} y2="1205" stroke="#ffee66" strokeWidth="1" strokeDasharray="2 3" opacity="0.7">
              <animate attributeName="opacity" values="0.2;1;0.2" dur="0.6s" repeatCount="indefinite" begin={`${i*0.1}s`} />
            </line>
          ))}
          <text x="450" y="1255" textAnchor="middle" fill="#9aa3b8" fontSize="13" className="scada-value">D-201 Electrostatic Dehydrator</text>
          <text x="450" y="1272" textAnchor="middle" fill="#ff8a4d" fontSize="11" className="scada-value">
            BS&amp;W {s.bswIn.toFixed(2)}→{s.bswOut.toFixed(2)}% · {s.dehydratorKV.toFixed(0)} kV
          </text>
        </g>
        <SensorBadge x={310} y={1165} type="AT" id="AT-202" value={`${s.bswOut.toFixed(2)}%`} onClick={sel("AT-202")} />

        {/* === Storage Tank TK-201 (floating roof) === */}
        <g onClick={sel("tank")} className="cursor-pointer">
          <rect x="310" y="1300" width="280" height="220" fill="url(#oVessel)" stroke="#3a4258" strokeWidth="1.5" />
          <clipPath id="tankClip201"><rect x="311" y="1301" width="278" height="218" /></clipPath>
          <g clipPath="url(#tankClip201)">
            <rect x="310" y={1520 - (s.tankLevel / 100) * 218} width="280" height={(s.tankLevel / 100) * 218 + 4} fill="url(#oOil)" opacity="0.85" />
            <rect x="315" y={1520 - (s.tankLevel / 100) * 218 - 8} width="270" height="12" fill="#3a4258" stroke="#1a2030" />
            <rect x="315" y={1520 - (s.tankLevel / 100) * 218 - 8} width="270" height="3" fill="#5a6480" />
          </g>
          <line x1="310" y1="1300" x2="310" y2="1520" stroke="#3a4258" strokeWidth="3" />
          <line x1="590" y1="1300" x2="590" y2="1520" stroke="#3a4258" strokeWidth="3" />
          <line x1="590" y1="1520" x2="620" y2="1320" stroke="#3a4258" strokeWidth="2" />
          {/* Level gauge */}
          <rect x="600" y="1320" width="12" height="200" fill="#0a0e1a" stroke="#3a4258" />
          <rect x="600" y={1520 - (s.tankLevel / 100) * 200} width="12" height={(s.tankLevel / 100) * 200} fill="#ff8a4d" />
          <text x="450" y="1545" textAnchor="middle" fill="#9aa3b8" fontSize="14" className="scada-value">TK-201 Floating Roof Storage Tank</text>
          <text x="450" y="1563" textAnchor="middle" fill="#ff8a4d" fontSize="12" className="scada-value">
            Lvl {s.tankLevel.toFixed(0)}% · {s.tankVolume.toFixed(0)} m³ · {s.tankTemp.toFixed(0)}°C
          </text>
        </g>
        <SensorBadge x={270} y={1380} type="LT" id="LT-203" value={`${s.tankLevel.toFixed(0)}%`} onClick={sel("LT-203")} />
        <SensorBadge x={270} y={1430} type="TT" id="TT-204" value={`${s.tankTemp.toFixed(0)}°C`} onClick={sel("TT-204")} />

        {/* PSV-202 on tank */}
        <PSV x={500} y={1280} label="PSV-202" setP={5} actual={s.vaporP} open={psv202Open} onClick={sel("PSV-202")} />

        {/* Export valve XV-202 */}
        <GateValve x={700} y={1590} label="XV-202" open={s.exportValve} orient="v" onClick={sel("XV-202")} />
        <text x={700} y={1655} textAnchor="middle" fill="#9aa3b8" fontSize="12" className="scada-value">→ EXPORT</text>
        <polygon points="700,1670 693,1655 707,1655" fill={OIL} />

        {/* ============ RIGHT BRANCH: WATER TREATMENT ============ */}
        {/* Branch banner */}
        <g>
          <rect x="720" y="650" width="170" height="22" fill="#0a0e1a" stroke={WATER} strokeWidth="1" rx="3" />
          <text x="805" y="666" textAnchor="middle" fill={WATER} fontSize="11" className="scada-value">PRODUCED WATER TREATMENT</text>
        </g>

        {/* WT-201 Water Treatment vessel */}
        <g onClick={sel("wt")} className="cursor-pointer">
          <rect x="740" y="700" width="160" height="120" rx="8" fill="url(#oMetal)" stroke={WATER} strokeWidth="1.5" />
          {[0,1,2,3,4].map(i => (
            <line key={i} x1="755" y1={720 + i*18} x2="885" y2={720 + i*18} stroke={WATER} strokeWidth="1.5" opacity="0.6" />
          ))}
          <text x="820" y="845" textAnchor="middle" fill={WATER} fontSize="13" className="scada-value">WT-201 Water Treatment</text>
          <text x="820" y="862" textAnchor="middle" fill={s.wtOilInWater > 40 ? "#ff4444" : "#00ff88"} fontSize="12" className="scada-value">
            {s.wtOilInWater.toFixed(0)} ppm O-in-W
          </text>
        </g>
        <SensorBadge x={905} y={750} type="AT" id="AT-202" value={`${s.wtOilInWater.toFixed(0)} ppm`} onClick={sel("AT-202")} />
        <SensorBadge x={905} y={790} type="FT" id="FT-202" value={`${(s.lv202 * 0.6).toFixed(0)} m³/h`} onClick={sel("FT-202")} />

        {/* Water storage tank */}
        <g onClick={sel("wtank")} className="cursor-pointer">
          <rect x="720" y="900" width="200" height="200" fill="url(#oVessel)" stroke={WATER} strokeWidth="1.5" rx="4" />
          <clipPath id="wtankClip"><rect x="721" y="901" width="198" height="198" /></clipPath>
          <g clipPath="url(#wtankClip)">
            <rect x="720" y={1100 - (s.waterLevel * 1.5)} width="200" height={s.waterLevel * 1.5 + 4} fill="url(#oWater)" opacity="0.85" />
          </g>
          <text x="820" y="1125" textAnchor="middle" fill={WATER} fontSize="13" className="scada-value">Water Storage</text>
          <text x="820" y="1142" textAnchor="middle" fill="#9aa3b8" fontSize="11" className="scada-value">{(s.waterLevel * 12).toFixed(0)} m³ · {s.sepTemp.toFixed(0)}°C</text>
        </g>

        {/* Pipe legend already shown outside SVG */}
      </svg>

      {/* Zoom controls */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
        <button onClick={() => setUserZoom((z) => Math.min(4, +(z + 0.2).toFixed(2)))} className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 hover:bg-muted backdrop-blur"><ZoomIn className="h-4 w-4" /></button>
        <button onClick={() => setUserZoom((z) => Math.max(0.3, +(z - 0.2).toFixed(2)))} className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 hover:bg-muted backdrop-blur"><ZoomOut className="h-4 w-4" /></button>
        <button onClick={reset} className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 hover:bg-muted backdrop-blur" title="Fit to screen"><Maximize2 className="h-4 w-4" /></button>
        <button onClick={reset} className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card/90 hover:bg-muted backdrop-blur" title="Reset view"><RotateCcw className="h-4 w-4" /></button>
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

      {selected && <DetailPanel id={selected as SelKey} />}
    </div>
  );
}

/* =================== Building blocks =================== */

function Pipe({ d, color, dashed, thick = 14 }: { d: string; color: string; dashed?: boolean; thick?: number }) {
  return (
    <g>
      <path d={d} stroke="#141a2a" strokeWidth={thick + 8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke="#2a3148" strokeWidth={thick + 4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={color} strokeWidth={Math.max(4, thick - 6)} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed ? "12 8" : "10 6"} opacity="0.9" />
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

function SensorBadge({ x, y, type, id, value, onClick }: { x: number; y: number; type: "PT" | "TT" | "FT" | "LT" | "AT"; id: string; value?: string; onClick?: (e: React.MouseEvent) => void }) {
  const colors: Record<string, string> = { PT: "#3aa0ff", TT: "#ff5577", FT: "#00ff88", LT: "#ff9a3c", AT: "#cc66ff" };
  return (
    <g onClick={onClick} className={onClick ? "cursor-pointer" : ""}>
      <circle cx={x} cy={y} r="16" fill={colors[type]} opacity="0.18" />
      <circle cx={x} cy={y} r="11" fill={colors[type]} stroke="#0a0e1a" strokeWidth="2" />
      <text x={x} y={y + 4} textAnchor="middle" fill="#0a0e1a" fontSize="9" fontWeight="700">{type}</text>
      <text x={x} y={y + 28} textAnchor="middle" fill="#9aa3b8" fontSize="10" className="scada-value">{id}</text>
      {value && <text x={x} y={y + 42} textAnchor="middle" fill="#ff8a4d" fontSize="9" className="scada-value">{value}</text>}
    </g>
  );
}

/** Gate valve — bowtie/double-triangle symbol */
function GateValve({ x, y, label, open, orient = "v", onClick }: { x: number; y: number; label: string; open: number; orient?: "v" | "h"; onClick?: (e: React.MouseEvent) => void }) {
  const c = open > 50 ? "#00ff88" : open > 10 ? "#ffaa00" : "#ff4444";
  const r = 16;
  const pts = orient === "v"
    ? `${x-r},${y-r} ${x+r},${y-r} ${x},${y} ${x-r},${y+r} ${x+r},${y+r} ${x},${y}`
    : `${x-r},${y-r} ${x-r},${y+r} ${x},${y} ${x+r},${y-r} ${x+r},${y+r} ${x},${y}`;
  return (
    <g onClick={onClick} className="cursor-pointer">
      <polygon points={pts} fill="url(#oMetal)" stroke="#1a2030" strokeWidth="1.5" />
      <circle cx={x} cy={y} r="4" fill={c} />
      {/* stem */}
      <rect x={x-3} y={y-r-10} width="6" height="10" fill="#3a4258" />
      <line x1={x-9} y1={y-r-12} x2={x+9} y2={y-r-12} stroke="#0080ff" strokeWidth="2.5" />
      <text x={x + r + 8} y={y + 4} fill="#9aa3b8" fontSize="11" className="scada-value">{label}</text>
      <text x={x + r + 8} y={y + 18} fill={c} fontSize="10" className="scada-value">{open >= 95 ? "OPEN" : open <= 5 ? "CLOSED" : `${open.toFixed(0)}%`}</text>
    </g>
  );
}

/** Control valve — bowtie with diaphragm actuator circle on top */
function ControlValve({ x, y, label, open, tag, orient = "v", onClick }: { x: number; y: number; label: string; open: number; tag: string; orient?: "v" | "h"; onClick?: (e: React.MouseEvent) => void }) {
  const c = open > 50 ? "#00ff88" : open > 10 ? "#ffaa00" : "#ff4444";
  const r = 16;
  const pts = orient === "v"
    ? `${x-r},${y-r} ${x+r},${y-r} ${x},${y} ${x-r},${y+r} ${x+r},${y+r} ${x},${y}`
    : `${x-r},${y-r} ${x-r},${y+r} ${x},${y} ${x+r},${y-r} ${x+r},${y+r} ${x},${y}`;
  return (
    <g onClick={onClick} className="cursor-pointer">
      <polygon points={pts} fill="url(#oMetal)" stroke="#1a2030" strokeWidth="1.5" />
      <circle cx={x} cy={y} r="4" fill={c} />
      {/* actuator: diaphragm above */}
      <rect x={x-2} y={y-r-22} width="4" height="22" fill="#3a4258" />
      <circle cx={x} cy={y-r-30} r="12" fill="url(#oMetal)" stroke="#3a4258" strokeWidth="1.5" />
      <polygon points={`${x-6},${y-r-30} ${x+6},${y-r-30} ${x},${y-r-22}`} fill="#0080ff" />
      <text x={x + r + 8} y={y - 4} fill="#9aa3b8" fontSize="11" className="scada-value">{label}</text>
      <text x={x + r + 8} y={y + 12} fill={c} fontSize="10" className="scada-value">{tag || `${open.toFixed(0)}%`}</text>
    </g>
  );
}

/** Check valve — triangle pointing in flow direction with a bar */
function CheckValve({ x, y, label, orient = "v", onClick }: { x: number; y: number; label: string; orient?: "v" | "h"; onClick?: (e: React.MouseEvent) => void }) {
  const r = 14;
  const pts = orient === "v"
    ? `${x-r},${y-r} ${x+r},${y-r} ${x},${y+r}`
    : `${x-r},${y-r} ${x-r},${y+r} ${x+r},${y}`;
  return (
    <g onClick={onClick} className="cursor-pointer">
      <polygon points={pts} fill="url(#oMetal)" stroke="#1a2030" strokeWidth="1.5" />
      {orient === "v"
        ? <line x1={x-r} y1={y+r+2} x2={x+r} y2={y+r+2} stroke="#0080ff" strokeWidth="2.5" />
        : <line x1={x+r+2} y1={y-r} x2={x+r+2} y2={y+r} stroke="#0080ff" strokeWidth="2.5" />}
      <text x={x + r + 8} y={y + 4} fill="#9aa3b8" fontSize="11" className="scada-value">{label}</text>
    </g>
  );
}

/** PSV — spring symbol with set point. Blinks when relieving. */
function PSV({ x, y, label, setP, actual, open, onClick }: { x: number; y: number; label: string; setP: number; actual: number; open: boolean; onClick?: (e: React.MouseEvent) => void }) {
  const c = open ? "#ff4444" : "#00ff88";
  return (
    <g onClick={onClick} className={`cursor-pointer ${open ? "animate-alarm" : ""}`}>
      {/* body */}
      <rect x={x-12} y={y-14} width="24" height="20" fill="url(#oMetal)" stroke="#3a4258" />
      {/* spring (zig-zag) */}
      <polyline points={`${x-8},${y-14} ${x-4},${y-22} ${x+4},${y-18} ${x-4},${y-30} ${x+4},${y-34} ${x},${y-42}`} fill="none" stroke="#0080ff" strokeWidth="2" />
      <rect x={x-6} y={y-46} width="12" height="6" fill="#3a4258" />
      {/* outlet */}
      <rect x={x+12} y={y-8} width="14" height="8" fill="#3a4258" />
      <circle cx={x} cy={y+10} r="4" fill={c} />
      <text x={x - 36} y={y - 4} textAnchor="end" fill="#9aa3b8" fontSize="10" className="scada-value">{label}</text>
      <text x={x - 36} y={y + 10} textAnchor="end" fill={c} fontSize="9" className="scada-value">SP {setP} bar</text>
      <text x={x - 36} y={y + 22} textAnchor="end" fill={open ? "#ff4444" : "#7d869c"} fontSize="9" className="scada-value">{open ? "RELIEVING" : "CLOSED"}</text>
    </g>
  );
}

/* =================== Detail panel =================== */

function DetailPanel({ id }: { id: string }) {
  const s = useOilSim();
  const close = () => useOilSim.getState().setSelected(null);

  const eqRows: Record<string, { title: string; rows: [string, string][]; design?: string; status?: string }> = {
    well: { title: "Wellhead WH-201", rows: [["Pressure", `${s.wellPressure.toFixed(1)} bar`], ["Temp", `${s.wellTemp.toFixed(0)} °C`]], design: "Max 200 bar / 120 °C", status: "FLOWING" },
    choke: { title: "Choke Valve CV-201", rows: [["Opening", `${s.chokeOpen.toFixed(0)} %`], ["Upstream", `${s.upstreamP.toFixed(1)} bar`], ["Downstream", `${s.downstreamP.toFixed(1)} bar`]], design: "ΔP up to 150 bar" },
    sep: { title: "3-Phase Separator V-201", rows: [["Pressure", `${s.sepPressure.toFixed(1)} bar`], ["Temp", `${s.sepTemp.toFixed(1)} °C`], ["Oil level", `${s.oilLevel.toFixed(0)} %`], ["Water level", `${s.waterLevel.toFixed(0)} %`], ["BS&W", `${s.bsw.toFixed(2)} %`], ["Gas out", `${s.sepGasFlow.toFixed(0)} m³/h`]], design: "MAWP 25 bar / 90 °C", status: "NORMAL" },
    pump: { title: "Crude Pump P-201", rows: [["Status", s.pumpRunning ? "RUNNING" : "STOPPED"], ["Flow", `${s.pumpFlow.toFixed(1)} m³/h`], ["ΔP", `${s.pumpDP.toFixed(2)} bar`], ["Efficiency", `${s.pumpEff.toFixed(0)} %`], ["Speed", `${s.pumpRpm.toFixed(0)} rpm`]], design: "BEP 180 m³/h @ 12 bar", status: s.pumpRunning ? "RUNNING" : "STOPPED" },
    hx: { title: "Heat Exchanger E-201", rows: [["Crude in", `${s.hxCrudeIn.toFixed(1)} °C`], ["Crude out", `${s.hxCrudeOut.toFixed(1)} °C`], ["Duty", `${s.hxDuty.toFixed(0)} kW`], ["LMTD", `${s.hxLMTD.toFixed(2)} °C`], ["Fouling", `${(s.hxFouling * 100).toFixed(1)} %`], ["Utility flow", `${s.utilityFlow.toFixed(0)} %`]], design: "U=800 W/m²K · A=50 m²" },
    dehy: { title: "Electrostatic Dehydrator D-201", rows: [["Status", s.dehydratorOn ? "ENERGIZED" : "OFF"], ["Voltage", `${s.dehydratorKV.toFixed(1)} kV`], ["BS&W in", `${s.bswIn.toFixed(2)} %`], ["BS&W out", `${s.bswOut.toFixed(2)} %`]], design: "15–30 kV electrostatic" },
    tank: { title: "Storage Tank TK-201", rows: [["Level", `${s.tankLevel.toFixed(1)} %`], ["Volume", `${s.tankVolume.toFixed(0)} m³`], ["Temp", `${s.tankTemp.toFixed(1)} °C`], ["Vapor P", `${s.vaporP.toFixed(2)} barg`]], design: "Capacity 10 000 m³ · floating roof" },
    wt: { title: "Water Treatment WT-201", rows: [["Oil-in-water", `${s.wtOilInWater.toFixed(0)} ppm`], ["Discharge limit", "40 ppm"]], design: "OSPAR ≤ 40 ppm" },
    wtank: { title: "Produced Water Tank", rows: [["Level (eqv.)", `${s.waterLevel.toFixed(0)} %`], ["Volume", `${(s.waterLevel * 12).toFixed(0)} m³`]] },
  };

  // Generic valve rows
  const valveRows = (label: string, type: string, open: number, extra: [string, string][] = []): { title: string; rows: [string, string][] } => ({
    title: `${label} — ${type}`,
    rows: [
      ["Type", type],
      ["Position", `${open.toFixed(0)} %`],
      ["State", open >= 95 ? "OPEN" : open <= 5 ? "CLOSED" : "PARTIAL"],
      ...extra,
    ],
  });

  const sensorRows = (tag: string, type: string, value: string, lo: string, hi: string): { title: string; rows: [string, string][] } => {
    // 4-20mA mapping
    const num = parseFloat(value);
    const mA = isFinite(num) ? (4 + (num / 100) * 16).toFixed(1) : "—";
    return {
      title: `${tag} — ${type}`,
      rows: [["Value", value], ["4-20 mA", `${mA} mA`], ["Low alarm", lo], ["High alarm", hi]],
    };
  };

  const valveMap: Record<string, () => { title: string; rows: [string, string][] }> = {
    "SDV-201": () => valveRows("SDV-201", "Gate (Shutdown)", 100, [["Upstream P", `${s.wellPressure.toFixed(1)} bar`], ["Function", "Emergency isolation"]]),
    "CV-201": () => valveRows("CV-201", "Control (Choke)", s.chokeOpen, [["Upstream", `${s.upstreamP.toFixed(1)} bar`], ["Downstream", `${s.downstreamP.toFixed(1)} bar`]]),
    "LV-201": () => valveRows("LV-201", "Control (Oil Lvl)", s.lv201, [["Loop", "LIC-201"], ["Flow", `${s.crudeFlow.toFixed(0)} m³/h`]]),
    "LV-202": () => valveRows("LV-202", "Control (Water Lvl)", s.lv202, [["Loop", "LIC-202"], ["Flow", `${(s.lv202 * 0.6).toFixed(0)} m³/h`]]),
    "PV-201": () => valveRows("PV-201", "Control (Gas P)", 70, [["Loop", "PIC-201"], ["Gas flow", `${s.sepGasFlow.toFixed(0)} m³/h`]]),
    "XV-201": () => valveRows("XV-201", "Gate (Pump Suction)", s.pumpRunning ? 100 : 100, [["Interlock", "Must be OPEN before pump start"]]),
    "FV-201": () => valveRows("FV-201", "Control (Flow)", s.fv201, [["Loop", "FIC-201"], ["Flow", `${s.pumpFlow.toFixed(0)} m³/h`]]),
    "CV-202": () => valveRows("CV-202", "Check Valve", 100, [["Function", "Prevent reverse flow"]]),
    "TV-201": () => valveRows("TV-201", "Control (Temp)", s.utilityFlow, [["Loop", "TIC-201"], ["Crude out", `${s.hxCrudeOut.toFixed(0)} °C`]]),
    "XV-202": () => valveRows("XV-202", "Gate (Export)", s.exportValve, [["Function", "Final export isolation"]]),
    "PSV-201": () => valveRows("PSV-201", "Safety Relief", s.sepPressure > 15 ? 100 : 0, [["Set pressure", "15 bar"], ["Actual", `${s.sepPressure.toFixed(1)} bar`], ["State", s.sepPressure > 15 ? "RELIEVING" : "CLOSED"]]),
    "PSV-202": () => valveRows("PSV-202", "Safety Relief", s.vaporP > 5 ? 100 : 0, [["Set pressure", "5 bar"], ["Actual", `${s.vaporP.toFixed(2)} bar`], ["State", s.vaporP > 5 ? "RELIEVING" : "CLOSED"]]),
  };

  const sensorMap: Record<string, () => { title: string; rows: [string, string][] }> = {
    "PT-201": () => sensorRows("PT-201", "Pressure", `${s.wellPressure.toFixed(0)} bar`, "80 bar", "180 bar"),
    "TT-201": () => sensorRows("TT-201", "Temperature", `${s.wellTemp.toFixed(0)} °C`, "30 °C", "120 °C"),
    "PT-202": () => sensorRows("PT-202", "Pressure", `${s.sepPressure.toFixed(1)} bar`, "5 bar", "14 bar"),
    "TT-202": () => sensorRows("TT-202", "Temperature", `${s.sepTemp.toFixed(0)} °C`, "40 °C", "95 °C"),
    "LT-201": () => sensorRows("LT-201", "Level", `${s.oilLevel.toFixed(0)} %`, "20 %", "85 %"),
    "LT-202": () => sensorRows("LT-202", "Level", `${s.waterLevel.toFixed(0)} %`, "15 %", "80 %"),
    "AT-201": () => sensorRows("AT-201", "BS&W Analyzer", `${s.bsw.toFixed(2)} %`, "—", "2.0 %"),
    "FT-201": () => sensorRows("FT-201", "Flow", `${s.pumpFlow.toFixed(0)} m³/h`, "50 m³/h", "220 m³/h"),
    "PT-203": () => sensorRows("PT-203", "Pressure", `${(s.sepPressure * 0.9).toFixed(1)} bar`, "1 bar", "20 bar"),
    "TT-203": () => sensorRows("TT-203", "Temperature", `${s.hxCrudeOut.toFixed(0)} °C`, "70 °C", "120 °C"),
    "TT-204": () => sensorRows("TT-204", "Temperature", `${s.tankTemp.toFixed(0)} °C`, "20 °C", "95 °C"),
    "LT-203": () => sensorRows("LT-203", "Level", `${s.tankLevel.toFixed(0)} %`, "10 %", "90 %"),
    "FT-202": () => sensorRows("FT-202", "Flow", `${(s.lv202 * 0.6).toFixed(0)} m³/h`, "0 m³/h", "80 m³/h"),
    "AT-202": () => sensorRows("AT-202", "Oil-in-Water", `${s.wtOilInWater.toFixed(0)} ppm`, "—", "40 ppm"),
  };

  let panel: { title: string; rows: [string, string][]; design?: string; status?: string } | undefined;
  if (eqRows[id]) panel = eqRows[id];
  else if (valveMap[id]) panel = valveMap[id]();
  else if (sensorMap[id]) panel = sensorMap[id]();

  if (!panel) return null;

  return (
    <div className="absolute bottom-3 left-3 right-3 z-10 rounded-md border border-border bg-card/95 p-3 backdrop-blur sm:right-auto sm:max-w-xs" onClick={(e) => e.stopPropagation()}>
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-widest text-primary">{panel.title}</div>
        <button onClick={close} className="rounded p-1 hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="space-y-1">
        {panel.rows.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-border/40 py-1 font-mono text-xs">
            <span className="text-muted-foreground">{k}</span><span className="scada-value">{v}</span>
          </div>
        ))}
        {panel.design && <div className="pt-2 font-mono text-[10px] text-muted-foreground">Design: {panel.design}</div>}
        {panel.status && <div className="font-mono text-[10px] text-[#00ff88]">Status: {panel.status}</div>}
      </div>
    </div>
  );
}
