"use client";

import { useRouter } from "next/navigation";
import { ClientFormData } from "@/lib/validations/client";
import { createClient } from "@/lib/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { toast } from "sonner";

export default function NewClientPage() {
  const router = useRouter();

  async function onSubmit(data: ClientFormData) {
    await createClient(data);
    toast.success("Kunde erstellt");
    router.push("/clients");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Neuer Kunde</h1>
      <ClientForm
        defaultValues={{
          customerNumber: `KD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
          status: "IN_BEARBEITUNG",
          substatus: "IN_KONTAKT",
        }}
        onSubmit={onSubmit}
        submitLabel="Kunde erstellen"
        loadingLabel="Erstellen..."
      />
    </div>
  );
}
