import { create } from "zustand";
import type { Alarm, AlarmLevel } from "./store";

export type StorageFault = "none" | "lt_sensor" | "psv_stuck" | "pump_cav";

export interface StorageTrend {
  t: number;
  tk301: number;
  tk302: number;
  s301: number;
  s302: number;
  inlet: number;
  exportCrude: number;
  exportGas: number;
}

interface StorageState {
  // tanks
  tk301Level: number;
  tk302Level: number;
  tk301Temp: number;
  tk302Temp: number;
  tankCapacity: number; // m³ each

  // spheres
  s301Press: number;
  s302Press: number;
  s301Level: number;
  s302Level: number;
  sphereCapacity: number;

  // flows
  inletFlow: number; // total to manifold
  exportCrude: number;
  exportGas: number;
  dailyExport: number;

  // valves
  mov141: number; // tk301 inlet
  mov142: number; // tk302 inlet
  lv301: number;  // tank outlet control
  pv301: number;  // sphere pressure ctrl
  xv301: number;  // crude export
  xv302: number;  // gas export
  psv301Open: boolean;
  psv302Open: boolean;

  // pumps
  p301: boolean; // crude
  p302: boolean; // gas

  // PID LIC-301
  licAuto: boolean;
  licSP: number;
  kp: number; ki: number; kd: number;
  licInt: number;
  licPrev: number;

  // sim
  fault: StorageFault;
  alarms: Alarm[];
  trend: StorageTrend[];
  selected: string | null;

  // actions
  setSelected: (id: string | null) => void;
  setController: (p: Partial<Pick<StorageState, "licAuto" | "licSP" | "kp" | "ki" | "kd">>) => void;
  setValve: (k: "mov141" | "mov142" | "lv301" | "pv301" | "xv301" | "xv302", v: number) => void;
  setInlet: (v: number) => void;
  setExportCrude: (v: number) => void;
  startPump: (p: "p301" | "p302") => void;
  stopPump: (p: "p301" | "p302") => void;
  ackAlarm: (id: string) => void;
  injectFault: (f: StorageFault) => void;
  tick: () => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const useStorageSim = create<StorageState>((set, get) => ({
  tk301Level: 55,
  tk302Level: 45,
  tk301Temp: 48,
  tk302Temp: 46,
  tankCapacity: 7000,

  s301Press: 14.8,
  s302Press: 15.2,
  s301Level: 68,
  s302Level: 72,
  sphereCapacity: 4000,

  inletFlow: 320,
  exportCrude: 180,
  exportGas: 108,
  dailyExport: 4320,

  mov141: 100, mov142: 100, lv301: 45, pv301: 55, xv301: 100, xv302: 100,
  psv301Open: false, psv302Open: false,

  p301: true, p302: true,

  licAuto: true, licSP: 60, kp: 1.5, ki: 0.2, kd: 0.3,
  licInt: 0, licPrev: 0,

  fault: "none",
  alarms: [],
  trend: [],
  selected: null,

  setSelected: (id) => set({ selected: id }),
  setController: (p) => set((s) => ({ ...s, ...p })),
  setValve: (k, v) => set({ [k]: v } as any),
  setInlet: (v) => set({ inletFlow: v }),
  setExportCrude: (v) => set({ exportCrude: v }),
  startPump: (p) => set({ [p]: true } as any),
  stopPump: (p) => set({ [p]: false } as any),
  ackAlarm: (id) => set((s) => ({ alarms: s.alarms.map((a) => (a.id === id ? { ...a, ack: true } : a)) })),
  injectFault: (f) => set({ fault: f, licInt: 0 }),

  tick: () => {
    const s = get();
    const dt = 0.5;
    const noise = () => (Math.random() - 0.5) * 0.4;

    // Tank capacity & flow constants (m³/h)
    const CAP = 7000;
    const MAX_DRAIN = 400;
    const EXPORT_PUMP = 180;
    const dtHours = dt / 3600; // 0.5s -> hours

    // Split inlet between two tanks via MOVs
    const inSplit = s.mov141 + s.mov142 || 1;
    const inTk1 = s.inletFlow * (s.mov141 / inSplit); // m³/h
    const inTk2 = s.inletFlow * (s.mov142 / inSplit);

    // PID for LIC-301 (SP - PV convention; error>0 -> level low -> close drain)
    let lv301 = s.lv301;
    let licInt = s.licInt;
    let licPrev = s.licPrev;
    if (s.licAuto) {
      const pv = s.tk301Level;
      const e = s.licSP - pv;
      licInt = clamp(licInt + e * dt, -200, 200);
      const de = (e - s.licPrev) / dt;
      licPrev = e;
      // level low (e>0) -> smaller lv301 (drain less); level high (e<0) -> larger lv301
      lv301 = clamp(50 - (s.kp * e + s.ki * licInt + s.kd * de), 0, 100);
    }

    // Drain via LV-301 (both tanks share drain header)
    const drain1 = (lv301 / 100) * MAX_DRAIN * (s.xv301 / 100);
    const drain2 = (lv301 / 100) * MAX_DRAIN * (s.xv301 / 100);
    // Export pump takes from combined header only when running
    const pumpOut = s.p301 ? EXPORT_PUMP : 0;

    // dLevel% = (flow_m3h / CAP) * dtHours * 100
    const dTk1 = ((inTk1 - drain1 - pumpOut * 0.5) / CAP) * dtHours * 100;
    const dTk2 = ((inTk2 - drain2 - pumpOut * 0.5) / CAP) * dtHours * 100;

    let tk301Level = clamp(s.tk301Level + dTk1, 0, 100);
    let tk302Level = clamp(s.tk302Level + dTk2, 0, 100);

    // LT sensor failure: freeze reading at 55%
    if (s.fault === "lt_sensor") tk301Level = 55;


    // Cavitation: pump output oscillates
    let exportCrudeActual = s.p301 ? s.exportCrude : 0;
    if (s.fault === "pump_cav" && s.p301) exportCrudeActual *= 0.5 + Math.random() * 0.6;

    // Spheres
    const gasIn = s.inletFlow * 0.45 * (s.pv301 / 100);
    const gasOut = s.p302 ? s.exportGas * (s.xv302 / 100) : 0;
    let s301Level = clamp(s.s301Level + (gasIn * 0.5 - gasOut * 0.5) * dt * 0.02, 0, 100);
    let s302Level = clamp(s.s302Level + (gasIn * 0.5 - gasOut * 0.5) * dt * 0.02, 0, 100);
    let s301Press = clamp(s.s301Press + (s301Level - 65) * 0.005 + noise() * 0.1, 0, 25);
    let s302Press = clamp(s.s302Press + (s302Level - 65) * 0.005 + noise() * 0.1, 0, 25);

    // PSV-301 stuck open fault
    if (s.fault === "psv_stuck") {
      s301Press = clamp(s301Press - 0.4 * dt, 0, 25);
      s301Level = clamp(s301Level - 0.6 * dt, 0, 100);
    }

    // Auto PSV at 20 bar
    const psv301Open = s.fault === "psv_stuck" || s301Press >= 20;
    const psv302Open = s302Press >= 20;
    if (s301Press >= 20) s301Press = 19.5;
    if (s302Press >= 20) s302Press = 19.5;

    // Temperatures drift toward 48°C
    const tk301Temp = s.tk301Temp + (48 - s.tk301Temp) * 0.05 + noise() * 0.1;
    const tk302Temp = s.tk302Temp + (46 - s.tk302Temp) * 0.05 + noise() * 0.1;

    // Daily export integrator
    const dailyExport = clamp(s.dailyExport + (exportCrudeActual / 7200), 0, 99999);

    // Alarms
    const alarms = [...s.alarms];
    const push = (id: string, tag: string, description: string, value: number, level: AlarmLevel) => {
      if (!alarms.find((a) => a.id === id)) alarms.unshift({ id, tag, description, value, level, ts: Date.now(), ack: false });
    };
    if (tk301Level > 85) push("LT-301-HH", "LT-301", "TK-301 HIGH-HIGH level", tk301Level, "critical");
    else if (tk301Level > 75) push("LT-301-HI", "LT-301", "TK-301 high level", tk301Level, "high");
    if (tk302Level > 85) push("LT-302-HH", "LT-302", "TK-302 HIGH-HIGH level", tk302Level, "critical");
    if (s301Press > 18) push("PT-302-HH", "PT-302", "S-301 high pressure", s301Press, "critical");
    if (s302Press > 18) push("PT-303-HH", "PT-303", "S-302 high pressure", s302Press, "critical");
    if (exportCrudeActual < 50 && s.p301) push("FT-301-LO", "FT-301", "Export flow low", exportCrudeActual, "warning");
    if (s.fault !== "none") push(`FAULT-${s.fault}`, s.fault.toUpperCase(), `Active fault: ${s.fault}`, 0, "critical");

    const trend = [...s.trend, {
      t: Date.now(), tk301: tk301Level, tk302: tk302Level,
      s301: s301Press, s302: s302Press,
      inlet: s.inletFlow, exportCrude: exportCrudeActual, exportGas: gasOut,
    }].slice(-60);

    set({
      tk301Level, tk302Level, tk301Temp, tk302Temp,
      s301Level, s302Level, s301Press, s302Press,
      psv301Open, psv302Open,
      lv301, licInt, licPrev,
      dailyExport,
      alarms: alarms.slice(0, 30),
      trend,
    });
  },
}));

let __stgTick: ReturnType<typeof setInterval> | null = null;
export function startStorageTicker() {
  if (typeof window === "undefined") return;
  if (__stgTick) return;
  __stgTick = setInterval(() => useStorageSim.getState().tick(), 500);
}
