"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteOfferTemplate,
  type OfferTemplateWithComponents,
} from "@/lib/actions/offer-templates";
import type { CatalogItemForClient } from "@/lib/actions/catalog";
import { TemplateDialog } from "./template-dialog";

export function TemplatesPageClient({
  templates,
  catalog,
}: {
  templates: OfferTemplateWithComponents[];
  catalog: CatalogItemForClient[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OfferTemplateWithComponents | null>(null);
  const [, startTransition] = useTransition();

  function handleNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function handleEdit(t: OfferTemplateWithComponents) {
    setEditing(t);
    setDialogOpen(true);
  }

  function handleDelete(t: OfferTemplateWithComponents) {
    if (!confirm(`Vorlage "${t.name}" wirklich löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteOfferTemplate(t.id);
        toast.success("Vorlage gelöscht");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler beim Löschen");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Angebot-Vorlagen</h1>
          <p className="text-sm text-muted-foreground">
            Vorgefertigte Schnellauswahl für den Angebot-Wizard. Komponenten
            werden anhand des Suchbegriffs im Katalog gesucht.
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Vorlage
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead className="text-right">Komponenten</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Noch keine Vorlagen.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    {t.name}
                    {!t.active && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        Inaktiv
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-md">
                    {t.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">{t.components.length}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(t)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editing}
        catalog={catalog}
      />
    </div>
  );
}
