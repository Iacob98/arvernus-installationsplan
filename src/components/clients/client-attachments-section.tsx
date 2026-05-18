"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Download,
  Eye,
  FileIcon,
  FileText,
  ImageIcon,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface ClientAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: Date | string;
  uploadedBy: { name: string };
}

interface Props {
  clientId: string;
  attachments: ClientAttachment[];
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function isImage(mime: string) {
  return mime.startsWith("image/");
}

function isPdf(mime: string) {
  return mime === "application/pdf";
}

function iconFor(mime: string) {
  if (isImage(mime)) return ImageIcon;
  if (isPdf(mime)) return FileText;
  return FileIcon;
}

export function ClientAttachmentsSection({ clientId, attachments: initial }: Props) {
  const router = useRouter();
  const [attachments, setAttachments] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [preview, setPreview] = useState<ClientAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const uploaded: ClientAttachment[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`/api/clients/${clientId}/attachments`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          uploaded.push(await res.json());
          toast.success(`${file.name} hochgeladen`);
        } else {
          toast.error(`Fehler beim Hochladen von ${file.name}`);
        }
      } catch {
        toast.error(`Fehler beim Hochladen von ${file.name}`);
      }
    }

    setAttachments((prev) => [...uploaded, ...prev]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  function handleDelete(id: string) {
    if (!confirm("Datei wirklich löschen?")) return;
    startDelete(async () => {
      try {
        const res = await fetch(
          `/api/clients/${clientId}/attachments/${id}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setAttachments((prev) => prev.filter((a) => a.id !== id));
          toast.success("Datei gelöscht");
        } else {
          toast.error("Fehler beim Löschen");
        }
      } catch {
        toast.error("Fehler beim Löschen");
      }
    });
  }

  const canPreview = (a: ClientAttachment) => isImage(a.mimeType) || isPdf(a.mimeType);
  const serveUrl = (id: string, download = false) =>
    `/api/clients/${clientId}/attachments/${id}/serve${download ? "?download=1" : ""}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Dateien ({attachments.length})
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploading ? "Hochladen..." : "Datei hinzufügen"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Dateien</p>
        ) : (
          <div className="space-y-2">
            {attachments.map((a) => {
              const Icon = iconFor(a.mimeType);
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
                >
                  {isImage(a.mimeType) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={serveUrl(a.id)}
                      alt={a.fileName}
                      className="h-12 w-12 rounded object-cover bg-muted shrink-0 cursor-pointer"
                      onClick={() => setPreview(a)}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center shrink-0">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(a.size)} · {a.uploadedBy.name} ·{" "}
                      {format(new Date(a.createdAt), "dd.MM.yyyy HH:mm", {
                        locale: de,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canPreview(a) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreview(a)}
                        title="Vorschau"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <a
                      href={serveUrl(a.id, true)}
                      download={a.fileName}
                    >
                      <Button size="sm" variant="ghost" title="Herunterladen" asChild>
                        <span>
                          <Download className="h-4 w-4" />
                        </span>
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(a.id)}
                      disabled={deleting}
                      title="Löschen"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-4">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{preview?.fileName}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="flex-1 min-h-0 overflow-auto bg-muted rounded">
              {isImage(preview.mimeType) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={serveUrl(preview.id)}
                  alt={preview.fileName}
                  className="w-full h-full object-contain"
                />
              ) : isPdf(preview.mimeType) ? (
                <iframe
                  src={serveUrl(preview.id)}
                  className="w-full h-full"
                  title={preview.fileName}
                />
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
