import { useState } from "react";
import { storageQuiz } from "@/lib/sim/storageQuiz";
import { Check, X, RotateCcw } from "lucide-react";

export function StorageQuiz() {
  const bank = storageQuiz;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = bank[i];

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.answer) setScore(score + 1);
  };
  const next = () => {
    if (i + 1 >= bank.length) setDone(true);
    else { setI(i + 1); setPicked(null); }
  };
  const reset = () => { setI(0); setPicked(null); setScore(0); setDone(false); };

  if (done) {
    const pct = Math.round((score / bank.length) * 100);
    const rating = pct >= 90 ? "Excellent" : pct >= 70 ? "Good" : pct >= 50 ? "Pass" : "Needs review";
    return (
      <div className="mx-auto max-w-md rounded-md border border-border bg-card p-6 text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Storage Quiz complete</div>
        <div className="mt-3 scada-value text-5xl" style={{ color: "#00aa44" }}>{pct}%</div>
        <div className="mt-1 text-sm text-muted-foreground">{score} / {bank.length} correct · {rating}</div>
        <button onClick={reset} className="mt-5 inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold text-white" style={{ background: "#00aa44" }}>
          <RotateCcw className="h-3 w-3" /> Restart
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
        <span>Question {i + 1} / {bank.length}</span>
        <span>Score {score}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded bg-muted">
        <div className="h-full transition-all" style={{ width: `${((i + 1) / bank.length) * 100}%`, background: "#00aa44" }} />
      </div>
      <div className="rounded-md border border-border bg-card p-5">
        <h3 className="text-base font-semibold">{q.q}</h3>
        <div className="mt-4 space-y-2">
          {q.options.map((o, idx) => {
            const correct = idx === q.answer;
            const isPicked = picked === idx;
            const cls = picked === null
              ? "border-border hover:border-[#00aa44]"
              : correct
              ? "border-[var(--success)]/60 bg-[var(--success)]/10 text-[var(--success)]"
              : isPicked
              ? "border-[var(--danger)]/60 bg-[var(--danger)]/10 text-[var(--danger)]"
              : "border-border opacity-60";
            return (
              <button key={idx} onClick={() => choose(idx)} className={`flex w-full items-center justify-between rounded border p-3 text-left text-sm ${cls}`}>
                <span>{o}</span>
                {picked !== null && correct && <Check className="h-4 w-4" />}
                {picked !== null && isPicked && !correct && <X className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="mt-4 rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
            <span style={{ color: "#00aa44" }}>Explanation: </span>{q.explain}
          </div>
        )}
        {picked !== null && (
          <button onClick={next} className="mt-3 w-full rounded py-2 text-sm font-semibold text-white hover:brightness-110" style={{ background: "#00aa44" }}>
            {i + 1 === bank.length ? "Finish" : "Next →"}
          </button>
        )}
      </div>
    </div>
  );
}
