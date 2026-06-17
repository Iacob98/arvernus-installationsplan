"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { DownloadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  triggerObiImport,
  getObiImportStatus,
  type ObiImportStatus,
} from "@/lib/actions/obi";

export function ObiImportButton() {
  const [status, setStatus] = useState<ObiImportStatus | null>(null);
  const [pending, start] = useTransition();

  const refresh = useCallback(() => {
    getObiImportStatus().then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // poll while a run is active
  useEffect(() => {
    if (!status?.running) return;
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, [status?.running, refresh]);

  const onClick = () =>
    start(async () => {
      try {
        await triggerObiImport();
        toast.success("OBI-Import gestartet — läuft im Hintergrund");
        setTimeout(refresh, 1500);
      } catch (e) {
        toast.error("Import fehlgeschlagen: " + (e as Error).message);
      }
    });

  const last = status?.last;
  const title = last
    ? `Letzter Import: +${last.created} neu, ${last.skippedDuplicates} übersprungen` +
      (last.errors ? `, ${last.errors} Fehler` : "") +
      (last.truncated ? " (Teilimport — Rest folgt)" : "")
    : "Leads aus OBI Partnercenter importieren";

  const running = pending || status?.running;

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 sm:h-8 text-xs shrink-0"
      onClick={onClick}
      disabled={running}
      title={title}
    >
      {running ? (
        <Loader2 className="h-3.5 w-3.5 sm:mr-1 animate-spin" />
      ) : (
        <DownloadCloud className="h-3.5 w-3.5 sm:mr-1" />
      )}
      <span className="hidden sm:inline">
        OBI{last ? ` (+${last.created})` : ""}
      </span>
    </Button>
  );
}
