"use client";

import { useState, useTransition } from "react";
import { ClientStatus } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { sendBulkEmail } from "@/lib/actions/emails";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  ALL: "Alle Kunden",
  IN_BEARBEITUNG: "In Bearbeitung",
  VERKAUFT: "Verkauft",
  NICHT_VERKAUFT: "Nicht verkauft",
};

export function BulkEmailDialog() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    if (!subject || !body) return;

    startTransition(async () => {
      try {
        const filter = statusFilter === "ALL" ? undefined : (statusFilter as ClientStatus);
        await sendBulkEmail({ subject, body }, filter);
        toast.success("Massen-E-Mail wird gesendet");
        setSubject("");
        setBody("");
        setStatusFilter("ALL");
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Fehler beim Senden"
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Send className="h-4 w-4 mr-2" />
          Massen-E-Mail
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Massen-E-Mail senden</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Empfänger filtern</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
