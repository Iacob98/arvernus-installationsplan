"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendEmailToClient } from "@/lib/actions/emails";
import { toast } from "sonner";

interface EmailComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientEmail: string | null;
  clientName: string;
  initialSubject?: string;
  initialBody?: string;
}

export function EmailComposeDialog({
  open,
  onOpenChange,
  clientId,
  clientEmail,
  clientName,
  initialSubject,
  initialBody,
}: EmailComposeDialogProps) {
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [body, setBody] = useState(initialBody ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    // Seed compose state from the parent on each open. The state change is
    // intentional here — it lets a "Reply" button preload Re: + body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubject(initialSubject ?? "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBody(initialBody ?? "");
  }, [open, initialSubject, initialBody]);

  function handleSend() {
    if (!subject || !body) return;

    startTransition(async () => {
      try {
        await sendEmailToClient(clientId, { subject, body });
        toast.success("E-Mail wird gesendet");
        setSubject("");
        setBody("");
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Fehler beim Senden"
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>E-Mail an {clientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            An: {clientEmail ?? "—"}
          </div>
          <div className="space-y-1.5">
            <Label>Betreff</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Betreff..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nachricht</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Nachricht..."
              rows={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSend}
            disabled={isPending || !subject || !body || !clientEmail}
          >
            {isPending ? "Wird gesendet..." : "Senden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
