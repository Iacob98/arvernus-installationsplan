"use client";

import { ClientStatus } from "@prisma/client";
import { Check } from "lucide-react";

const STAGES: { value: ClientStatus; label: string }[] = [
  { value: "NEU", label: "Neu" },
  { value: "IN_BEARBEITUNG", label: "In Bearbeitung" },
  { value: "ANGERUFEN", label: "Angerufen" },
  { value: "ANGEBOT_VERSENDET", label: "Angebot" },
  { value: "VERKAUFT", label: "Verkauft" },
];

export function ClientPipeline({ status }: { status: ClientStatus }) {
  const isLost = status === "NICHT_VERKAUFT";
  const activeIdx = STAGES.findIndex((s) => s.value === status);

  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        Pipeline
      </div>
      <div className="relative">
        <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-0.5 bg-border" />
        <div className="relative flex justify-between items-center">
          {STAGES.map((s, i) => {
            const reached = !isLost && activeIdx >= i && activeIdx !== -1;
            const isActive = !isLost && activeIdx === i;
            return (
              <div key={s.value} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-all ${
                    reached
                      ? "text-[var(--brand-foreground)] shadow-sm"
                      : "bg-muted text-muted-foreground"
                  } ${isActive ? "ring-2 ring-offset-2 ring-offset-card" : ""}`}
                  style={
                    reached
                      ? {
                          background: "var(--brand)",
                          ...(isActive ? { boxShadow: "0 0 0 4px var(--brand-muted)" } : {}),
                        }
                      : undefined
                  }
                >
                  {reached && activeIdx > i ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-[10px] text-center leading-tight ${
                    isActive ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {isLost && (
        <div className="mt-2 inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          ✗ Nicht verkauft
        </div>
      )}
    </div>
  );
}
