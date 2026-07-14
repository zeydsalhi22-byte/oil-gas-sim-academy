import { create } from "zustand";

export type AlarmLevel = "normal" | "warning" | "high" | "critical";

export interface Alarm {
  id: string;
  tag: string;
  description: string;
  value: number;
  level: AlarmLevel;
  ts: number;
  ack: boolean;
}

export interface TrendPoint {
  t: number;
  wellPressure: number;
  sepLevel: number;
  sepPressure: number;
  discharge: number;
  rpm: number;
  purity: number;
  flow: number;
}

export type FaultType = "none" | "pt_fail" | "valve_stuck" | "leak" | "tt_fail";

interface SimState {
  running: boolean;
  // process variables
  wellPressure: number; // bar
  wellTemp: number;
  sepLevel: number; // %
  sepPressure: number;
  sepTemp: number;
  gasFlow: number; // outlet gas
  liqFlow: number;
  suction: number;
  discharge: number;
  rpm: number;
  compTemp: number;
  power: number;
  compRunning: boolean;
  purity: number;
  // valves
  pvOpen: number; // 0-100
  fvOpen: number;
  lvOpen: number;
  // PID for pressure -> pvOpen
  pidAuto: boolean;
  Kp: number;
  Ki: number;
  Kd: number;
  setpoint: number;
  integral: number;
  prevErr: number;
  // input
  inletFlow: number; // operator-controllable disturbance
  // alarms / trends
  alarms: Alarm[];
  trend: TrendPoint[];
  // faults
  fault: FaultType;
  faultLocation: string;
  // ui
  selected: string | null;
  setSelected: (id: string | null) => void;
  setInletFlow: (n: number) => void;
  setPID: (
    p: Partial<{ Kp: number; Ki: number; Kd: number; setpoint: number; pidAuto: boolean }>,
  ) => void;
  setValve: (which: "pv" | "fv" | "lv", v: number) => void;
  startCompressor: () => void;
  stopCompressor: () => void;
  ackAlarm: (id: string) => void;
  injectFault: (f: FaultType, loc?: string) => void;
  tick: () => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const useSim = create<SimState>((set, get) => ({
  running: true,
  wellPressure: 85,
  wellTemp: 62,
  sepLevel: 55,
  sepPressure: 42,
  sepTemp: 48,
  gasFlow: 1200,
  liqFlow: 35,
  suction: 38,
  discharge: 95,
  rpm: 6800,
  compTemp: 78,
  power: 1450,
  compRunning: true,
  purity: 98.4,
  pvOpen: 55,
  fvOpen: 60,
  lvOpen: 45,
  pidAuto: true,
  Kp: 2.2,
  Ki: 0.3,
  Kd: 0.5,
  setpoint: 95,
  integral: 0,
  prevErr: 0,
  inletFlow: 1200,
  alarms: [],
  trend: [],
  fault: "none",
  faultLocation: "",
  selected: null,

  setSelected: (id) => set({ selected: id }),
  setInletFlow: (n) => set({ inletFlow: n }),
  setPID: (p) => set((s) => ({ ...s, ...p })),
  setValve: (which, v) =>
    set(
      (s) =>
        ({
          ...(which === "pv" ? { pvOpen: v } : which === "fv" ? { fvOpen: v } : { lvOpen: v }),
        }) as Partial<SimState>,
    ),
  startCompressor: () => set({ compRunning: true }),
  stopCompressor: () => set({ compRunning: false, rpm: 0, discharge: 38, power: 0 }),
  ackAlarm: (id) =>
    set((s) => ({ alarms: s.alarms.map((a) => (a.id === id ? { ...a, ack: true } : a)) })),
  injectFault: (f, loc = "") => set({ fault: f, faultLocation: loc }),

  tick: () => {
    const s = get();
    const dt = 0.5;
    // disturbances
    const noise = () => (Math.random() - 0.5) * 0.6;

    // wellhead drifts toward inlet pressure
    const targetWell = 80 + s.inletFlow * 0.005;
    let wellPressure = s.wellPressure + (targetWell - s.wellPressure) * 0.2 + noise();
    let wellTemp = s.wellTemp + noise() * 0.3;

    // separator: level rises with inflow, falls with lvOpen
    const inFlow = s.inletFlow * 0.001;
    const liqOut = (s.lvOpen / 100) * 1.2;
    let sepLevel = clamp(s.sepLevel + (inFlow - liqOut) * dt * 3, 0, 100);
    let sepPressure = clamp(wellPressure * 0.5 + (s.fvOpen - 50) * -0.1 + noise(), 0, 100);
    let sepTemp = s.sepTemp + noise() * 0.2;
    let gasFlow = s.fvOpen * 22 + noise() * 10;
    let liqFlow = liqOut * 30;

    // PID — controls discharge pressure by modulating pvOpen (recycle valve)
    let pvOpen = s.pvOpen;
    let integral = s.integral;
    let prevErr = s.prevErr;
    const pv = s.discharge;
    const err = s.setpoint - pv;
    if (s.pidAuto && s.compRunning) {
      integral = clamp(integral + err * dt, -200, 200);
      const deriv = (err - prevErr) / dt;
      const u = s.Kp * err + s.Ki * 0.1 * integral + s.Kd * deriv;
      // recycle valve: more open -> lower discharge
      pvOpen = clamp(50 - u, 0, 100);
      prevErr = err;
    }

    // Compressor
    let rpm = s.rpm;
    let discharge = s.discharge;
    let compTemp = s.compTemp;
    let power = s.power;
    let suction = sepPressure + noise();
    if (s.compRunning) {
      rpm = s.rpm + (7200 - s.rpm) * 0.15 + noise() * 20;
      const ratio = 2.5 - (pvOpen / 100) * 1.0; // recycle reduces effective ratio
      discharge = clamp(suction * ratio + noise(), 30, 160);
      compTemp = clamp(70 + (discharge - 80) * 0.4, 40, 140);
      power = clamp(800 + (discharge - 40) * 12 + noise() * 5, 0, 4000);
    } else {
      rpm = Math.max(0, s.rpm - 400);
      discharge = Math.max(suction, s.discharge - 5);
      compTemp = Math.max(40, s.compTemp - 1);
      power = 0;
    }
    let purity = clamp(
      99 - (gasFlow > 1800 ? (gasFlow - 1800) * 0.005 : 0) + noise() * 0.05,
      90,
      99.9,
    );

    // Faults
    if (s.fault === "pt_fail") discharge = 0;
    if (s.fault === "tt_fail") compTemp = 999;
    if (s.fault === "valve_stuck") pvOpen = 0;
    if (s.fault === "leak") {
      sepPressure *= 0.6;
      gasFlow *= 0.5;
    }

    // Alarms
    const alarms: Alarm[] = [...s.alarms];
    const pushAlarm = (
      id: string,
      tag: string,
      description: string,
      value: number,
      level: AlarmLevel,
    ) => {
      if (!alarms.find((a) => a.id === id)) {
        alarms.unshift({ id, tag, description, value, level, ts: Date.now(), ack: false });
      }
    };
    if (sepLevel > 85) pushAlarm("LT-101-HI", "LT-101", "Separator level HIGH", sepLevel, "high");
    if (sepLevel < 15) pushAlarm("LT-101-LO", "LT-101", "Separator level LOW", sepLevel, "warning");
    if (discharge > 130)
      pushAlarm("PT-103-HH", "PT-103", "Discharge pressure HIGH-HIGH", discharge, "critical");
    if (compTemp > 120)
      pushAlarm("TT-102-HI", "TT-102", "Compressor temperature HIGH", compTemp, "high");
    if (s.fault !== "none")
      pushAlarm(
        `FAULT-${s.fault}`,
        s.fault.toUpperCase(),
        `Fault detected: ${s.fault}`,
        0,
        "critical",
      );
    // trim
    const trimmed = alarms.slice(0, 30);

    // trend
    const t = Date.now();
    const trend = [
      ...s.trend,
      { t, wellPressure, sepLevel, sepPressure, discharge, rpm, purity, flow: gasFlow },
    ].slice(-60);

    set({
      wellPressure,
      wellTemp,
      sepLevel,
      sepPressure,
      sepTemp,
      gasFlow,
      liqFlow,
      suction,
      discharge,
      rpm,
      compTemp,
      power,
      purity,
      pvOpen,
      integral,
      prevErr,
      alarms: trimmed,
      trend,
    });
  },
}));

// global tick — started lazily by useSimTicker() from a client effect
let __simTickHandle: ReturnType<typeof setInterval> | null = null;
export function startSimTicker() {
  if (typeof window === "undefined") return;
  if (__simTickHandle) return;
  __simTickHandle = setInterval(() => useSim.getState().tick(), 500);
}

export function levelOf(
  value: number,
  lo: number,
  hi: number,
  llo?: number,
  hhi?: number,
): AlarmLevel {
  if (hhi !== undefined && value >= hhi) return "critical";
  if (llo !== undefined && value <= llo) return "critical";
  if (value >= hi || value <= lo) return "high";
  return "normal";
}

export function mA(value: number, min: number, max: number) {
  return 4 + (16 * (value - min)) / (max - min);
}
