"use client";

import { useEffect, useTransition } from "react";
import { useForm, useFieldArray, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogFooter as DialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  offerTemplateSchema,
  type OfferTemplateFormData,
} from "@/lib/validations/offer-template";
import {
  createOfferTemplate,
  updateOfferTemplate,
  type OfferTemplateWithComponents,
} from "@/lib/actions/offer-templates";
import { CATALOG_ITEM_TYPES } from "@/lib/validations/catalog";
import type { CatalogItemForClient } from "@/lib/actions/catalog";

const TYPE_LABELS: Record<(typeof CATALOG_ITEM_TYPES)[number], string> = {
  WAERMEPUMPE: "Wärmepumpe",
  INNENGERAET: "Innengerät",
  HEIZUNGSSPEICHER: "Heizungsspeicher",
  WARMWASSERSPEICHER: "Warmwasserspeicher",
  DIENSTLEISTUNG: "Dienstleistung",
  ANDERE: "Andere",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: OfferTemplateWithComponents | null;
  catalog: CatalogItemForClient[];
}

export function TemplateDialog({ open, onOpenChange, template, catalog }: Props) {
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<OfferTemplateFormData>({
    resolver: zodResolver(offerTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      active: true,
      order: 0,
      nennleistungKw: null,
      warmwasserSpeicherLiter: null,
      heizkreiseAnzahl: null,
      mitSolar: false,
      components: [
        {
          type: "WAERMEPUMPE",
          keyword: "",
          quantity: 1,
          label: "WP Außen",
          order: 0,
          catalogItemId: null,
          catalogItemVariantId: null,
        },
      ],
    },
  });

  const components = useFieldArray({ control, name: "components" });

  useEffect(() => {
    if (!open) return;
    if (template) {
      reset({
        name: template.name,
        description: template.description ?? "",
        active: template.active,
        order: template.order,
        nennleistungKw: template.nennleistungKw ?? null,
        warmwasserSpeicherLiter: template.warmwasserSpeicherLiter ?? null,
        heizkreiseAnzahl: template.heizkreiseAnzahl ?? null,
        mitSolar: template.mitSolar ?? false,
        components: template.components.map((c) => ({
          id: c.id,
          type: c.type,
          keyword: c.keyword,
          quantity: c.quantity,
          label: c.label,
          order: c.order,
          catalogItemId: c.catalogItemId,
          catalogItemVariantId: c.catalogItemVariantId,
        })),
      });
    } else {
      reset({
        name: "",
        description: "",
        active: true,
        order: 0,
        nennleistungKw: null,
        warmwasserSpeicherLiter: null,
        heizkreiseAnzahl: null,
        mitSolar: false,
        components: [
          {
            type: "WAERMEPUMPE",
            keyword: "",
            quantity: 1,
            label: "WP Außen",
            order: 0,
            catalogItemId: null,
            catalogItemVariantId: null,
          },
        ],
      });
    }
  }, [open, template, reset]);

  function onSubmit(data: OfferTemplateFormData) {
    startTransition(async () => {
      try {
        if (template) {
          await updateOfferTemplate(template.id, data);
          toast.success("Vorlage aktualisiert");
        } else {
          await createOfferTemplate(data);
          toast.success("Vorlage erstellt");
        }
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler beim Speichern");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        desktopMaxWidthClass="sm:!max-w-[min(1100px,96vw)] sm:w-[96vw] sm:h-[92vh]"
        className="flex flex-col p-0 sm:p-0 gap-0"
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>{template ? "Vorlage bearbeiten" : "Neue Vorlage"}</DialogTitle>
        </DialogHeader>

        <form
          id="template-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Allgemein</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...register("name")} placeholder="z. B. EFH 120–160 m²" />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Sortierung</Label>
                  <Input
                    type="number"
                    {...register("order", { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Textarea
                  rows={2}
                  {...register("description")}
                  placeholder="Wird auf der Schnellauswahl-Karte angezeigt"
                />
              </div>

              <div className="border-t pt-3 mt-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                  Matching-Spec (für Auto-Auswahl im Wizard)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Leistung (kW)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="—"
                      {...register("nennleistungKw", {
                        setValueAs: (v) =>
                          v === "" || v === null || v === undefined
                            ? null
                            : Number(v),
                      })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Warmwasser (L)</Label>
                    <Input
                      type="number"
                      step="50"
                      placeholder="— / 200 / 300"
                      {...register("warmwasserSpeicherLiter", {
                        setValueAs: (v) =>
                          v === "" || v === null || v === undefined
                            ? null
                            : Number(v),
                      })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Heizkreise</Label>
                    <Input
                      type="number"
                      step="1"
                      placeholder="1 / 2"
                      {...register("heizkreiseAnzahl", {
                        setValueAs: (v) =>
                          v === "" || v === null || v === undefined
                            ? null
                            : Number(v),
                      })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Mit Solar</Label>
                    <label className="flex items-center gap-2 h-9 px-3 border border-input rounded-md bg-background cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("mitSolar")}
                        className="h-4 w-4"
                      />
                      <span className="text-xs">Solarthermie</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Komponenten</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  components.append({
                    type: "ANDERE",
                    keyword: "",
                    quantity: 1,
                    label: "",
                    order: components.fields.length,
                    catalogItemId: null,
                    catalogItemVariantId: null,
                  })
                }
              >
                <Plus className="mr-1 h-3 w-3" /> Zeile
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Verknüpfe jede Komponente direkt mit einem Katalog-Artikel. Wenn
                kein Artikel gewählt ist, wird der Suchbegriff im Variantennamen
                gesucht (case-insensitive).
              </p>
              {components.fields.map((f, idx) => (
                <ComponentRow
                  key={f.id}
                  idx={idx}
                  control={control}
                  register={register}
                  setValue={(name, value) => {
                    // local helper passthrough
                    // not used here directly
                    void name;
                    void value;
                  }}
                  catalog={catalog}
                  onRemove={() => components.remove(idx)}
                  canRemove={components.fields.length > 1}
                />
              ))}
              {errors.components &&
                typeof errors.components.message === "string" && (
                  <p className="text-sm text-red-500">
                    {errors.components.message}
                  </p>
                )}
            </CardContent>
          </Card>
        </form>

        <DialogFooter className="px-6 py-3 border-t shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Abbrechen
          </Button>
          <Button type="submit" form="template-form" disabled={pending}>
            {pending ? "Speichern…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ComponentRow({
  idx,
  control,
  register,
  catalog,
  onRemove,
  canRemove,
}: {
  idx: number;
  control: ReturnType<typeof useForm<OfferTemplateFormData>>["control"];
  register: ReturnType<typeof useForm<OfferTemplateFormData>>["register"];
  setValue: (name: string, value: unknown) => void;
  catalog: CatalogItemForClient[];
  onRemove: () => void;
  canRemove: boolean;
}) {
  const typeField = useController({ control, name: `components.${idx}.type` });
  const itemField = useController({
    control,
    name: `components.${idx}.catalogItemId`,
  });
  const variantField = useController({
    control,
    name: `components.${idx}.catalogItemVariantId`,
  });

  const itemsOfType = catalog.filter((c) => c.type === typeField.field.value);
  const selectedItem = catalog.find((c) => c.id === itemField.field.value);
  const variants = selectedItem?.variants ?? [];

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr_1fr] gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Typ</Label>
          <Select
            value={typeField.field.value}
            onValueChange={(v) => {
              typeField.field.onChange(v);
              itemField.field.onChange(null);
              variantField.field.onChange(null);
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATALOG_ITEM_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Katalog-Position</Label>
          <Select
            value={itemField.field.value ?? "__none"}
            onValueChange={(v) => {
              itemField.field.onChange(v === "__none" ? null : v);
              variantField.field.onChange(null);
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder={
                itemsOfType.length === 0 ? "Kein Katalog-Artikel dieses Typs" : "Wählen…"
              } />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— (nur Suchbegriff)</SelectItem>
              {itemsOfType.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Variante</Label>
          <Select
            value={variantField.field.value ?? "__any"}
            onValueChange={(v) =>
              variantField.field.onChange(v === "__any" ? null : v)
            }
            disabled={!selectedItem}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Erster aktiver Variant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any">Erster aktiver Variant</SelectItem>
              {variants.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px_1fr_40px] gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-[10px]">Suchbegriff (Fallback)</Label>
          <Input
            className="h-8"
            {...register(`components.${idx}.keyword`)}
            placeholder='z. B. "12" oder "200 Liter"'
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Menge</Label>
          <Input
            className="h-8"
            type="number"
            min={1}
            {...register(`components.${idx}.quantity`, { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Bezeichnung (für Toast/UI)</Label>
          <Input
            className="h-8"
            {...register(`components.${idx}.label`)}
            placeholder="z. B. Außeneinheit 12 kW"
          />
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onRemove}
          disabled={!canRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
