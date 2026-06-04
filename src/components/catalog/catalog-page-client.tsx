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
import { CatalogItemDialog } from "./catalog-item-dialog";
import { deleteCatalogItem } from "@/lib/actions/catalog";
import type { CatalogItemForClient } from "@/lib/actions/catalog";
import { CATALOG_ITEM_TYPES } from "@/lib/validations/catalog";

const TYPE_LABELS: Record<(typeof CATALOG_ITEM_TYPES)[number], string> = {
  WAERMEPUMPE: "Wärmepumpe",
  INNENGERAET: "Innengerät",
  HEIZUNGSSPEICHER: "Heizungsspeicher",
  WARMWASSERSPEICHER: "Warmwasserspeicher",
  ANDERE: "Andere",
};

export function CatalogPageClient({
  items,
}: {
  items: CatalogItemForClient[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItemForClient | null>(null);
  const [, startTransition] = useTransition();

  function handleNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function handleEdit(item: CatalogItemForClient) {
    setEditing(item);
    setDialogOpen(true);
  }

  function handleDelete(item: CatalogItemForClient) {
    if (!confirm(`Position "${item.name}" wirklich löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteCatalogItem(item.id);
        toast.success("Position gelöscht");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler beim Löschen");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Katalog</h1>
          <p className="text-sm text-muted-foreground">
            Positionen für Angebote — Wärmepumpen, Speicher und weitere Komponenten.
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Position
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Hersteller</TableHead>
              <TableHead className="text-right">Varianten</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Noch keine Positionen. Mit „Neue Position“ den Katalog befüllen.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.name}
                    {!item.active && (
                      <Badge variant="secondary" className="ml-2">
                        Inaktiv
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{TYPE_LABELS[item.type]}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.manufacturer ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">{item.variants.length}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(item)}
                      >
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

      <CatalogItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
      />
    </div>
  );
}
