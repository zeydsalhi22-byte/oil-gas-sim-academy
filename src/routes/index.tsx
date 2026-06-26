import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Flame, Droplet, Warehouse, Lock, ArrowRight, Gauge, Activity, Languages } from "lucide-react";
import { useI18n, useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OilSim Academy — Interactive Oil & Gas Training" },
      { name: "description", content: "Hands-on simulator for process control, PID tuning, sensors and SCADA for L3 Electronics/Instrumentation students." },
      { property: "og:title", content: "OilSim Academy" },
      { property: "og:description", content: "Interactive oil & gas industrial simulation for engineering students." },
    ],
  }),
  component: Home,
});

function Home() {
  const t = useT();
  const lang = useI18n((s) => s.lang);
  const toggleLang = useI18n((s) => s.toggle);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(255,107,0,0.15),transparent_60%)]" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary">
            <Flame className="h-5 w-5" />
          </div>
          <span className="font-mono text-sm tracking-widest text-muted-foreground">{t("brand")}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleLang} className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground hover:text-foreground" aria-label="Toggle language">
            <Languages className="h-3.5 w-3.5" />{lang === "en" ? "العربية" : "English"}
          </button>
          <a href="#sectors" className="text-sm text-muted-foreground hover:text-foreground">{t("sectors_anchor")}</a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-8 sm:pt-14">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--success)]" />
            {t("live_engine")}
          </div>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
            {t("hero_title_1")} <span className="text-primary">{t("hero_title_2")}</span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground sm:text-lg">{t("hero_desc")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/gas" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:brightness-110">
              {t("enter_gas")} <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" /> {t("real_pid")}</span>
              <span className="flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> {t("live_trends")}</span>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="sectors" className="mx-auto max-w-6xl px-4 pb-20 sm:px-8">
        <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-muted-foreground">{t("choose_sector")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <SectorCard to="/gas" title={t("gas_sector")} tag="GAS-01" icon={<Flame className="h-6 w-6" />} color="var(--primary)" description={t("gas_desc")} active activeLabel={t("active")} comingLabel={t("coming_soon")} />
          <SectorCard to="/oil" title={t("oil_sector")} tag="OIL-01" icon={<Droplet className="h-6 w-6" />} color="#0080ff" description={t("oil_desc")} active activeLabel={t("active")} comingLabel={t("coming_soon")} />
          <SectorCard title={t("storage_sector")} tag="STO-03" icon={<Warehouse className="h-6 w-6" />} color="#00ff88" description={t("storage_desc")} activeLabel={t("active")} comingLabel={t("coming_soon")} />
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center font-mono text-xs text-muted-foreground">
        {t("footer")}
      </footer>
    </div>
  );
}

function SectorCard({
  to, title, tag, icon, color, description, active, activeLabel = "ACTIVE", comingLabel = "COMING SOON",
}: { to?: string; title: string; tag: string; icon: React.ReactNode; color: string; description: string; active?: boolean; activeLabel?: string; comingLabel?: string }) {
  const inner = (
    <motion.div
      whileHover={active ? { y: -4 } : {}}
      className={`group relative overflow-hidden rounded-xl border border-border bg-card p-5 ${active ? "" : "opacity-70"}`}
      style={{ boxShadow: active ? `0 10px 40px -20px ${color}` : undefined }}
    >
      <div className="flex items-center justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-lg" style={{ background: `${color}22`, color }}>
          {icon}
        </div>
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground">{tag}</span>
      </div>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex items-center justify-between">
        {active ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-xs font-medium text-[var(--success)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--success)]" /> {activeLabel}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> {comingLabel}
          </span>
        )}
        {active && <ArrowRight className="h-4 w-4 text-primary transition group-hover:translate-x-1" />}
      </div>
      {!active && <div className="pointer-events-none absolute inset-0 backdrop-blur-[2px]" />}
    </motion.div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}
