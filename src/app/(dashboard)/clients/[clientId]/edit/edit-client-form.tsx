"use client";

import { useRouter } from "next/navigation";
import { ClientFormData } from "@/lib/validations/client";
import { updateClient, type ClientDetail } from "@/lib/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { toast } from "sonner";

interface EditClientFormProps {
  client: ClientDetail;
  users?: { id: string; name: string }[];
  isAdmin?: boolean;
}

export function EditClientForm({ client, users, isAdmin }: EditClientFormProps) {
  const router = useRouter();

  async function onSubmit(data: ClientFormData) {
    await updateClient(client.id, data);
    toast.success("Kunde aktualisiert");
    router.push(`/clients/${client.id}`);
  }

  return (
    <ClientForm
      defaultValues={{
        customerNumber: client.customerNumber,
        salutation: client.salutation || undefined,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email || "",
        phone: client.phone || "",
        street: client.street,
        houseNumber: client.houseNumber,
        postalCode: client.postalCode,
        city: client.city,
        notes: client.notes || "",
        status: client.status,
        substatus: client.substatus,
        dealProbability: client.dealProbability,
        source: client.source,
        assignedToId: client.assignedToId,
      }}
      onSubmit={onSubmit}
      submitLabel="Speichern"
      loadingLabel="Speichern..."
      users={users}
      isAdmin={isAdmin}
    />
  );
}
