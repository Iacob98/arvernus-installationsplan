"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, PhoneOff, Voicemail, PhoneCall, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  CALL_OUTCOME_LABELS,
  type CreateCallLogData,
} from "@/lib/validations/call-log";
import { createCallLog, deleteCallLog } from "@/lib/actions/call-logs";

type Outcome = keyof typeof CALL_OUTCOME_LABELS;

const OUTCOME_ICONS: Record<Outcome, typeof Phone> = {
  REACHED: PhoneCall,
  NOT_REACHED: PhoneOff,
  VOICEMAIL: Voicemail,
  BUSY: PhoneOff,
};

const OUTCOME_VARIANTS: Record<Outcome, "default" | "secondary" | "outline" | "destructive"> = {
  REACHED: "default",
  NOT_REACHED: "destructive",
  VOICEMAIL: "secondary",
  BUSY: "outline",
};

interface CallLogRow {
  id: string;
  calledAt: Date;
  outcome: Outcome;
  notes: string | null;
  nextCallAt: Date | null;
  user: { name: string };
}

interface Props {
  clientId: string;
  callLogs: CallLogRow[];
}

function nowLocalInputValue(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function tomorrowLocalInputValue(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CallLogSection({ clientId, callLogs }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Anrufe ({callLogs.length})</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-3 w-3" /> Anruf protokollieren
          </Button>
        </CardHeader>
        <CardContent>
          {callLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Anrufe.</p>
          ) : (
            <div className="space-y-2">
              {callLogs.map((c) => (
                <CallRow key={c.id} log={c} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <CallLogDialog
        open={open}
        onOpenChange={setOpen}
        clientId={clientId}
      />
    </>
  );
}

function CallRow({ log }: { log: CallLogRow }) {
  const [pending, startTransition] = useTransition();
  const Icon = OUTCOME_ICONS[log.outcome];

  function handleDelete() {
    if (!confirm("Anruf löschen?")) return;
    startTransition(async () => {
      try {
        await deleteCallLog(log.id);
        toast.success("Anruf gelöscht");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  return (
    <div className="rounded-md border p-3 flex gap-3 items-start">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={OUTCOME_VARIANTS[log.outcome]}>
            {CALL_OUTCOME_LABELS[log.outcome]}
          </Badge>
          <span className="text-muted-foreground">
            {new Intl.DateTimeFormat("de-DE", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(log.calledAt)}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{log.user.name}</span>
          {log.nextCallAt && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm">
                Rückruf:{" "}
                <strong>
                  {new Intl.DateTimeFormat("de-DE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(log.nextCallAt)}
                </strong>
              </span>
            </>
          )}
        </div>
        {log.notes && (
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
            {log.notes}
          </p>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleDelete}
        disabled={pending}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

function CallLogDialog({
  open,
  onOpenChange,
  clientId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <CallLogDialogContent
          clientId={clientId}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Dialog>
  );
}

function CallLogDialogContent({
  clientId,
  onClose,
}: {
  clientId: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [calledAt, setCalledAt] = useState(nowLocalInputValue());
  const [outcome, setOutcome] = useState<Outcome>("REACHED");
  const [notes, setNotes] = useState("");
  const [nextCallAt, setNextCallAt] = useState(tomorrowLocalInputValue());

  function submit() {
    if (outcome !== "REACHED" && !nextCallAt) {
      toast.error("Rückruf-Termin angeben");
      return;
    }
    const payload: CreateCallLogData = {
      calledAt: new Date(calledAt),
      outcome,
      notes: notes.trim() || null,
      nextCallAt: outcome !== "REACHED" ? new Date(nextCallAt) : null,
    };
    startTransition(async () => {
      try {
        await createCallLog(clientId, payload);
        toast.success("Anruf protokolliert");
        onClose();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Anruf protokollieren</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Anrufzeitpunkt</Label>
          <Input
            type="datetime-local"
            value={calledAt}
            onChange={(e) => setCalledAt(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ergebnis</Label>
          <Select value={outcome} onValueChange={(v) => setOutcome(v as Outcome)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CALL_OUTCOME_LABELS) as Outcome[]).map((o) => (
                <SelectItem key={o} value={o}>
                  {CALL_OUTCOME_LABELS[o]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {outcome !== "REACHED" && (
          <div className="space-y-1">
            <Label className="text-xs">Rückruf am</Label>
            <Input
              type="datetime-local"
              value={nextCallAt}
              onChange={(e) => setNextCallAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Wird automatisch als Erinnerung angelegt.
            </p>
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">Notizen</Label>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="z. B. „Interesse vorhanden, wartet auf Konfiguration“"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          Abbrechen
        </Button>
        <Button onClick={submit} disabled={pending}>
          {pending ? "Speichern…" : "Speichern"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
