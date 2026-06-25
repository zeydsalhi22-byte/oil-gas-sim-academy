import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Cpu, Gauge, Sliders, GraduationCap, AlertTriangle } from "lucide-react";
import { useSim, startSimTicker } from "@/lib/sim/store";
import { PlantView } from "@/components/plant/PlantView";
import { ControlRoom } from "@/components/plant/ControlRoom";
import { Simulators } from "@/components/plant/Simulators";
import { Quiz } from "@/components/plant/Quiz";

export const Route = createFileRoute("/gas")({
  head: () => ({
    meta: [
      { title: "Gas Sector — OilSim Academy" },
      { name: "description", content: "Operate a virtual gas processing plant — wellhead, separator, compressor, treatment, SCADA control and PID training." },
      { property: "og:title", content: "Gas Sector — OilSim Academy" },
      { property: "og:description", content: "Interactive gas processing plant simulator with SCADA and PID training." },
    ],
  }),
  component: GasPage,
});

type Tab = "plant" | "control" | "sim" | "quiz";

function GasPage() {
  const [tab, setTab] = useState<Tab>("plant");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); startSimTicker(); }, []);

  if (!mounted) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground text-sm font-mono">Loading plant…</div>;
  }
  return <GasPageInner tab={tab} setTab={setTab} />;
}

function GasPageInner({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const allAlarms = useSim((s) => s.alarms);
  const alarms = allAlarms.filter((a) => !a.ack);
  const critical = alarms.find((a) => a.level === "critical");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 sm:px-5">
          <Link to="/" className="inline-flex items-center gap-1 rounded p-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline text-sm">Sectors</span>
          </Link>
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Gas Sector · GAS-01</div>
            <div className="truncate text-sm font-semibold">Onshore Gas Processing Plant</div>
          </div>
          <AlarmBanner critical={critical} count={alarms.length} />
        </div>
        {/* Tabs desktop */}
        <nav className="hidden border-t border-border sm:flex">
          {([
            ["plant", "Plant", Gauge],
            ["control", "Control Room", Cpu],
            ["sim", "Simulators", Sliders],
            ["quiz", "Quiz", GraduationCap],
          ] as const).map(([k, l, Icon]) => (
            <button
              key={k}
              onClick={() => setTab(k as Tab)}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition ${
                tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {l}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className={`flex-1 ${tab === "plant" ? "flex min-h-0 flex-col p-0 pb-14 sm:pb-0" : "px-3 pb-20 pt-3 sm:px-5 sm:pb-5"}`}>
        {tab === "plant" && (
          <div className="flex-1 min-h-0">
            <PlantView />
          </div>
        )}
        {tab === "control" && <ControlRoom />}
        {tab === "sim" && <Simulators />}
        {tab === "quiz" && <Quiz />}
      </main>

      {/* Mobile bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur sm:hidden">
        {([
          ["plant", "Plant", Gauge],
          ["control", "Control", Cpu],
          ["sim", "Sim", Sliders],
          ["quiz", "Quiz", GraduationCap],
        ] as const).map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k as Tab)} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${tab === k ? "text-primary" : "text-muted-foreground"}`}>
            <Icon className="h-5 w-5" /> {l}
          </button>
        ))}
      </nav>
    </div>
  );
}

function AlarmBanner({ critical, count }: { critical: any; count: number }) {
  if (count === 0)
    return <span className="hidden rounded-full bg-[var(--success)]/15 px-2 py-1 font-mono text-[10px] text-[var(--success)] sm:inline-flex">ALL NORMAL</span>;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[10px] ${critical ? "animate-alarm bg-[var(--danger)]/20 text-[var(--danger)]" : "bg-[var(--warning)]/20 text-[var(--warning)]"}`}>
      <AlertTriangle className="h-3 w-3" />
      {count} {critical ? "CRITICAL" : "active"}
    </span>
  );
}
