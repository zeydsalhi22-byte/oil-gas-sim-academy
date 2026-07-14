import { create } from "zustand";

export type Lang = "en" | "ar";

type Dict = Record<string, { en: string; ar: string }>;

const dict: Dict = {
  brand: { en: "OILSIM // ACADEMY", ar: "أويل سيم // أكاديمية" },
  sectors_anchor: { en: "Sectors ↓", ar: "القطاعات ↓" },
  live_engine: {
    en: "Live process simulation engine running",
    ar: "محرّك محاكاة العملية يعمل مباشرة",
  },
  hero_title_1: { en: "OilSim", ar: "أويل سيم" },
  hero_title_2: { en: "Academy", ar: "أكاديمية" },
  hero_desc: {
    en: "An interactive industrial simulator for process control, PID systems, sensors and SCADA — built for L3 Electronics & Instrumentation students. Operate the plant, tune controllers, diagnose faults.",
    ar: "محاكي صناعي تفاعلي للتحكم بالعمليات وأنظمة PID والمستشعرات وأنظمة SCADA — مصمَّم لطلبة المستوى الثالث إلكترونيات وأجهزة قياس. شغّل المصنع، اضبط المتحكمات، شخّص الأعطال.",
  },
  enter_gas: { en: "Enter Gas Sector", ar: "ادخل قطاع الغاز" },
  real_pid: { en: "Real PID math", ar: "حسابات PID حقيقية" },
  live_trends: { en: "Live SCADA trends", ar: "منحنيات SCADA مباشرة" },
  choose_sector: { en: "Choose a sector", ar: "اختر قطاعًا" },
  gas_sector: { en: "Gas Sector", ar: "قطاع الغاز" },
  oil_sector: { en: "Oil Sector", ar: "قطاع النفط" },
  storage_sector: { en: "Storage Sector", ar: "قطاع التخزين" },
  gas_desc: {
    en: "Wellhead, separator, compressor, treatment, SCADA control room and 4 simulators.",
    ar: "رأس البئر، الفاصل، الضاغط، المعالجة، غرفة تحكم SCADA و4 محاكيات.",
  },
  oil_desc: {
    en: "Three-phase separation, crude processing, pumps and pipelines.",
    ar: "فصل ثلاثي الأطوار، معالجة الخام، المضخات والأنابيب.",
  },
  storage_desc: {
    en: "Tank farm, inventory control, tank gauging and loading systems.",
    ar: "حقل خزانات، التحكم بالمخزون، قياس الخزانات وأنظمة التحميل.",
  },
  active: { en: "ACTIVE", ar: "نشط" },
  coming_soon: { en: "COMING SOON", ar: "قريبًا" },
  footer: {
    en: "OILSIM ACADEMY · TRAINING SIMULATOR · v1.0",
    ar: "أويل سيم أكاديمية · محاكي تدريب · v1.0",
  },

  back_sectors: { en: "Sectors", ar: "القطاعات" },
  gas_subtitle: { en: "Gas Sector · GAS-01", ar: "قطاع الغاز · GAS-01" },
  plant_title: { en: "Onshore Gas Processing Plant", ar: "محطة معالجة غاز برية" },
  tab_plant: { en: "Plant", ar: "المصنع" },
  tab_control: { en: "Control Room", ar: "غرفة التحكم" },
  tab_control_short: { en: "Control", ar: "تحكم" },
  tab_sim: { en: "Simulators", ar: "المحاكيات" },
  tab_sim_short: { en: "Sim", ar: "محاكاة" },
  tab_quiz: { en: "Quiz", ar: "اختبار" },
  all_normal: { en: "ALL NORMAL", ar: "كل شيء طبيعي" },
  critical: { en: "CRITICAL", ar: "حرج" },
  active_count: { en: "active", ar: "نشط" },
  loading_plant: { en: "Loading plant…", ar: "جارٍ تحميل المصنع…" },

  sim_pid: { en: "PID Tuner", ar: "ضابط PID" },
  sim_startup: { en: "Startup Sequence", ar: "تسلسل التشغيل" },
  sim_fault: { en: "Fault Diagnosis", ar: "تشخيص الأعطال" },
  sim_flow: { en: "Flow & Pressure", ar: "التدفق والضغط" },

  fault_title: { en: "Fault Detection", ar: "كشف الأعطال" },
  fault_inject: { en: "Inject random fault", ar: "حقن عطل عشوائي" },
  fault_intro: {
    en: "Observe the SCADA trends and Plant view to identify the failed device.",
    ar: "راقب منحنيات SCADA وعرض المصنع لتحديد الجهاز المعطّل.",
  },
  fault_active: {
    en: "Fault is active. Look for the symptoms below, then submit your diagnosis.",
    ar: "العطل فعّال. راقب الأعراض أدناه ثم قدّم تشخيصك.",
  },
  symptoms: { en: "Symptoms to look for", ar: "الأعراض التي يجب ملاحظتها" },
  i_think: { en: "I think the fault is in:", ar: "أعتقد أن العطل في:" },
  pick_one: { en: "— select a device —", ar: "— اختر جهازًا —" },
  submit: { en: "Submit diagnosis", ar: "إرسال التشخيص" },
  correct: { en: "Correct!", ar: "إجابة صحيحة!" },
  wrong: { en: "Not quite.", ar: "غير صحيح." },
  explanation: { en: "Explanation", ar: "الشرح" },
};

interface I18nState {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

export const useI18n = create<I18nState>((set, get) => ({
  lang: "en",
  setLang: (lang) => {
    set({ lang });
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }
  },
  toggle: () => get().setLang(get().lang === "en" ? "ar" : "en"),
}));

export function useT() {
  const lang = useI18n((s) => s.lang);
  return (key: keyof typeof dict) => dict[key]?.[lang] ?? key;
}
