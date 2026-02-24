"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export type Photo = {
  id: string;
  fileName: string;
  caption: string | null;
  thumbnailPath: string | null;
  storagePath: string;
};

type Props = {
  sectionId: string;
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  label?: string;
};

export function PhotoUpload({ sectionId, photos, onPhotosChange, label }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sectionId", sectionId);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const photo = await res.json();
          onPhotosChange([...photos, photo]);
          toast.success(`${file.name} hochgeladen`);
        } else {
          toast.error(`Fehler beim Hochladen von ${file.name}`);
        }
      } catch {
        toast.error(`Fehler beim Hochladen von ${file.name}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(photoId: string) {
    try {
      const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
      if (res.ok) {
        onPhotosChange(photos.filter((p) => p.id !== photoId));
        toast.success("Foto gelöscht");
      }
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }

  async function handleCaptionChange(photoId: string, caption: string) {
    onPhotosChange(
      photos.map((p) => (p.id === photoId ? { ...p, caption } : p))
    );

    try {
      await fetch(`/api/photos/${photoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
    } catch {
      // Caption save failed silently
    }
  }

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group border rounded-lg overflow-hidden bg-muted"
            >
              <div className="aspect-[4/3] relative">
                <Image
                  src={`/api/photos/serve/${photo.id}?thumb=1`}
                  alt={photo.caption || photo.fileName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="p-1.5">
                <Input
                  value={photo.caption || ""}
                  onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                  placeholder="Beschriftung..."
                  className="h-7 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Camera className="h-4 w-4 mr-2" />
        )}
        {uploading ? "Hochladen..." : "Fotos hinzufügen"}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
