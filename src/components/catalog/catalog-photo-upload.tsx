"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value: string | null;
  onChange: (storagePath: string | null) => void;
}

export function CatalogPhotoUpload({ value, onChange }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    fetch(`/api/catalog/photo-url?path=${encodeURIComponent(value)}`)
      .then((r) => r.json())
      .then((d) => {
        if (active && d.url) setPreviewUrl(d.url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [value]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/catalog/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload fehlgeschlagen");
      const data = (await res.json()) as { storagePath: string; url: string };
      onChange(data.storagePath);
      setPreviewUrl(data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-start gap-3">
      {previewUrl ? (
        <div className="relative h-24 w-24 overflow-hidden rounded-md border bg-muted">
          <Image
            src={previewUrl}
            alt="Variante"
            fill
            sizes="96px"
            className="object-contain"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          Kein Foto
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
          <Button type="button" size="sm" variant="outline" asChild>
            <span>
              <Upload className="mr-1 h-3 w-3" />
              {uploading ? "Lädt…" : value ? "Ersetzen" : "Hochladen"}
            </span>
          </Button>
        </label>
        {value && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              onChange(null);
              setPreviewUrl(null);
            }}
          >
            <Trash2 className="mr-1 h-3 w-3" /> Entfernen
          </Button>
        )}
      </div>
    </div>
  );
}
