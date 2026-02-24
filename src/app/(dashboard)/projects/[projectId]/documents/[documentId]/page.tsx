"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";

export default function PdfViewerPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const documentId = params.documentId as string;
  const [fullscreen, setFullscreen] = useState(false);

  const pdfUrl = `/api/pdf/download/${documentId}?inline=1`;

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-white flex flex-col" : "flex flex-col h-[calc(100vh-7rem)]"}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-2 sm:p-3 border-b bg-white shrink-0">
        <div className="flex items-center gap-2">
          {!fullscreen && (
            <Link href={`/projects/${projectId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Zurück</span>
              </Button>
            </Link>
          )}
          <span className="text-sm font-medium hidden sm:inline">PDF-Vorschau</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen(!fullscreen)}
            title={fullscreen ? "Verkleinern" : "Vollbild"}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Link href={`/api/pdf/download/${documentId}`}>
            <Button size="sm" title="Herunterladen">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Herunterladen</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* PDF embed */}
      <div className="flex-1 min-h-0 bg-gray-100">
        <iframe
          src={pdfUrl}
          className="w-full h-full border-0"
          title="PDF-Vorschau"
        />
      </div>
    </div>
  );
}
