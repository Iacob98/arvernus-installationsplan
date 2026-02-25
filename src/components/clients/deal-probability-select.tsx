"use client";

import { DealProbability } from "@prisma/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const PROBABILITY_LABELS: Record<DealProbability, { label: string; color: string }> = {
  NIEDRIG: { label: "Niedrig", color: "text-red-500" },
  MITTEL: { label: "Mittel", color: "text-yellow-500" },
  HOCH: { label: "Hoch", color: "text-green-500" },
};

interface DealProbabilitySelectProps {
  value: DealProbability | null;
  onChange: (value: DealProbability | null) => void;
}

export function DealProbabilitySelect({
  value,
  onChange,
}: DealProbabilitySelectProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Wahrscheinlichkeit</Label>
      <RadioGroup
        value={value || ""}
        onValueChange={(v) => onChange(v as DealProbability)}
        className="flex gap-4"
      >
        {Object.entries(PROBABILITY_LABELS).map(([val, { label, color }]) => (
          <div key={val} className="flex items-center gap-1.5">
            <RadioGroupItem value={val} id={`prob-${val}`} />
            <Label htmlFor={`prob-${val}`} className={`text-sm cursor-pointer ${color}`}>
              {label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
