"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function GeneratePdfButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (res.ok) {
        toast.success("PDF erfolgreich generiert");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler bei der PDF-Generierung");
      }
    } catch {
      toast.error("Fehler bei der PDF-Generierung");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handleGenerate} disabled={loading} className="mt-2">
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      PDF generieren
    </Button>
  );
}
