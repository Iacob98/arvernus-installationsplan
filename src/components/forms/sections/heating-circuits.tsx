"use client";

import { useState, useEffect } from "react";
import { NumberField, TextAreaField } from "../field-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

type HeatingCircuit = {
  number: number;
  floor: string;
  room: string;
  radiatorType: string;
  model: string;
  power: string;
};

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function HeatingCircuitsForm({ data, onChange }: Props) {
  const circuits = (data.circuits as HeatingCircuit[]) || [];

  function updateCircuit(index: number, field: string, value: string) {
    const updated = [...circuits];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, circuits: updated });
  }

  function addCircuit() {
    const newCircuit: HeatingCircuit = {
      number: circuits.length + 1,
      floor: "",
      room: "",
      radiatorType: "",
      model: "",
      power: "",
    };
    onChange({ ...data, circuits: [...circuits, newCircuit] });
  }

  function removeCircuit(index: number) {
    const updated = circuits.filter((_, i) => i !== index);
    onChange({ ...data, circuits: updated });
  }

  return (
    <div className="space-y-4">
      <NumberField data={data} onChange={onChange} field="totalCircuits" label="Gesamtanzahl Heizkreise" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Heizkörper</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCircuit}>
            <Plus className="h-4 w-4 mr-1" />
            Heizkörper hinzufügen
          </Button>
        </div>

        {circuits.map((circuit, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Heizkörper #{circuit.number || index + 1}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeCircuit(index)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Etage</Label>
                <Input value={circuit.floor} onChange={(e) => updateCircuit(index, "floor", e.target.value)} placeholder="z.B. EG" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Raum</Label>
                <Input value={circuit.room} onChange={(e) => updateCircuit(index, "room", e.target.value)} placeholder="z.B. Wohnzimmer" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Typ</Label>
                <Input value={circuit.radiatorType} onChange={(e) => updateCircuit(index, "radiatorType", e.target.value)} placeholder="z.B. Flachheizkörper" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Modell</Label>
                <Input value={circuit.model} onChange={(e) => updateCircuit(index, "model", e.target.value)} placeholder="Hersteller/Modell" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Leistung (W)</Label>
                <Input value={circuit.power} onChange={(e) => updateCircuit(index, "power", e.target.value)} placeholder="z.B. 1200" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Informationen zu den Heizkreisen..." />
    </div>
  );
}
