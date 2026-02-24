export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { renderPdfHtml } from "@/lib/pdf/renderer";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  // Auth check - only authenticated users can see preview
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { projectId } = await params;

  try {
    // renderPdfHtml produces trusted server-side content from our own DB data.
    // All user-provided strings are HTML-escaped via the escHtml() utility in renderer.ts.
    const html = await renderPdfHtml(projectId);

    return (
      <div className="w-full md:max-w-[210mm] mx-auto bg-white shadow-lg overflow-x-auto">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  } catch {
    notFound();
  }
}
