"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FieldProps = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
};

export function TextField({
  data,
  onChange,
  field,
  label,
  placeholder,
  type = "text",
}: FieldProps & {
  field: string;
  label: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={(data[field] as string) || ""}
        onChange={(e) => onChange({ ...data, [field]: e.target.value })}
        placeholder={placeholder}
      />
    </div>
  );
}

export function TextAreaField({
  data,
  onChange,
  field,
  label,
  placeholder,
  rows = 3,
}: FieldProps & {
  field: string;
  label: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={(data[field] as string) || ""}
        onChange={(e) => onChange({ ...data, [field]: e.target.value })}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}

export function CheckboxField({
  data,
  onChange,
  field,
  label,
}: FieldProps & { field: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={(data[field] as boolean) || false}
        onCheckedChange={(checked) =>
          onChange({ ...data, [field]: checked === true })
        }
      />
      <Label className="cursor-pointer">{label}</Label>
    </div>
  );
}

export function SelectField({
  data,
  onChange,
  field,
  label,
  options,
  placeholder,
}: FieldProps & {
  field: string;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={(data[field] as string) || ""}
        onValueChange={(value) => onChange({ ...data, [field]: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder || "Auswählen..."} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function NumberField({
  data,
  onChange,
  field,
  label,
  placeholder,
  min,
  max,
}: FieldProps & {
  field: string;
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={(data[field] as number) ?? ""}
        onChange={(e) =>
          onChange({
            ...data,
            [field]: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        placeholder={placeholder}
        min={min}
        max={max}
      />
    </div>
  );
}
