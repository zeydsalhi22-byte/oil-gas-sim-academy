export interface Question {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export const gasQuiz: Question[] = [
  {
    q: "What does PT stand for in instrumentation?",
    options: ["Pressure Transmitter", "Power Transformer", "Process Tank", "Pipe Tester"],
    answer: 0,
    explain: "PT = Pressure Transmitter, an industry-standard tag.",
  },
  {
    q: "Standard analog output range of a 2-wire transmitter?",
    options: ["0-5 V", "0-10 V", "4-20 mA", "0-100 mA"],
    answer: 2,
    explain: "4-20 mA allows live-zero fault detection.",
  },
  {
    q: "If proportional gain Kp is too high, the loop will…",
    options: ["Be sluggish", "Oscillate or become unstable", "Have zero error", "Never respond"],
    answer: 1,
    explain: "Excessive Kp drives the loop into oscillation.",
  },
  {
    q: "Integral action eliminates…",
    options: ["Overshoot", "Steady-state offset", "Noise", "Derivative kick"],
    answer: 1,
    explain: "I-action integrates error until offset is zero.",
  },
  {
    q: "On a HIGH-HIGH pressure alarm, the operator should…",
    options: [
      "Ignore it",
      "Acknowledge and reduce load / trip equipment",
      "Increase setpoint",
      "Disable the alarm",
    ],
    answer: 1,
    explain: "HH alarms require immediate corrective action.",
  },
  {
    q: "A separator vessel separates…",
    options: ["Gas from liquid", "Oil from water only", "Sand from gas", "CO2 from H2O"],
    answer: 0,
    explain: "First-stage separator splits the gas and liquid phases.",
  },
  {
    q: "A compressor's discharge pressure depends on…",
    options: [
      "Suction P × compression ratio",
      "RPM only",
      "Temperature only",
      "Power supply voltage",
    ],
    answer: 0,
    explain: "Pd ≈ Ps × ratio for ideal compression.",
  },
  {
    q: "Flow through a control valve is approximately…",
    options: ["Cv × ΔP", "Cv × √ΔP", "Cv / ΔP", "Cv²"],
    answer: 1,
    explain: "Q = Cv·√(ΔP/SG) for liquids.",
  },
  {
    q: "Derivative action mainly improves…",
    options: [
      "Speed of response",
      "Steady-state error",
      "Stability under fast changes",
      "Noise rejection",
    ],
    answer: 2,
    explain: "D-action damps fast disturbances but amplifies noise.",
  },
  {
    q: "What is the typical signal at 50% of a 4-20 mA scale?",
    options: ["8 mA", "10 mA", "12 mA", "14 mA"],
    answer: 2,
    explain: "Mid-scale = 4 + 0.5·16 = 12 mA.",
  },
  {
    q: "An LT measures…",
    options: ["Temperature", "Load", "Level", "Liquid Type"],
    answer: 2,
    explain: "LT = Level Transmitter.",
  },
  {
    q: "Anti-surge control protects which equipment?",
    options: ["Separator", "Compressor", "Heat exchanger", "Pump"],
    answer: 1,
    explain: "Surge is a destructive compressor instability.",
  },
  {
    q: "Which loop is typically fastest?",
    options: ["Level", "Temperature", "Flow", "Composition"],
    answer: 2,
    explain: "Flow loops have very small time constants.",
  },
  {
    q: "True/False: PID auto mode means the operator manually moves the valve.",
    options: ["True", "False"],
    answer: 1,
    explain: "Auto = controller computes output; Manual = operator.",
  },
  {
    q: "An ESD (Emergency Shutdown) is triggered by…",
    options: [
      "Routine alarms",
      "Critical safety conditions",
      "Operator coffee break",
      "Low purity",
    ],
    answer: 1,
    explain: "ESDs handle critical, safety-related events.",
  },
];
