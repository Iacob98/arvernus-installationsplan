"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TextAreaField } from "../field-helpers";
import type { DeliveryNoteFile } from "@/lib/validations/sections";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
  sectionId: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DeliveryNoteForm({ data, onChange, sectionId }: Props) {
  const files = (data.files as DeliveryNoteFile[]) || [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  async function uploadOne(file: File): Promise<DeliveryNoteFile | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sectionId", sectionId);
    const res = await fetch("/api/delivery-notes", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      toast.error(`${file.name}: ${err.error || "Fehler"}`);
      return null;
    }
    return (await res.json()) as DeliveryNoteFile;
  }

  async function removeFromStorage(storagePath: string) {
    await fetch("/api/delivery-notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storagePath }),
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected?.length) return;
    if (!sectionId) {
      toast.error("Abschnitt noch nicht geladen");
      return;
    }
    setUploading(true);
    const next = [...files];
    for (const file of Array.from(selected)) {
      if (file.type !== "application/pdf") {
        toast.error(`${file.name}: nur PDF erlaubt`);
        continue;
      }
      const meta = await uploadOne(file);
      if (meta) {
        next.push(meta);
        toast.success(`${file.name} hochgeladen`);
      }
    }
    onChange({ ...data, files: next });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(fileId: string) {
    const target = files.find((f) => f.id === fileId);
    if (!target) return;
    await removeFromStorage(target.storagePath);
    onChange({ ...data, files: files.filter((f) => f.id !== fileId) });
    toast.success("Lieferschein gelöscht");
  }

  function triggerReplace(fileId: string) {
    setReplacingId(fileId);
    replaceInputRef.current?.click();
  }

  async function handleReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    const targetId = replacingId;
    setReplacingId(null);
    if (replaceInputRef.current) replaceInputRef.current.value = "";
    if (!selected || !targetId) return;

    if (selected.type !== "application/pdf") {
      toast.error("Nur PDF erlaubt");
      return;
    }

    const target = files.find((f) => f.id === targetId);
    if (!target) return;

    setUploading(true);
    const meta = await uploadOne(selected);
    if (meta) {
      await removeFromStorage(target.storagePath);
      onChange({
        ...data,
        files: files.map((f) => (f.id === targetId ? meta : f)),
      });
      toast.success("Lieferschein ersetzt");
    }
    setUploading(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Lieferscheine als PDF hochladen. Diese Dateien werden <strong>nicht</strong> in den finalen Installationsplan-PDF aufgenommen.
      </p>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
            >
              <FileText className="h-8 w-8 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(file.size)} ·{" "}
                  {new Date(file.uploadedAt).toLocaleString("de-DE")}
                </p>
              </div>
              <a
                href={`/api/delivery-notes/serve?path=${encodeURIComponent(file.storagePath)}`}
                target="_blank"
                rel="noopener"
              >
                <Button type="button" variant="ghost" size="sm" title="Anzeigen">
                  <Download className="h-4 w-4" />
                </Button>
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => triggerReplace(file.id)}
                disabled={uploading}
                title="Ersetzen"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(file.id)}
                disabled={uploading}
                title="Löschen"
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || !sectionId}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        {uploading ? "Hochladen..." : "PDF hinzufügen"}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleReplace}
      />

      <div className="border-t pt-4">
        <TextAreaField
          data={data}
          onChange={onChange}
          field="notes"
          label="Notizen"
          placeholder="Optionale Notizen zum Lieferschein..."
        />
      </div>
    </div>
  );
}
