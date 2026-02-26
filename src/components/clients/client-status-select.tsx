"use client";

import { ClientStatus, ClientSubstatus } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const STATUS_LABELS: Record<ClientStatus, string> = {
  NEU: "Neu",
  IN_BEARBEITUNG: "In Bearbeitung",
  VERKAUFT: "Verkauft",
  NICHT_VERKAUFT: "Nicht verkauft",
};

const SUBSTATUS_LABELS: Record<ClientSubstatus, string> = {
  IN_KONTAKT: "In Kontakt",
  ANGEBOT_VERSENDET: "Angebot versendet",
  NICHT_ERREICHBAR: "Nicht erreichbar",
};

interface ClientStatusSelectProps {
  status: ClientStatus;
  substatus: ClientSubstatus | null;
  onStatusChange: (status: ClientStatus) => void;
  onSubstatusChange: (substatus: ClientSubstatus | null) => void;
}

export function ClientStatusSelect({
  status,
  substatus,
  onStatusChange,
  onSubstatusChange,
}: ClientStatusSelectProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select value={status} onValueChange={(v) => onStatusChange(v as ClientStatus)}>
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

      {status === "IN_BEARBEITUNG" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Unterstatus</Label>
          <Select
            value={substatus || ""}
            onValueChange={(v) => onSubstatusChange(v ? (v as ClientSubstatus) : null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unterstatus wählen" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SUBSTATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export { STATUS_LABELS, SUBSTATUS_LABELS };
