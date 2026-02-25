"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail } from "lucide-react";
import { sendEmailToClient } from "@/lib/actions/emails";
import { toast } from "sonner";

interface EmailComposeDialogProps {
  clientId: string;
  clientEmail: string | null;
  clientName: string;
}

export function EmailComposeDialog({
  clientId,
  clientEmail,
  clientName,
}: EmailComposeDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    if (!subject || !body) return;

    startTransition(async () => {
      try {
        await sendEmailToClient(clientId, { subject, body });
        toast.success("E-Mail wird gesendet");
        setSubject("");
        setBody("");
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Fehler beim Senden"
        );
      }
    });
  }

  if (!clientEmail) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="h-4 w-4 mr-2" />
          E-Mail senden
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>E-Mail an {clientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">An: {clientEmail}</div>
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSend} disabled={isPending || !subject || !body}>
            {isPending ? "Wird gesendet..." : "Senden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
