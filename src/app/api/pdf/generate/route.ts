import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { renderPdfHtml, getFooterHtml } from "@/lib/pdf/renderer";
import { uploadFile } from "@/lib/storage";
import { chromium } from "playwright";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await req.json();
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { projectNumber: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Get current version
  const lastDoc = await db.document.findFirst({
    where: { projectId },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const version = (lastDoc?.version ?? 0) + 1;
  const fileName = `${project.projectNumber}_Installationsplan_v${version}.pdf`;
  const storagePath = `documents/${projectId}/${fileName}`;

  // Create document record
  const document = await db.document.create({
    data: {
      fileName,
      storagePath,
      size: 0,
      version,
      status: "PROCESSING",
      projectId,
      generatedById: session.user.id,
    },
  });

  try {
    // Render HTML + footer template
    const html = await renderPdfHtml(projectId);
    const footerHtml = await getFooterHtml(projectId);

    // Launch browser and generate PDF
    const browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: footerHtml,
      margin: {
        top: "15mm",
        bottom: "30mm",
        left: "15mm",
        right: "15mm",
      },
    });
    await browser.close();

    // Upload to MinIO
    await uploadFile(storagePath, Buffer.from(pdfBuffer), "application/pdf");

    // Update document record
    await db.document.update({
      where: { id: document.id },
      data: {
        status: "COMPLETED",
        size: pdfBuffer.length,
      },
    });

    return NextResponse.json({
      documentId: document.id,
      status: "COMPLETED",
      size: pdfBuffer.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : "";
    console.error("[PDF Generate] Failed:", message, "\n", stack);

    await db.document.update({
      where: { id: document.id },
      data: {
        status: "FAILED",
        errorMessage: message,
      },
    });

    return NextResponse.json(
      { error: "PDF generation failed", details: message },
      { status: 500 }
    );
  }
}
