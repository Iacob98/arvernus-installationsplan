"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientNote } from "@/lib/actions/clients";
import { toast } from "sonner";

interface ClientNote {
  id: string;
  content: string;
  createdAt: Date;
  author: { name: string };
}

interface ClientNotesSectionProps {
  clientId: string;
  notes: ClientNote[];
}

export function ClientNotesSection({ clientId, notes }: ClientNotesSectionProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        await createClientNote(clientId, content);
        setContent("");
        router.refresh();
      } catch {
        toast.error("Fehler beim Speichern der Notiz");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Verlauf ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add note form */}
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Notiz hinzufügen..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isPending || !content.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Notes list */}
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Notizen</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border bg-muted/50 p-3 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{note.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(note.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
