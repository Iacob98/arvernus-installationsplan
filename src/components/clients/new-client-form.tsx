"use client";

import { useRouter } from "next/navigation";
import { ClientFormData } from "@/lib/validations/client";
import { createClient } from "@/lib/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { toast } from "sonner";

interface NewClientFormProps {
  users?: { id: string; name: string }[];
  isAdmin?: boolean;
  defaultCustomerNumber: string;
}

export function NewClientForm({
  users,
  isAdmin,
  defaultCustomerNumber,
}: NewClientFormProps) {
  const router = useRouter();

  async function onSubmit(data: ClientFormData) {
    await createClient(data);
    toast.success("Kunde erstellt");
    router.push("/clients");
  }

  return (
    <ClientForm
      defaultValues={{
        customerNumber: defaultCustomerNumber,
        status: "NEU",
      }}
      onSubmit={onSubmit}
      submitLabel="Kunde erstellen"
      loadingLabel="Erstellen..."
      users={users}
      isAdmin={isAdmin}
    />
  );
}
