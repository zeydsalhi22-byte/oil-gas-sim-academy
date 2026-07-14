import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Cpu, Gauge, Sliders, GraduationCap, AlertTriangle, Languages } from "lucide-react";
import { useStorageSim, startStorageTicker } from "@/lib/sim/storageStore";
import { useI18n, useT } from "@/lib/i18n";
import { StoragePlantView } from "@/components/storage/StoragePlantView";
import { StorageControlRoom } from "@/components/storage/StorageControlRoom";
import { StorageSimulators } from "@/components/storage/StorageSimulators";
import { StorageQuiz } from "@/components/storage/StorageQuiz";

const STG = "#00aa44";

export const Route = createFileRoute("/storage")({
  head: () => ({
    meta: [
      { title: "Storage Sector — OilSim Academy" },
      { name: "description", content: "Gas & oil storage terminal simulator — floating-roof tanks, gas spheres, transfer pumps, fiscal metering and SCADA training." },
      { property: "og:title", content: "Storage Sector — OilSim Academy" },
      { property: "og:description", content: "Interactive tank farm simulator with PID level control, startup sequence, fault diagnosis and inventory management." },
    ],
  }),
  component: StoragePage,
});

type Tab = "plant" | "control" | "sim" | "quiz";

function StoragePage() {
  const [tab, setTab] = useState<Tab>("plant");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); startStorageTicker(); }, []);
  if (!mounted) return <div className="flex h-[100dvh] items-center justify-center bg-background font-mono text-sm text-muted-foreground">Loading terminal…</div>;
  return <StoragePageInner tab={tab} setTab={setTab} />;
}

function StoragePageInner({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const allAlarms = useStorageSim((s) => s.alarms);
  const alarms = allAlarms.filter((a) => !a.ack);
  const critical = alarms.find((a) => a.level === "critical");
  const t = useT();
  const lang = useI18n((s) => s.lang);
  const toggleLang = useI18n((s) => s.toggle);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <header className="z-20 shrink-0 border-b border-border bg-background/95 backdrop-blur">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-2 sm:px-5">
          <Link to="/" className="inline-flex items-center gap-1 rounded p-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline text-sm">{t("back_sectors")}</span>
          </Link>
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "قطاع التخزين · STG-01" : "Storage Sector · STG-01"}</div>
            <div className="truncate text-sm font-semibold" style={{ color: STG }}>
              {lang === "ar" ? "محطة تخزين الغاز والنفط" : "Gas & Oil Storage Terminal"}
            </div>
          </div>
          <button onClick={toggleLang} className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground">
            <Languages className="h-3 w-3" />{lang === "en" ? "AR" : "EN"}
          </button>
          {alarms.length === 0 ? (
            <span className="hidden rounded-full bg-[var(--success)]/15 px-2 py-1 font-mono text-[10px] text-[var(--success)] sm:inline-flex">{t("all_normal")}</span>
          ) : (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[10px] ${critical ? "animate-alarm bg-[var(--danger)]/20 text-[var(--danger)]" : "bg-[var(--warning)]/20 text-[var(--warning)]"}`}>
              <AlertTriangle className="h-3 w-3" />{alarms.length} {critical ? t("critical") : t("active_count")}
            </span>
          )}
        </div>
        <nav className="hidden border-t border-border sm:flex">
          {([
            ["plant", t("tab_plant"), Gauge],
            ["control", t("tab_control"), Cpu],
            ["sim", t("tab_sim"), Sliders],
            ["quiz", t("tab_quiz"), GraduationCap],
          ] as const).map(([k, l, Icon]) => (
            <button key={k} onClick={() => setTab(k as Tab)}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition`}
              style={tab === k ? { borderColor: STG, color: STG } : { borderColor: "transparent", color: undefined }}>
              <Icon className="h-4 w-4" /> {l}
            </button>
          ))}
        </nav>
      </header>

      <main className={`min-h-0 flex-1 ${tab === "plant" ? "flex flex-col overflow-hidden p-0" : "overflow-auto px-3 py-3 sm:px-5 sm:py-5"}`}>
        {tab === "plant" && <div className="min-h-0 flex-1"><StoragePlantView /></div>}
        {tab === "control" && <StorageControlRoom />}
        {tab === "sim" && <StorageSimulators />}
        {tab === "quiz" && <StorageQuiz />}
      </main>

      <nav className="z-20 grid shrink-0 grid-cols-4 border-t border-border bg-background/95 backdrop-blur sm:hidden">
        {([
          ["plant", t("tab_plant"), Gauge],
          ["control", t("tab_control_short"), Cpu],
          ["sim", t("tab_sim_short"), Sliders],
          ["quiz", t("tab_quiz"), GraduationCap],
        ] as const).map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k as Tab)} className="flex flex-col items-center gap-0.5 py-2 text-[10px]"
            style={{ color: tab === k ? STG : undefined }}>
            <Icon className="h-5 w-5" /> {l}
          </button>
        ))}
      </nav>
    </div>
  );
}
