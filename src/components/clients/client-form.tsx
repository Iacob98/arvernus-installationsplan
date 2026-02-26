"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, ClientFormData } from "@/lib/validations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface ClientFormProps {
  defaultValues?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => Promise<void>;
  submitLabel: string;
  loadingLabel: string;
  users?: { id: string; name: string }[];
  isAdmin?: boolean;
}

export function ClientForm({ defaultValues, onSubmit, submitLabel, loadingLabel, users, isAdmin }: ClientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      customerNumber: "",
      status: "NEU",
      ...defaultValues,
    },
  });

  const status = watch("status");

  async function handleFormSubmit(data: ClientFormData) {
    setLoading(true);
    try {
      await onSubmit(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kontaktdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Kundennummer</Label>
            <Input {...register("customerNumber")} />
            {errors.customerNumber && (
              <p className="text-sm text-red-500">{errors.customerNumber.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Anrede</Label>
            <Select
              defaultValue={defaultValues?.salutation || undefined}
              onValueChange={(v) => setValue("salutation", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Anrede wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Herr">Herr</SelectItem>
                <SelectItem value="Frau">Frau</SelectItem>
                <SelectItem value="Firma">Firma</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vorname</Label>
              <Input {...register("firstName")} />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nachname</Label>
              <Input {...register("lastName")} />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input type="email" {...register("email")} />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input {...register("phone")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adresse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Straße</Label>
              <Input {...register("street")} />
              {errors.street && (
                <p className="text-sm text-red-500">{errors.street.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Hausnr.</Label>
              <Input {...register("houseNumber")} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>PLZ</Label>
              <Input {...register("postalCode")} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Stadt</Label>
              <Input {...register("city")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status & Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                defaultValue={defaultValues?.status || "NEU"}
                onValueChange={(v) => {
                  setValue("status", v as ClientFormData["status"]);
                  if (v !== "IN_BEARBEITUNG") {
                    setValue("substatus", null);
                    setValue("dealProbability", null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEU">Neu</SelectItem>
                  <SelectItem value="IN_BEARBEITUNG">In Bearbeitung</SelectItem>
                  <SelectItem value="VERKAUFT">Verkauft</SelectItem>
                  <SelectItem value="NICHT_VERKAUFT">Nicht verkauft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {status === "IN_BEARBEITUNG" && (
              <div className="space-y-2">
                <Label>Unterstatus</Label>
                <Select
                  defaultValue={defaultValues?.substatus || "IN_KONTAKT"}
                  onValueChange={(v) =>
                    setValue("substatus", v as ClientFormData["substatus"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_KONTAKT">In Kontakt</SelectItem>
                    <SelectItem value="ANGEBOT_VERSENDET">Angebot versendet</SelectItem>
                    <SelectItem value="NICHT_ERREICHBAR">Nicht erreichbar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {status === "IN_BEARBEITUNG" && (
            <div className="space-y-2">
              <Label>Wahrscheinlichkeit</Label>
              <RadioGroup
                defaultValue={defaultValues?.dealProbability || undefined}
                className="flex gap-4"
                onValueChange={(v) =>
                  setValue("dealProbability", v as ClientFormData["dealProbability"])
                }
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="NIEDRIG" id="prob-low" />
                  <Label htmlFor="prob-low" className="text-sm text-red-500 cursor-pointer">
                    Niedrig
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="MITTEL" id="prob-mid" />
                  <Label htmlFor="prob-mid" className="text-sm text-yellow-500 cursor-pointer">
                    Mittel
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="HOCH" id="prob-high" />
                  <Label htmlFor="prob-high" className="text-sm text-green-500 cursor-pointer">
                    Hoch
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
          {isAdmin && users && users.length > 0 && (
            <div className="space-y-2">
              <Label>Zugewiesen an</Label>
              <Select
                defaultValue={defaultValues?.assignedToId || "none"}
                onValueChange={(v) => setValue("assignedToId", v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nicht zugewiesen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nicht zugewiesen</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea {...register("notes")} rows={3} placeholder="Optionale Notizen..." />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? loadingLabel : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
