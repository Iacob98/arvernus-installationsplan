"use client";

import { useState } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (verlustgrund: string | null) => Promise<void> | void;
}

export function VerlorenReasonDialog({ open, onOpenChange, onConfirm }: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) setReason("");
    onOpenChange(next);
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirm(reason.trim() || null);
      setReason("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kunde als verloren markieren?</DialogTitle>
          <DialogDescription>
            Erinnerungen werden gestoppt. Diese Aktion kann nur durch manuelle
            Statusänderung rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label
            htmlFor="verlustgrund"
            className="text-xs font-medium text-foreground/80"
          >
            Grund (optional)
          </label>
          <Textarea
            id="verlustgrund"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 500))}
            placeholder="z.B. Preis zu hoch, Konkurrent gewählt …"
            className="min-h-[90px] text-sm"
            disabled={submitting}
            autoFocus
          />
          <div className="text-right font-mono text-[10px] tabular-nums text-muted-foreground/60">
            {reason.length}/500
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={submitting}
          >
            <XCircle className="h-4 w-4 mr-1.5" />
            {submitting ? "Wird markiert…" : "Als verloren markieren"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
