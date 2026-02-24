"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getProject } from "@/lib/actions/projects";
import { getSection, updateSection, completeSection, uncompleteSection } from "@/lib/actions/sections";
import { SECTION_LABELS, SECTION_ORDER } from "@/lib/validations/sections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Save,
  CheckCircle,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { SectionForm } from "@/components/forms/section-form";
import { PhotoUpload, type Photo } from "@/components/photos/photo-upload";

export default function WizardStepPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const step = parseInt(params.step as string);

  const [project, setProject] = useState<Awaited<ReturnType<typeof getProject>>>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [sectionData, setSectionData] = useState<Record<string, unknown>>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const sectionType = SECTION_ORDER[step - 1];
  const sectionLabel = SECTION_LABELS[sectionType];
  const totalSteps = SECTION_ORDER.length;

  useEffect(() => {
    async function loadData() {
      const proj = await getProject(projectId);
      setProject(proj);

      const section = await getSection(projectId, sectionType);
      if (section) {
        setSectionId(section.id);
        setSectionData((section.data as Record<string, unknown>) || {});
        setIsCompleted(section.completed);
        setPhotos(
          section.photos.map((p) => ({
            id: p.id,
            fileName: p.fileName,
            caption: p.caption,
            thumbnailPath: p.thumbnailPath,
            storagePath: p.storagePath,
          }))
        );
      }
    }
    loadData();
  }, [projectId, sectionType]);

  const saveData = useCallback(
    async (data: Record<string, unknown>) => {
      setSaving(true);
      try {
        await updateSection(projectId, sectionType, data);
      } catch {
        toast.error("Fehler beim Speichern");
      } finally {
        setSaving(false);
      }
    },
    [projectId, sectionType]
  );

  function onDataChange(data: Record<string, unknown>) {
    setSectionData(data);

    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => saveData(data), 1500);
    setAutoSaveTimer(timer);
  }

  async function handleSave() {
    await saveData(sectionData);
    toast.success("Gespeichert");
  }

  async function handleToggleComplete() {
    if (isCompleted) {
      await uncompleteSection(projectId, sectionType);
      setIsCompleted(false);
    } else {
      await saveData(sectionData);
      await completeSection(projectId, sectionType);
      setIsCompleted(true);
      toast.success("Abschnitt als abgeschlossen markiert");
    }
  }

  function goToStep(s: number) {
    if (s >= 1 && s <= totalSteps) {
      saveData(sectionData);
      router.push(`/projects/${projectId}/edit/${s}`);
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm" className="px-2 sm:px-3">
            <ArrowLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Projekt</span>
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm sm:text-lg font-bold truncate">
            {step}/{totalSteps}: {sectionLabel}
          </h1>
          <Progress value={(step / totalSteps) * 100} className="mt-1 h-2" />
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground shrink-0">
          {saving && <span className="text-yellow-500">Speichern...</span>}
          {!saving && <span className="text-green-500">Gespeichert</span>}
        </div>
      </div>

      {/* Step navigation */}
      <div className="flex gap-1 flex-wrap overflow-x-auto pb-1 -mx-1 px-1">
        {SECTION_ORDER.map((type, i) => {
          const sec = project.sections.find((s) => s.type === type);
          const isCurrent = i + 1 === step;
          return (
            <button
              key={type}
              onClick={() => goToStep(i + 1)}
              className={`flex items-center justify-center shrink-0 min-w-[28px] h-7 px-1.5 sm:px-2 sm:gap-1 rounded text-xs transition-colors ${
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : sec?.completed
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {sec?.completed ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <span>{i + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Form */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
            <CardTitle className="text-base sm:text-lg">{sectionLabel}</CardTitle>
            <Button
              variant={isCompleted ? "default" : "outline"}
              size="sm"
              onClick={handleToggleComplete}
              className="self-start"
            >
              <Check className="h-4 w-4 mr-1" />
              {isCompleted ? "Abgeschlossen" : "Als fertig markieren"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-4 sm:px-6">
          <SectionForm
            sectionType={sectionType}
            data={sectionData}
            onChange={onDataChange}
            projectId={projectId}
          />

          {/* Photo upload for every section */}
          {sectionId && (
            <div className="border-t pt-4">
              <PhotoUpload
                sectionId={sectionId}
                photos={photos}
                onPhotosChange={setPhotos}
                label="Fotos"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToStep(step - 1)}
          disabled={step <= 1}
        >
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Zurück</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Speichern</span>
        </Button>
        {step < totalSteps ? (
          <Button size="sm" onClick={() => goToStep(step + 1)}>
            <span className="hidden sm:inline">Weiter</span>
            <ArrowRight className="h-4 w-4 sm:ml-2" />
          </Button>
        ) : (
          <Link href={`/projects/${projectId}`}>
            <Button size="sm">
              <Check className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Fertig</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
