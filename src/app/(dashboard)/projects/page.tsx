import Link from "next/link";
import { getProjects } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen } from "lucide-react";

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

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projekte</h1>
          <p className="text-muted-foreground">
            {projects.length} Projekt{projects.length !== 1 ? "e" : ""}
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neues Projekt
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Projekte</h3>
            <p className="text-muted-foreground mb-4">
              Erstellen Sie Ihr erstes Projekt
            </p>
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Projekt erstellen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {project.projectNumber} — {project.client.firstName}{" "}
                        {project.client.lastName}
                      </p>
                    </div>
                    <Badge className={statusColors[project.status]}>
                      {statusLabels[project.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      {project.street} {project.houseNumber}, {project.postalCode}{" "}
                      {project.city}
                    </span>
                    <span>
                      {project._count.sections}/16 Abschnitte
                    </span>
                    <span>
                      {project._count.documents} PDF{project._count.documents !== 1 ? "s" : ""}
                    </span>
                    <span className="hidden sm:inline">Erstellt von {project.createdBy.name}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
