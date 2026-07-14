import { create } from "zustand";
import type { Alarm, AlarmLevel } from "./store";

export type OilFault =
  | "none"
  | "pump_cavitation"
  | "hx_fouling"
  | "emulsion"
  | "water_carryover"
  | "sand_production";

export interface OilTrendPoint {
  t: number;
  wellPressure: number;
  oilLevel: number;
  waterLevel: number;
  crudeFlow: number;
  bsw: number;
  tankLevel: number;
  exportTemp: number;
  pumpEff: number;
  pumpDP: number;
  hxOut: number;
}

interface OilState {
  // process
  wellPressure: number; // bar (120-150)
  wellTemp: number; // °C
  chokeOpen: number; // %
  upstreamP: number;
  downstreamP: number;

  sepPressure: number;
  sepTemp: number;
  oilLevel: number; // %
  waterLevel: number; // %
  bsw: number; // %
  sepGasFlow: number;

  pumpRunning: boolean;
  pumpRpm: number;
  pumpDP: number; // diff pressure bar
  pumpFlow: number; // m³/h
  pumpEff: number; // %
  crudeFlow: number;

  hxCrudeIn: number;
  hxCrudeOut: number;
  hxDuty: number; // kW
  hxLMTD: number;
  hxFouling: number; // 0..1
  utilityFlow: number; // %

  dehydratorOn: boolean;
  dehydratorKV: number; // 15-30
  bswIn: number;
  bswOut: number;

  tankLevel: number; // %
  tankVolume: number; // m³
  tankTemp: number;
  vaporP: number;

  wtOilInWater: number; // ppm

  // controllers
  lic201Auto: boolean; // oil level
  lic201SP: number;
  lic202Auto: boolean; // water level
  lic202SP: number;
  fic201Auto: boolean;
  fic201SP: number;
  tic201Auto: boolean;
  tic201SP: number;

  // valves
  lv201: number; // oil draw
  lv202: number; // water dump
  fv201: number; // crude flow
  exportValve: number;

  inletFlow: number;
  fault: OilFault;
  alarms: Alarm[];
  trend: OilTrendPoint[];
  selected: string | null;

  setSelected: (id: string | null) => void;
  setChoke: (v: number) => void;
  setInletFlow: (v: number) => void;
  setValve: (which: "lv201" | "lv202" | "fv201" | "exportValve", v: number) => void;
  startPump: () => void;
  stopPump: () => void;
  toggleDehy: () => void;
  setDehyKV: (v: number) => void;
  setController: (
    p: Partial<
      Pick<
        OilState,
        | "lic201Auto"
        | "lic201SP"
        | "lic202Auto"
        | "lic202SP"
        | "fic201Auto"
        | "fic201SP"
        | "tic201Auto"
        | "tic201SP"
        | "utilityFlow"
      >
    >,
  ) => void;
  ackAlarm: (id: string) => void;
  injectFault: (f: OilFault) => void;
  tick: () => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const useOilSim = create<OilState>((set, get) => ({
  wellPressure: 135,
  wellTemp: 80,
  chokeOpen: 45,
  upstreamP: 135,
  downstreamP: 28,

  sepPressure: 25,
  sepTemp: 65,
  oilLevel: 55,
  waterLevel: 35,
  bsw: 1.2,
  sepGasFlow: 850,

  pumpRunning: true,
  pumpRpm: 2950,
  pumpDP: 12,
  pumpFlow: 180,
  pumpEff: 72,
  crudeFlow: 180,

  hxCrudeIn: 60,
  hxCrudeOut: 95,
  hxDuty: 1200,
  hxLMTD: 28,
  hxFouling: 0.05,
  utilityFlow: 70,

  dehydratorOn: true,
  dehydratorKV: 22,
  bswIn: 1.2,
  bswOut: 0.35,

  tankLevel: 48,
  tankVolume: 4800,
  tankTemp: 78,
  vaporP: 0.6,

  wtOilInWater: 28,

  lic201Auto: true,
  lic201SP: 50,
  lic202Auto: true,
  lic202SP: 35,
  fic201Auto: true,
  fic201SP: 180,
  tic201Auto: true,
  tic201SP: 95,

  lv201: 50,
  lv202: 40,
  fv201: 60,
  exportValve: 55,
  inletFlow: 200,
  fault: "none",
  alarms: [],
  trend: [],
  selected: null,

  setSelected: (id) => set({ selected: id }),
  setChoke: (v) => set({ chokeOpen: v }),
  setInletFlow: (v) => set({ inletFlow: v }),
  setValve: (which, v) => set({ [which]: v } as any),
  startPump: () => set({ pumpRunning: true }),
  stopPump: () => set({ pumpRunning: false, pumpRpm: 0, pumpDP: 0, pumpFlow: 0, pumpEff: 0 }),
  toggleDehy: () => set((s) => ({ dehydratorOn: !s.dehydratorOn })),
  setDehyKV: (v) => set({ dehydratorKV: v }),
  setController: (p) => set((s) => ({ ...s, ...p })),
  ackAlarm: (id) =>
    set((s) => ({ alarms: s.alarms.map((a) => (a.id === id ? { ...a, ack: true } : a)) })),
  injectFault: (f) => set({ fault: f }),

  tick: () => {
    const s = get();
    const dt = 0.5;
    const noise = () => (Math.random() - 0.5) * 0.5;

    // Wellhead
    let wellPressure = clamp(120 + s.inletFlow * 0.08 + noise() * 2, 80, 170);
    let upstreamP = wellPressure;
    let downstreamP = clamp(wellPressure * (s.chokeOpen / 100) * 0.35 + 10 + noise(), 5, 80);

    // Separator
    let sepPressure = clamp(downstreamP * 0.9 + noise(), 5, 70);
    let sepTemp = clamp(s.sepTemp + (75 - s.sepTemp) * 0.05 + noise() * 0.2, 40, 100);
    const inflow = s.inletFlow * (s.chokeOpen / 100) * 0.012;
    const oilOut = (s.lv201 / 100) * 2.4;
    const waterOut = (s.lv202 / 100) * 2.0;
    // assume inflow split 60% oil 30% water 10% gas
    const oilIn = inflow * 0.6;
    const waterIn = inflow * 0.3;
    let oilLevel = clamp(s.oilLevel + (oilIn - oilOut) * dt * 4, 0, 100);
    let waterLevel = clamp(s.waterLevel + (waterIn - waterOut) * dt * 4, 0, 100);
    let sepGasFlow = clamp(inflow * 1000 * 0.1 + noise() * 5, 0, 2000);

    // PID for oil/water level
    let lv201 = s.lv201;
    let lv202 = s.lv202;
    if (s.lic201Auto) {
      const err = oilLevel - s.lic201SP;
      lv201 = clamp(50 + err * 2.5, 0, 100);
    }
    if (s.lic202Auto) {
      const err = waterLevel - s.lic202SP;
      lv202 = clamp(40 + err * 3, 0, 100);
    }

    // BS&W — depends on retention time (inversely related to flow) & emulsion fault
    const retention = clamp(120 / Math.max(10, inflow * 100), 0.3, 3);
    let bsw = clamp(2.5 / retention - 0.3 + noise() * 0.1, 0.1, 5);
    if (s.fault === "emulsion") bsw = clamp(bsw + 2.5, 0, 8);

    // Pump
    let pumpRunning = s.pumpRunning;
    let pumpRpm = s.pumpRpm;
    let pumpDP = s.pumpDP;
    let pumpFlow = s.pumpFlow;
    let pumpEff = s.pumpEff;
    if (pumpRunning) {
      pumpRpm = s.pumpRpm + (2950 - s.pumpRpm) * 0.2 + noise() * 8;
      // PID for flow via fv201
      let fv201 = s.fv201;
      if (s.fic201Auto) {
        const err = s.fic201SP - s.crudeFlow;
        fv201 = clamp(60 + err * 0.3, 0, 100);
      }
      pumpFlow = clamp((fv201 / 100) * 220 + noise() * 2, 0, 250);
      pumpDP = clamp(15 - (pumpFlow / 250) * 6 + noise() * 0.3, 0, 20); // Q-H curve
      pumpEff = clamp(80 - Math.pow((pumpFlow - 180) / 60, 2) * 20, 20, 85);
      set({ fv201 });
      if (s.fault === "pump_cavitation") {
        pumpFlow *= 0.7 + Math.random() * 0.3;
        pumpDP *= 0.6;
        pumpEff = Math.max(20, pumpEff - 25);
        pumpRpm += (Math.random() - 0.5) * 200;
      }
    } else {
      pumpRpm = Math.max(0, pumpRpm - 200);
      pumpFlow = 0;
      pumpDP = 0;
      pumpEff = 0;
    }
    let crudeFlow = pumpFlow;

    // Heat exchanger
    let hxFouling = clamp(s.hxFouling + (s.fault === "hx_fouling" ? 0.002 : 0.00005), 0.01, 0.6);
    const U = 800 * (1 - hxFouling); // W/m²K
    const targetOut = s.tic201Auto ? s.tic201SP : s.hxCrudeIn + (s.utilityFlow / 100) * 50;
    let hxCrudeIn = clamp(sepTemp - 5 + noise() * 0.3, 30, 100);
    let utilityFlow = s.utilityFlow;
    if (s.tic201Auto) {
      const err = s.tic201SP - s.hxCrudeOut;
      utilityFlow = clamp(70 + err * 4, 0, 100);
    }
    let hxCrudeOut = clamp(
      hxCrudeIn + (utilityFlow / 100) * 60 * (1 - hxFouling) + noise() * 0.3,
      hxCrudeIn,
      160,
    );
    if (s.tic201Auto) hxCrudeOut = clamp(hxCrudeOut * 0.5 + targetOut * 0.5, hxCrudeIn, 160);
    const dT1 = 140 - hxCrudeOut;
    const dT2 = 100 - hxCrudeIn;
    const hxLMTD =
      dT1 > 0 && dT2 > 0 && dT1 !== dT2
        ? (dT1 - dT2) / Math.log(dT1 / dT2)
        : Math.max(1, (dT1 + dT2) / 2);
    const hxDuty = clamp((U * 50 * hxLMTD) / 1000, 0, 5000);

    // Dehydrator
    let bswIn = bsw;
    let bswOut = s.dehydratorOn
      ? clamp(bswIn * (0.4 - (s.dehydratorKV - 15) * 0.015) + noise() * 0.05, 0.05, 3)
      : bswIn;
    if (s.fault === "water_carryover") bswOut = clamp(bswOut + 1.2, 0, 5);

    // Tank
    const tankIn = crudeFlow / 60; // m³/min
    const tankOutFlow = (s.exportValve / 100) * 4;
    let tankVolume = clamp(s.tankVolume + (tankIn - tankOutFlow) * dt, 0, 10000);
    let tankLevel = clamp((tankVolume / 10000) * 100, 0, 100);
    let tankTemp = clamp(hxCrudeOut - 10 + noise() * 0.2, 20, 120);
    let vaporP = clamp(0.3 + (tankTemp - 60) * 0.02, 0.1, 2);

    // Water treatment
    let wtOilInWater = clamp(
      30 + bsw * 3 + (s.fault === "emulsion" ? 25 : 0) + noise() * 2,
      5,
      200,
    );

    // Alarms
    const alarms = [...s.alarms];
    const push = (id: string, tag: string, desc: string, value: number, level: AlarmLevel) => {
      if (!alarms.find((a) => a.id === id))
        alarms.unshift({ id, tag, description: desc, value, level, ts: Date.now(), ack: false });
    };
    if (bswOut > 2) push("AT-201-HI", "AT-201", "BS&W HIGH — crude off-spec", bswOut, "high");
    if (waterLevel > 80)
      push("LT-202-HI", "LT-202", "Separator water level HIGH", waterLevel, "high");
    if (oilLevel > 85) push("LT-201-HI", "LT-201", "Separator oil level HIGH", oilLevel, "high");
    if (pumpRunning && pumpEff < 40)
      push("P-201-CAV", "P-201", "Pump cavitation warning", pumpEff, "high");
    if (tankLevel > 90) push("LT-203-HH", "LT-203", "Tank HIGH-HIGH level", tankLevel, "critical");
    if (hxCrudeOut < 70)
      push("TT-203-LO", "TT-203", "Low export temperature", hxCrudeOut, "warning");
    if (wtOilInWater > 40)
      push("WT-OIW", "WT-201", "Oil-in-water above discharge limit", wtOilInWater, "high");
    if (s.fault !== "none")
      push(
        `FAULT-${s.fault}`,
        s.fault.toUpperCase(),
        `Active fault: ${s.fault.replace("_", " ")}`,
        0,
        "critical",
      );

    const trend = [
      ...s.trend,
      {
        t: Date.now(),
        wellPressure,
        oilLevel,
        waterLevel,
        crudeFlow,
        bsw: bswOut,
        tankLevel,
        exportTemp: hxCrudeOut,
        pumpEff,
        pumpDP,
        hxOut: hxCrudeOut,
      },
    ].slice(-60);

    set({
      wellPressure,
      upstreamP,
      downstreamP,
      sepPressure,
      sepTemp,
      oilLevel,
      waterLevel,
      bsw,
      sepGasFlow,
      lv201,
      lv202,
      pumpRunning,
      pumpRpm,
      pumpDP,
      pumpFlow,
      pumpEff,
      crudeFlow,
      hxCrudeIn,
      hxCrudeOut,
      hxDuty,
      hxLMTD,
      hxFouling,
      utilityFlow,
      bswIn,
      bswOut,
      tankLevel,
      tankVolume,
      tankTemp,
      vaporP,
      wtOilInWater,
      alarms: alarms.slice(0, 30),
      trend,
    });
  },
}));

let __oilTickHandle: ReturnType<typeof setInterval> | null = null;
export function startOilTicker() {
  if (typeof window === "undefined") return;
  if (__oilTickHandle) return;
  __oilTickHandle = setInterval(() => useOilSim.getState().tick(), 500);
}
