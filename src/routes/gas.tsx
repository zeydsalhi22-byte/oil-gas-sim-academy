import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Cpu,
  Gauge,
  Sliders,
  GraduationCap,
  AlertTriangle,
  Languages,
} from "lucide-react";
import { useSim, startSimTicker } from "@/lib/sim/store";
import { useI18n, useT } from "@/lib/i18n";
import { PlantView } from "@/components/plant/PlantView";
import { ControlRoom } from "@/components/plant/ControlRoom";
import { Simulators } from "@/components/plant/Simulators";
import { Quiz } from "@/components/plant/Quiz";

export const Route = createFileRoute("/gas")({
  head: () => ({
    meta: [
      { title: "Gas Sector — OilSim Academy" },
      {
        name: "description",
        content:
          "Operate a virtual gas processing plant — wellhead, separator, compressor, treatment, SCADA control and PID training.",
      },
      { property: "og:title", content: "Gas Sector — OilSim Academy" },
      {
        property: "og:description",
        content: "Interactive gas processing plant simulator with SCADA and PID training.",
      },
    ],
  }),
  component: GasPage,
});

type Tab = "plant" | "control" | "sim" | "quiz";

function GasPage() {
  const [tab, setTab] = useState<Tab>("plant");
  const [mounted, setMounted] = useState(false);
  const t = useT();
  useEffect(() => {
    setMounted(true);
    startSimTicker();
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background text-muted-foreground text-sm font-mono">
        {t("loading_plant")}
      </div>
    );
  }
  return <GasPageInner tab={tab} setTab={setTab} />;
}

function GasPageInner({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const allAlarms = useSim((s) => s.alarms);
  const alarms = allAlarms.filter((a) => !a.ack);
  const critical = alarms.find((a) => a.level === "critical");
  const t = useT();
  const lang = useI18n((s) => s.lang);
  const toggleLang = useI18n((s) => s.toggle);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <header className="z-20 shrink-0 border-b border-border bg-background/95 backdrop-blur">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-2 sm:px-5">
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">{t("back_sectors")}</span>
          </Link>
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {t("gas_subtitle")}
            </div>
            <div className="truncate text-sm font-semibold">{t("plant_title")}</div>
          </div>
          <button
            onClick={toggleLang}
            className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground"
            aria-label="Toggle language"
          >
            <Languages className="h-3 w-3" />
            {lang === "en" ? "AR" : "EN"}
          </button>
          <AlarmBanner critical={critical} count={alarms.length} />
        </div>
        <nav className="hidden border-t border-border sm:flex">
          {(
            [
              ["plant", t("tab_plant"), Gauge],
              ["control", t("tab_control"), Cpu],
              ["sim", t("tab_sim"), Sliders],
              ["quiz", t("tab_quiz"), GraduationCap],
            ] as const
          ).map(([k, l, Icon]) => (
            <button
              key={k}
              onClick={() => setTab(k as Tab)}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition ${
                tab === k
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {l}
            </button>
          ))}
        </nav>
      </header>

      <main
        className={`min-h-0 flex-1 ${tab === "plant" ? "flex flex-col overflow-hidden p-0" : "overflow-auto px-3 py-3 sm:px-5 sm:py-5"}`}
      >
        {tab === "plant" && (
          <div className="min-h-0 flex-1">
            <PlantView />
          </div>
        )}
        {tab === "control" && <ControlRoom />}
        {tab === "sim" && <Simulators />}
        {tab === "quiz" && <Quiz />}
      </main>

      <nav className="z-20 grid shrink-0 grid-cols-4 border-t border-border bg-background/95 backdrop-blur sm:hidden">
        {(
          [
            ["plant", t("tab_plant"), Gauge],
            ["control", t("tab_control_short"), Cpu],
            ["sim", t("tab_sim_short"), Sliders],
            ["quiz", t("tab_quiz"), GraduationCap],
          ] as const
        ).map(([k, l, Icon]) => (
          <button
            key={k}
            onClick={() => setTab(k as Tab)}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${tab === k ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon className="h-5 w-5" /> {l}
          </button>
        ))}
      </nav>
    </div>
  );
}

function AlarmBanner({ critical, count }: { critical: any; count: number }) {
  const t = useT();
  if (count === 0)
    return (
      <span className="hidden rounded-full bg-[var(--success)]/15 px-2 py-1 font-mono text-[10px] text-[var(--success)] sm:inline-flex">
        {t("all_normal")}
      </span>
    );
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[10px] ${critical ? "animate-alarm bg-[var(--danger)]/20 text-[var(--danger)]" : "bg-[var(--warning)]/20 text-[var(--warning)]"}`}
    >
      <AlertTriangle className="h-3 w-3" />
      {count} {critical ? t("critical") : t("active_count")}
    </span>
  );
}
