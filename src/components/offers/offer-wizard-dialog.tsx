"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createOfferSchema, CreateOfferData } from "@/lib/validations/offer";
import { createOffer } from "@/lib/actions/offers";
import type { CatalogItemForClient } from "@/lib/actions/catalog";
import { calcTotals, fmtEUR } from "@/lib/offer-totals";
import { CATALOG_ITEM_TYPES } from "@/lib/validations/catalog";
import {
  DEFAULT_HEAT_BALANCE,
  calcHeatBalance,
  extractKwhFromText,
  MONTHS_DE,
  type HeatBalance,
} from "@/lib/heat-balance";
import { DEFAULT_SERVICE_ITEMS } from "@/lib/offer-service-items";

const TYPE_LABELS: Record<(typeof CATALOG_ITEM_TYPES)[number], string> = {
  WAERMEPUMPE: "Wärmepumpe",
  INNENGERAET: "Innengerät",
  HEIZUNGSSPEICHER: "Heizungsspeicher",
  WARMWASSERSPEICHER: "Warmwasserspeicher",
  ANDERE: "Andere",
};

const STEPS = [
  "Anfragedaten",
  "Positionen",
  "Rabatte / Förderung",
  "Wärmehaushalt",
  "Abschluss",
];

interface ClientInquiry {
  wohnflaecheM2: string | null;
  annualKwhGas: string | null;
  wohneinheiten: string | null;
  heizsystem: string | null;
  hotWaterIncluded: string | null;
  currentHeating: string | null;
  heatingAge: string | null;
  incomeRange: string | null;
  additionalInfo: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  inquiry: ClientInquiry;
  catalog: CatalogItemForClient[];
}

export function OfferWizardDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  inquiry,
  catalog,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <OfferWizardContent
          clientId={clientId}
          clientName={clientName}
          inquiry={inquiry}
          catalog={catalog}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Dialog>
  );
}

interface ContentProps {
  clientId: string;
  clientName: string;
  inquiry: ClientInquiry;
  catalog: CatalogItemForClient[];
  onClose: () => void;
}

function OfferWizardContent({
  clientId,
  clientName,
  inquiry,
  catalog,
  onClose,
}: ContentProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateOfferData>({
    resolver: zodResolver(createOfferSchema),
    defaultValues: {
      title: "Ihr Individuelles Angebot",
      validUntilDays: 28,
      inquiry: {
        wohnflaecheM2: inquiry.wohnflaecheM2 ?? "",
        annualKwhGas: inquiry.annualKwhGas ?? "",
        wohneinheiten: inquiry.wohneinheiten ?? "",
        heizsystem: inquiry.heizsystem ?? "",
        hotWaterIncluded: inquiry.hotWaterIncluded ?? "",
        currentHeating: inquiry.currentHeating ?? "",
        heatingAge: inquiry.heatingAge ?? "",
        incomeRange: inquiry.incomeRange ?? "",
        additionalInfo: inquiry.additionalInfo ?? "",
      },
      positions: [],
      discounts: [],
      heatBalance: {
        ...DEFAULT_HEAT_BALANCE,
        annualConsumptionKwh:
          extractKwhFromText(inquiry.annualKwhGas) ||
          DEFAULT_HEAT_BALANCE.annualConsumptionKwh,
      },
      serviceItems: [...DEFAULT_SERVICE_ITEMS],
    },
  });

  const positions = useFieldArray({ control, name: "positions" });
  const discounts = useFieldArray({ control, name: "discounts" });
  const watchedPositionsRaw = useWatch({ control, name: "positions" });
  const watchedDiscountsRaw = useWatch({ control, name: "discounts" });
  const watchedPositions = useMemo(
    () => watchedPositionsRaw ?? [],
    [watchedPositionsRaw],
  );
  const watchedDiscounts = useMemo(
    () => watchedDiscountsRaw ?? [],
    [watchedDiscountsRaw],
  );

  const totals = useMemo(
    () =>
      calcTotals({
        positions: watchedPositions.map((p) => ({
          unitPrice: Number(p.unitPrice) || 0,
          quantity: Number(p.quantity) || 0,
        })),
        discounts: watchedDiscounts.map((d) => ({
          kind: d.kind,
          value: Number(d.value) || 0,
          label: d.label,
        })),
      }),
    [watchedPositions, watchedDiscounts],
  );

  async function onSubmit(data: CreateOfferData) {
    startTransition(async () => {
      try {
        const offer = await createOffer(clientId, data);
        toast.success(`Angebot ${offer.offerNumber} erstellt`);
        onClose();
        router.push(`/clients/${clientId}/offers/${offer.id}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler beim Erstellen");
      }
    });
  }

  function nextStep() {
    if (step === 1 && watchedPositions.length === 0) {
      toast.error("Mindestens eine Position erforderlich");
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  return (
    <>
      <DialogContent className="!max-w-[min(1200px,96vw)] w-[96vw] h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>Neues Angebot — {clientName}</DialogTitle>
          <div className="pt-3">
            <Stepper step={step} />
          </div>
        </DialogHeader>

        <div
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              (e.target as HTMLElement).tagName === "INPUT"
            ) {
              e.preventDefault();
            }
          }}
        >
          {step === 0 && <InquiryStep register={register} errors={errors} />}
          {step === 1 && (
            <PositionsStep
              catalog={catalog}
              fields={positions.fields}
              append={positions.append}
              remove={positions.remove}
              register={register}
              setValue={setValue}
              positions={watchedPositions}
            />
          )}
          {step === 2 && (
            <DiscountsStep
              fields={discounts.fields}
              append={discounts.append}
              remove={discounts.remove}
              register={register}
              setValue={setValue}
              totals={totals}
            />
          )}
          {step === 3 && (
            <HeatBalanceStep
              register={register}
              setValue={setValue}
              control={control}
            />
          )}
          {step === 4 && (
            <FinalStep
              register={register}
              errors={errors}
              totals={totals}
              positionCount={watchedPositions.length}
              clientName={clientName}
              control={control}
              setValue={setValue}
            />
          )}
        </div>

        <DialogFooter className="flex justify-between px-6 py-3 border-t shrink-0">
          <div>
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={pending}>
                Zurück
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={pending}>
              Abbrechen
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Weiter
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={pending}
              >
                {pending ? "Wird erstellt…" : "Angebot erstellen"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {STEPS.map((label, idx) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
              idx === step
                ? "bg-primary text-primary-foreground"
                : idx < step
                  ? "bg-primary/30 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {idx + 1}
          </div>
          <span className={idx === step ? "font-medium" : "text-muted-foreground"}>{label}</span>
          {idx < STEPS.length - 1 && <span className="text-muted-foreground">›</span>}
        </div>
      ))}
    </div>
  );
}

interface RHF {
  register: ReturnType<typeof useForm<CreateOfferData>>["register"];
  errors: ReturnType<typeof useForm<CreateOfferData>>["formState"]["errors"];
}

const INQUIRY_FIELDS: { key: keyof CreateOfferData["inquiry"]; label: string; placeholder?: string }[] = [
  {
    key: "wohnflaecheM2",
    label: "Beheizte Wohnfläche (m²)",
    placeholder: "z. B. 150",
  },
  {
    key: "annualKwhGas",
    label: "Jahresverbrauch (kWh / Öl / m³)",
    placeholder: "z. B. 25.000 kWh / 2.500 L Öl / 2.800 m³",
  },
  {
    key: "wohneinheiten",
    label: "Anzahl Wohneinheiten",
    placeholder: "z. B. 1",
  },
  {
    key: "heizsystem",
    label: "Heizsystem",
    placeholder: "Heizkörper / Fußbodenheizung / Kombination",
  },
  {
    key: "hotWaterIncluded",
    label: "Warmwasser durch Wärmepumpe?",
    placeholder: "Ja / Nein",
  },
  {
    key: "currentHeating",
    label: "Aktueller Heizungstyp (Hersteller, Modell)",
    placeholder: "z. B. Vaillant ecoTEC plus VC 246",
  },
  {
    key: "heatingAge",
    label: "Alter / Baujahr der Heizung",
    placeholder: "z. B. 18 Jahre / installiert 2008",
  },
  {
    key: "incomeRange",
    label: "Haushaltseinkommen / Jahr",
    placeholder: "unter 40.000 € / über 40.000 €",
  },
];

function InquiryStep({ register }: RHF) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Anfragedaten</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {INQUIRY_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs">{f.label}</Label>
              <Input {...register(`inquiry.${f.key}`)} placeholder={f.placeholder} />
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Zusätzliche Informationen</Label>
          <Textarea rows={3} {...register("inquiry.additionalInfo")} />
        </div>
      </CardContent>
    </Card>
  );
}

interface PositionsStepProps {
  catalog: CatalogItemForClient[];
  fields: ReturnType<typeof useFieldArray<CreateOfferData, "positions">>["fields"];
  append: ReturnType<typeof useFieldArray<CreateOfferData, "positions">>["append"];
  remove: ReturnType<typeof useFieldArray<CreateOfferData, "positions">>["remove"];
  register: ReturnType<typeof useForm<CreateOfferData>>["register"];
  setValue: ReturnType<typeof useForm<CreateOfferData>>["setValue"];
  positions: CreateOfferData["positions"];
}

function PositionsStep({
  catalog,
  fields,
  append,
  remove,
  register,
  positions,
}: PositionsStepProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [showCustom, setShowCustom] = useState(false);

  const selectedItem = catalog.find((c) => c.id === selectedItemId);
  const selectedVariant = selectedItem?.variants.find((v) => v.id === selectedVariantId);

  function addFromCatalog() {
    if (!selectedItem || !selectedVariant) {
      toast.error("Position und Variante wählen");
      return;
    }
    append({
      catalogItemVariantId: selectedVariant.id,
      name: selectedVariant.name,
      description: selectedVariant.description ?? "",
      itemType: selectedItem.type,
      manufacturer: selectedItem.manufacturer ?? "",
      photoStoragePath: selectedVariant.photoStoragePath ?? null,
      technicalData: Array.isArray(selectedVariant.technicalData)
        ? (selectedVariant.technicalData as { key: string; value: string }[])
        : [],
      unitPrice: selectedVariant.price,
      quantity,
      order: fields.length,
    });
    setSelectedItemId("");
    setSelectedVariantId("");
    setQuantity(1);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aus Katalog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_auto] gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Position</Label>
              <Select
                value={selectedItemId}
                onValueChange={(v) => {
                  setSelectedItemId(v);
                  setSelectedVariantId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wählen…" />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({TYPE_LABELS[item.type]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Variante</Label>
              <Select
                value={selectedVariantId}
                onValueChange={setSelectedVariantId}
                disabled={!selectedItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wählen…" />
                </SelectTrigger>
                <SelectContent>
                  {selectedItem?.variants.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} — {fmtEUR(v.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Menge</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <Button type="button" onClick={addFromCatalog}>
              <Plus className="mr-1 h-3 w-3" /> Hinzufügen
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCustom((s) => !s)}
          >
            {showCustom ? "Verbergen" : "Eigene Position…"}
          </Button>
          {showCustom && (
            <CustomPositionForm
              onAdd={(data) => {
                append({ ...data, order: fields.length });
                setShowCustom(false);
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Hinzugefügt ({fields.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">Noch keine Positionen.</p>
          )}
          {fields.map((f, idx) => (
            <div key={f.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{TYPE_LABELS[positions[idx]?.itemType ?? "ANDERE"]}</Badge>
                    <span className="font-medium">{positions[idx]?.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fmtEUR(Number(positions[idx]?.unitPrice) || 0)} × {positions[idx]?.quantity} Stück
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Menge</Label>
                  <Input
                    className="w-20"
                    type="number"
                    min={1}
                    {...register(`positions.${idx}.quantity`, { valueAsNumber: true })}
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => remove(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

interface CustomPosition {
  catalogItemVariantId: null;
  name: string;
  description: string;
  itemType: (typeof CATALOG_ITEM_TYPES)[number];
  manufacturer: string;
  photoStoragePath: null;
  technicalData: never[];
  unitPrice: number;
  quantity: number;
}

function CustomPositionForm({ onAdd }: { onAdd: (data: CustomPosition) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof CATALOG_ITEM_TYPES)[number]>("ANDERE");
  const [manufacturer, setManufacturer] = useState("");
  const [unitPrice, setUnitPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState("");

  return (
    <div className="rounded-md border-dashed border p-3 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
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
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input
          placeholder="Hersteller"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
        />
        <Input
          type="number"
          step="0.01"
          placeholder="Preis (€)"
          value={unitPrice}
          onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
        />
        <Input
          type="number"
          min={1}
          placeholder="Menge"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
        />
      </div>
      <Textarea
        rows={2}
        placeholder="Beschreibung (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button
        type="button"
        size="sm"
        onClick={() => {
          if (!name.trim()) {
            toast.error("Name erforderlich");
            return;
          }
          onAdd({
            catalogItemVariantId: null,
            name: name.trim(),
            description: description.trim(),
            itemType: type,
            manufacturer: manufacturer.trim(),
            photoStoragePath: null,
            technicalData: [],
            unitPrice,
            quantity,
          });
          setName("");
          setManufacturer("");
          setUnitPrice(0);
          setQuantity(1);
          setDescription("");
        }}
      >
        <Plus className="mr-1 h-3 w-3" /> Eigene Position hinzufügen
      </Button>
    </div>
  );
}

interface DiscountsStepProps {
  fields: ReturnType<typeof useFieldArray<CreateOfferData, "discounts">>["fields"];
  append: ReturnType<typeof useFieldArray<CreateOfferData, "discounts">>["append"];
  remove: ReturnType<typeof useFieldArray<CreateOfferData, "discounts">>["remove"];
  register: ReturnType<typeof useForm<CreateOfferData>>["register"];
  setValue: ReturnType<typeof useForm<CreateOfferData>>["setValue"];
  totals: ReturnType<typeof calcTotals>;
}

function DiscountsStep({ fields, append, remove, register, setValue, totals }: DiscountsStepProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Rabatte / Förderungen</CardTitle>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              append({
                label: "",
                description: "",
                kind: "PERCENT",
                value: 0,
                order: fields.length,
              })
            }
          >
            <Plus className="mr-1 h-3 w-3" /> Zeile
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Keine Rabatte. Optional. Beispiele: „Neukundenrabatt 5 %“, „KfW 458“ als FÖRDERUNG.
            </p>
          )}
          {fields.map((f, idx) => (
            <DiscountRow
              key={f.id}
              idx={idx}
              defaultKind={f.kind}
              register={register}
              setValue={setValue}
              onRemove={() => remove(idx)}
            />
          ))}
        </CardContent>
      </Card>

      <TotalsCard totals={totals} />
    </div>
  );
}

function DiscountRow({
  idx,
  defaultKind,
  register,
  setValue,
  onRemove,
}: {
  idx: number;
  defaultKind: "PERCENT" | "AMOUNT" | "FOERDERUNG";
  register: ReturnType<typeof useForm<CreateOfferData>>["register"];
  setValue: ReturnType<typeof useForm<CreateOfferData>>["setValue"];
  onRemove: () => void;
}) {
  const [kind, setKind] = useState<"PERCENT" | "AMOUNT" | "FOERDERUNG">(defaultKind);
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px_120px_40px] gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Bezeichnung</Label>
          <Input {...register(`discounts.${idx}.label`)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Typ</Label>
          <Select
            defaultValue={defaultKind}
            onValueChange={(v) => {
              const next = v as "PERCENT" | "AMOUNT" | "FOERDERUNG";
              setKind(next);
              setValue(`discounts.${idx}.kind`, next);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENT">Rabatt %</SelectItem>
              <SelectItem value="AMOUNT">Rabatt €</SelectItem>
              <SelectItem value="FOERDERUNG">Förderung €</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Wert</Label>
          <Input
            type="number"
            step="0.01"
            {...register(`discounts.${idx}.value`, { valueAsNumber: true })}
          />
        </div>
        <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {kind === "FOERDERUNG" && (
        <div className="space-y-1">
          <Label className="text-xs">Beschreibung (optional, wird im PDF angezeigt)</Label>
          <Textarea
            rows={3}
            placeholder="z. B. Grundförderung 30 % · Effizienzbonus 5 % · Klimageschwindigkeitsbonus 20 %"
            {...register(`discounts.${idx}.description`)}
          />
        </div>
      )}
    </div>
  );
}

function TotalsCard({ totals }: { totals: ReturnType<typeof calcTotals> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Übersicht</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        <Row label="Zwischensumme" value={fmtEUR(totals.subtotal)} />
        {totals.appliedDiscounts.map((d, i) => (
          <Row key={i} label={d.label || "Rabatt"} value={`- ${fmtEUR(d.amount)}`} muted />
        ))}
        <Row label="Netto" value={fmtEUR(totals.netto)} />
        <Row label="MwSt. 19 %" value={fmtEUR(totals.vat)} />
        <Row label="Gesamt (Brutto)" value={fmtEUR(totals.brutto)} bold />
        {totals.foerderungen.length > 0 && (
          <>
            <div className="pt-2 mt-2 border-t text-xs text-muted-foreground">
              Voraussichtliche Förderungen
            </div>
            {totals.foerderungen.map((f, i) => (
              <Row key={i} label={f.label || "Förderung"} value={`- ${fmtEUR(f.amount)}`} />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${
        bold ? "font-semibold border-t pt-1 mt-1" : ""
      } ${muted ? "text-muted-foreground" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

interface FinalStepProps {
  register: ReturnType<typeof useForm<CreateOfferData>>["register"];
  errors: ReturnType<typeof useForm<CreateOfferData>>["formState"]["errors"];
  totals: ReturnType<typeof calcTotals>;
  positionCount: number;
  clientName: string;
  control: ReturnType<typeof useForm<CreateOfferData>>["control"];
  setValue: ReturnType<typeof useForm<CreateOfferData>>["setValue"];
}

function FinalStep({
  register,
  errors,
  totals,
  positionCount,
  clientName,
  control,
  setValue,
}: FinalStepProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Abschluss</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Titel</Label>
            <Input {...register("title")} />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Gültigkeit (Tage)</Label>
            <Input
              type="number"
              min={1}
              {...register("validUntilDays", { valueAsNumber: true })}
            />
          </div>
          <div className="rounded-md bg-muted p-3 text-sm">
            <p>
              <strong>{clientName}</strong> · {positionCount} Position(en)
            </p>
            <p className="text-muted-foreground">
              Nach Erstellung wird eine PDF-Vorschau generiert. Versand erfolgt im nächsten Schritt.
            </p>
          </div>
        </CardContent>
      </Card>

      <ServiceItemsEditor control={control} setValue={setValue} />

      <TotalsCard totals={totals} />
    </div>
  );
}

function ServiceItemsEditor({
  control,
  setValue,
}: {
  control: ReturnType<typeof useForm<CreateOfferData>>["control"];
  setValue: ReturnType<typeof useForm<CreateOfferData>>["setValue"];
}) {
  const items = (useWatch({ control, name: "serviceItems" }) ?? []) as string[];
  const [newItem, setNewItem] = useState("");

  function toggle(label: string, checked: boolean) {
    const next = checked
      ? Array.from(new Set([...items, label]))
      : items.filter((i) => i !== label);
    setValue("serviceItems", next, { shouldDirty: true });
  }

  function removeCustom(label: string) {
    setValue(
      "serviceItems",
      items.filter((i) => i !== label),
      { shouldDirty: true },
    );
  }

  function addCustom() {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) {
      toast.error("Punkt existiert bereits");
      return;
    }
    setValue("serviceItems", [...items, trimmed], { shouldDirty: true });
    setNewItem("");
  }

  const customItems = items.filter((i) => !DEFAULT_SERVICE_ITEMS.includes(i));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Leistungsumfang Wärmepumpe</CardTitle>
        <p className="text-xs text-muted-foreground">
          Erscheint im PDF unter „Angebot akzeptieren“. Standardpunkte abwählen oder eigene
          ergänzen.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          {DEFAULT_SERVICE_ITEMS.map((label) => {
            const checked = items.includes(label);
            return (
              <label
                key={label}
                className="flex items-start gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={checked}
                  onChange={(e) => toggle(label, e.target.checked)}
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>

        {customItems.length > 0 && (
          <div className="pt-3 border-t space-y-1.5">
            <p className="text-xs text-muted-foreground">Eigene Punkte</p>
            {customItems.map((label) => (
              <div key={label} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked
                  onChange={() => removeCustom(label)}
                />
                <span className="flex-1">{label}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeCustom(label)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t flex gap-2">
          <Input
            placeholder="Eigenen Punkt hinzufügen…"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <Button type="button" size="sm" onClick={addCustom}>
            <Plus className="mr-1 h-3 w-3" /> Hinzufügen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface HeatBalanceStepProps {
  register: ReturnType<typeof useForm<CreateOfferData>>["register"];
  setValue: ReturnType<typeof useForm<CreateOfferData>>["setValue"];
  control: ReturnType<typeof useForm<CreateOfferData>>["control"];
}

function HeatBalanceStep({ register, setValue, control }: HeatBalanceStepProps) {
  const hb = useWatch({ control, name: "heatBalance" }) as HeatBalance | undefined;
  const enabled = hb?.enabled ?? true;
  const result = useMemo(() => calcHeatBalance(hb ?? DEFAULT_HEAT_BALANCE), [hb]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Wärmehaushalt &amp; Prognose</CardTitle>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setValue("heatBalance.enabled", e.target.checked)}
            />
            Im PDF anzeigen
          </label>
        </CardHeader>
        <CardContent className={`space-y-4 ${enabled ? "" : "opacity-50 pointer-events-none"}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Jahresverbrauch (kWh)</Label>
              <Input
                type="number"
                step="100"
                {...register("heatBalance.annualConsumptionKwh", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Aktueller Brennstoff</Label>
              <Select
                value={hb?.fuel ?? "GAS"}
                onValueChange={(v) => setValue("heatBalance.fuel", v as HeatBalance["fuel"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GAS">Gas</SelectItem>
                  <SelectItem value="OEL">Heizöl</SelectItem>
                  <SelectItem value="STROM">Strom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SCOP (Wärmepumpen-Effizienz)</Label>
              <Input
                type="number"
                step="0.1"
                {...register("heatBalance.scop", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gas-Preis (€/kWh)</Label>
              <Input
                type="number"
                step="0.01"
                {...register("heatBalance.gasPricePerKwh", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Öl-Preis (€/L)</Label>
              <Input
                type="number"
                step="0.01"
                {...register("heatBalance.oilPricePerLiter", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Strom-Preis (€/kWh)</Label>
              <Input
                type="number"
                step="0.01"
                {...register("heatBalance.electricityPricePerKwh", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Anteil PV (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step="1"
                {...register("heatBalance.pvSharePercent", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Anteil Speicher (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step="1"
                {...register("heatBalance.bufferSharePercent", { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vorschau</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">Heizkostenprognose / Jahr</p>
                <p className="text-lg font-semibold">
                  {fmtEUR(result.costBefore)}{" "}
                  <span className="text-muted-foreground text-sm">→</span>{" "}
                  <span className="text-primary">{fmtEUR(result.costAfter)}</span>
                </p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">Effizienz / Jahr</p>
                <p className="text-lg font-semibold">
                  {Math.round(result.kwhBefore).toLocaleString("de-DE")} kWh{" "}
                  <span className="text-muted-foreground text-sm">→</span>{" "}
                  <span className="text-primary">
                    {Math.round(result.kwhAfter).toLocaleString("de-DE")} kWh
                  </span>
                </p>
              </div>
            </div>
            <ChartPreview result={result} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const CHART_COLORS = {
  grid: "#1f2937",
  pv: "#f59e0b",
  buffer: "#10b981",
};

function ChartPreview({ result }: { result: ReturnType<typeof calcHeatBalance> }) {
  const max = result.maxMonthlyKwh || 1;
  return (
    <div>
      <div className="flex items-end gap-2 h-40 border-b pb-1">
        {result.monthly.map((m, i) => {
          const total = m.total;
          const heightPct = (total / max) * 100;
          const gridPct = total > 0 ? (m.fromGrid / total) * 100 : 0;
          const pvPct = total > 0 ? (m.fromPv / total) * 100 : 0;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col-reverse rounded-t-sm overflow-hidden"
              style={{ height: `${heightPct}%` }}
              title={`${m.month}: ${Math.round(total)} kWh`}
            >
              <div style={{ height: `${gridPct}%`, background: CHART_COLORS.grid }} />
              <div style={{ height: `${pvPct}%`, background: CHART_COLORS.pv }} />
              <div style={{ flex: 1, background: CHART_COLORS.buffer }} />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        {MONTHS_DE.map((m) => (
          <div key={m} className="flex-1 text-center">
            {m.slice(0, 3)}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
        <Legend color={CHART_COLORS.grid} label="Aus dem Netz" />
        <Legend color={CHART_COLORS.pv} label="Aus der PV-Anlage" />
        <Legend color={CHART_COLORS.buffer} label="Aus dem Speicher" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
