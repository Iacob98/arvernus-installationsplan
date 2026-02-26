"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KeyRound, Copy, AlertTriangle } from "lucide-react";
import { resetUserPin } from "@/lib/actions/users";
import { toast } from "sonner";

interface ResetPinDialogProps {
  userId: string;
  userName: string;
}

export function ResetPinDialog({ userId, userName }: ResetPinDialogProps) {
  const [open, setOpen] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReset() {
    startTransition(async () => {
      try {
        const result = await resetUserPin(userId);
        setGeneratedPin(result.pin);
      } catch {
        toast.error("Fehler beim Zurücksetzen des PINs");
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setGeneratedPin(null);
  }

  function copyPin() {
    if (generatedPin) {
      navigator.clipboard.writeText(generatedPin);
      toast.success("PIN kopiert");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <KeyRound className="h-4 w-4 mr-1" />
          PIN
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {generatedPin ? "Neuer PIN" : "PIN zurücksetzen"}
          </DialogTitle>
          {!generatedPin && (
            <DialogDescription>
              Möchten Sie den PIN für {userName} zurücksetzen?
              Der aktuelle PIN wird ungültig.
            </DialogDescription>
          )}
        </DialogHeader>

        {generatedPin ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-md text-yellow-800 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Der PIN wird nur einmal angezeigt. Bitte notieren Sie ihn jetzt.</span>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Neuer PIN für {userName}</p>
              <p className="text-3xl font-mono font-bold tracking-widest">{generatedPin}</p>
              <Button variant="outline" size="sm" onClick={copyPin}>
                <Copy className="h-4 w-4 mr-2" />
                PIN kopieren
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Schließen</Button>
            </DialogFooter>
          </div>
        ) : (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button onClick={handleReset} disabled={isPending}>
              {isPending ? "Zurücksetzen..." : "PIN zurücksetzen"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
