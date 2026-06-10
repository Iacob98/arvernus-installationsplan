"use client";

import { useEffect, useTransition } from "react";
import { useForm, useFieldArray, useWatch, useController } from "react-hook-form";
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
  catalogItemSchema,
  CatalogItemFormData,
  CATALOG_ITEM_TYPES,
} from "@/lib/validations/catalog";
import { createCatalogItem, updateCatalogItem } from "@/lib/actions/catalog";
import type { CatalogItemForClient } from "@/lib/actions/catalog";
import { CatalogPhotoUpload } from "./catalog-photo-upload";

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
  item: CatalogItemForClient | null;
}

export function CatalogItemDialog({ open, onOpenChange, item }: Props) {
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CatalogItemFormData>({
    resolver: zodResolver(catalogItemSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "WAERMEPUMPE",
      manufacturer: "",
      active: true,
      order: 0,
      variants: [
        {
          name: "",
          description: "",
          price: 0,
          technicalData: [],
          nennleistungKw: null,
          active: true,
          order: 0,
        },
      ],
    },
  });

  const variants = useFieldArray({ control, name: "variants" });

  useEffect(() => {
    if (open) {
      if (item) {
        reset({
          name: item.name,
          description: item.description ?? "",
          type: item.type,
          manufacturer: item.manufacturer ?? "",
          active: item.active,
          order: item.order,
          variants: item.variants.map((v) => ({
            id: v.id,
            name: v.name,
            description: v.description ?? "",
            photoStoragePath: v.photoStoragePath ?? null,
            price: v.price,
            technicalData: Array.isArray(v.technicalData)
              ? (v.technicalData as { key: string; value: string }[])
              : [],
            nennleistungKw: v.nennleistungKw ?? null,
            active: v.active,
            order: v.order,
          })),
        });
      } else {
        reset({
          name: "",
          description: "",
          type: "WAERMEPUMPE",
          manufacturer: "",
          active: true,
          order: 0,
          variants: [
            {
              name: "",
              description: "",
              price: 0,
              technicalData: [],
              active: true,
              order: 0,
            },
          ],
        });
      }
    }
  }, [open, item, reset]);

  async function onSubmit(data: CatalogItemFormData) {
    startTransition(async () => {
      try {
        if (item) {
          await updateCatalogItem(item.id, data);
          toast.success("Position aktualisiert");
        } else {
          await createCatalogItem(data);
          toast.success("Position angelegt");
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
          <DialogTitle>{item ? "Position bearbeiten" : "Neue Position"}</DialogTitle>
        </DialogHeader>

        <form id="catalog-item-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Allgemein</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...register("name")} />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Typ</Label>
                  <TypeSelect control={control} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hersteller</Label>
                  <Input {...register("manufacturer")} placeholder="z. B. Bosch" />
                </div>
                <div className="space-y-2">
                  <Label>Sortierung</Label>
                  <Input type="number" {...register("order", { valueAsNumber: true })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Textarea rows={3} {...register("description")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Varianten</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  variants.append({
                    name: "",
                    description: "",
                    price: 0,
                    technicalData: [],
                    nennleistungKw: null,
                    active: true,
                    order: variants.fields.length,
                  })
                }
              >
                <Plus className="mr-1 h-3 w-3" /> Variante
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {variants.fields.map((field, idx) => (
                <VariantBlock
                  key={field.id}
                  idx={idx}
                  control={control}
                  register={register}
                  setValue={setValue}
                  onRemove={() => variants.remove(idx)}
                  canRemove={variants.fields.length > 1}
                />
              ))}
              {errors.variants && typeof errors.variants.message === "string" && (
                <p className="text-sm text-red-500">{errors.variants.message}</p>
              )}
            </CardContent>
          </Card>
        </form>

        <DialogFooter className="px-6 py-3 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Abbrechen
          </Button>
          <Button type="submit" form="catalog-item-form" disabled={pending}>
            {pending ? "Speichern…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TypeSelect({
  control,
}: {
  control: ReturnType<typeof useForm<CatalogItemFormData>>["control"];
}) {
  const { field } = useController({ control, name: "type" });
  return (
    <Select value={field.value} onValueChange={field.onChange}>
      <SelectTrigger>
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
  );
}

interface VariantProps {
  idx: number;
  control: ReturnType<typeof useForm<CatalogItemFormData>>["control"];
  register: ReturnType<typeof useForm<CatalogItemFormData>>["register"];
  setValue: ReturnType<typeof useForm<CatalogItemFormData>>["setValue"];
  onRemove: () => void;
  canRemove: boolean;
}

function VariantBlock({
  idx,
  control,
  register,
  setValue,
  onRemove,
  canRemove,
}: VariantProps) {
  const tech = useFieldArray({ control, name: `variants.${idx}.technicalData` });
  const photoPath = useWatch({ control, name: `variants.${idx}.photoStoragePath` });

  return (
    <div className="rounded-md border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Variante {idx + 1}</p>
        {canRemove && (
          <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_140px] gap-4">
        <div className="space-y-2">
          <Label>Bezeichnung</Label>
          <Input {...register(`variants.${idx}.name`)} placeholder="z. B. AW 12 OR-S" />
        </div>
        <div className="space-y-2">
          <Label>Preis (€)</Label>
          <Input
            type="number"
            step="0.01"
            {...register(`variants.${idx}.price`, { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label>Leistung (kW)</Label>
          <Input
            type="number"
            step="0.5"
            placeholder="—"
            {...register(`variants.${idx}.nennleistungKw`, {
              setValueAs: (v) =>
                v === "" || v === null || v === undefined ? null : Number(v),
            })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Beschreibung</Label>
        <Textarea rows={3} {...register(`variants.${idx}.description`)} />
      </div>

      <div className="space-y-2">
        <Label>Foto</Label>
        <CatalogPhotoUpload
          value={photoPath ?? null}
          onChange={(path) =>
            setValue(`variants.${idx}.photoStoragePath`, path, { shouldDirty: true })
          }
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Technische Daten</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => tech.append({ key: "", value: "" })}
          >
            <Plus className="mr-1 h-3 w-3" /> Zeile
          </Button>
        </div>
        {tech.fields.length === 0 && (
          <p className="text-xs text-muted-foreground">Keine technischen Daten.</p>
        )}
        {tech.fields.map((f, ti) => (
          <div key={f.id} className="flex gap-2">
            <Input
              placeholder="Schlüssel"
              {...register(`variants.${idx}.technicalData.${ti}.key`)}
            />
            <Input
              placeholder="Wert"
              {...register(`variants.${idx}.technicalData.${ti}.value`)}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => tech.remove(ti)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
