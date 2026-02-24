export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/actions/projects";
import { SECTION_LABELS } from "@/lib/validations/sections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Circle,
  FileText,
  Edit,
  Download,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { GeneratePdfButton } from "@/components/pdf/generate-button";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  REVIEW: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Entwurf",
  IN_PROGRESS: "In Bearbeitung",
  REVIEW: "Überprüfung",
  COMPLETED: "Abgeschlossen",
  ARCHIVED: "Archiviert",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  const completedSections = project.sections.filter((s) => s.completed).length;
  const progress = (completedSections / 16) * 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
          </Link>
          <Badge className={`sm:hidden ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </Badge>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{project.title}</h1>
          <p className="text-sm text-muted-foreground truncate">
            {project.projectNumber} — {project.client.firstName}{" "}
            {project.client.lastName}
          </p>
        </div>
        <Badge className={`hidden sm:inline-flex ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fortschritt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedSections}/16
            </div>
            <Progress value={progress} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Adresse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {project.street} {project.houseNumber}
            </p>
            <p className="text-sm text-muted-foreground">
              {project.postalCode} {project.city}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dokumente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.documents.length}</div>
            <GeneratePdfButton projectId={project.id} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Abschnitte</CardTitle>
            <Link href={`/projects/${project.id}/edit/1`}>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Wizard starten
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {project.sections.map((section, index) => (
              <Link
                key={section.id}
                href={`/projects/${project.id}/edit/${index + 1}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                {section.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {index + 1}. {SECTION_LABELS[section.type]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {section._count.photos} Foto{section._count.photos !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {project.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generierte Dokumente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {project.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        v{doc.version} — {new Date(doc.createdAt).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 sm:gap-2 shrink-0">
                    {doc.status === "COMPLETED" && (
                      <>
                        <Link href={`/projects/${project.id}/documents/${doc.id}`}>
                          <Button size="sm" variant="outline" title="Anzeigen">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/api/pdf/download/${doc.id}`}>
                          <Button size="sm" variant="outline" title="Herunterladen">
                            <Download className="h-4 w-4" />
                          </Button>
                        </Link>
                      </>
                    )}
                    {doc.status === "PROCESSING" && (
                      <Badge variant="outline">Wird generiert...</Badge>
                    )}
                    {doc.status === "FAILED" && (
                      <Badge variant="destructive">Fehler</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
