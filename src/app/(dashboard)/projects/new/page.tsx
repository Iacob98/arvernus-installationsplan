"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, ProjectFormData } from "@/lib/validations/project";
import { createProject } from "@/lib/actions/projects";
import { getClients } from "@/lib/actions/clients";
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
import { toast } from "sonner";

type ClientOption = {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
};

export default function NewProjectPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectNumber: `PRJ-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    },
  });

  useEffect(() => {
    getClients().then((data) => setClients(data as ClientOption[]));
  }, []);

  const selectedClientId = watch("clientId");

  function onClientChange(clientId: string) {
    setValue("clientId", clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setValue("street", client.street);
      setValue("houseNumber", client.houseNumber);
      setValue("postalCode", client.postalCode);
      setValue("city", client.city);
    }
  }

  async function onSubmit(data: ProjectFormData) {
    setLoading(true);
    try {
      const project = await createProject(data);
      toast.success("Projekt erstellt");
      router.push(`/projects/${project.id}`);
    } catch (error) {
      toast.error("Fehler beim Erstellen des Projekts");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-0">
      <h1 className="text-2xl font-bold">Neues Projekt</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Projektdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Projektnummer</Label>
                <Input {...register("projectNumber")} />
                {errors.projectNumber && (
                  <p className="text-sm text-red-500">
                    {errors.projectNumber.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Titel</Label>
                <Input
                  {...register("title")}
                  placeholder="z.B. Wärmepumpe Installation"
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kunde</Label>
              <Select onValueChange={onClientChange} value={selectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kunde auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firstName} {client.lastName} ({client.customerNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-sm text-red-500">{errors.clientId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Installationsdatum</Label>
              <Input type="date" {...register("installationDate")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installationsadresse</CardTitle>
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
                {errors.houseNumber && (
                  <p className="text-sm text-red-500">
                    {errors.houseNumber.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>PLZ</Label>
                <Input {...register("postalCode")} />
                {errors.postalCode && (
                  <p className="text-sm text-red-500">
                    {errors.postalCode.message}
                  </p>
                )}
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Stadt</Label>
                <Input {...register("city")} />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anmerkungen</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea {...register("notes")} rows={3} placeholder="Optionale Notizen..." />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Erstellen..." : "Projekt erstellen"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Abbrechen
          </Button>
        </div>
      </form>
    </div>
  );
}
