import { Worker, Job } from "bullmq";
import { chromium } from "playwright";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { redis, PdfJobData } from "@/lib/queue";
import { renderPdfHtml } from "./renderer";

async function processPdfJob(job: Job<PdfJobData>) {
  const { projectId, documentId } = job.data;

  try {
    // Update status
    await db.document.update({
      where: { id: documentId },
      data: { status: "PROCESSING" },
    });

    await job.updateProgress(10);

    // Render HTML
    const html = await renderPdfHtml(projectId);
    await job.updateProgress(30);

    // Launch browser and render PDF
    const browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await job.updateProgress(60);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "25mm",
        left: "15mm",
        right: "15mm",
      },
    });
    await browser.close();
    await job.updateProgress(80);

    // Upload to MinIO
    const document = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!document) throw new Error("Document not found");

    await uploadFile(
      document.storagePath,
      Buffer.from(pdfBuffer),
      "application/pdf"
    );
    await job.updateProgress(90);

    // Update document record
    await db.document.update({
      where: { id: documentId },
      data: {
        status: "COMPLETED",
        size: pdfBuffer.length,
      },
    });

    await job.updateProgress(100);
    return { success: true, size: pdfBuffer.length };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    await db.document.update({
      where: { id: documentId },
      data: {
        status: "FAILED",
        errorMessage: message,
      },
    });

    throw error;
  }
}

// Start worker
export function startPdfWorker() {
  const worker = new Worker("pdf-generation", processPdfJob, {
    connection: redis,
    concurrency: 2,
    limiter: {
      max: 5,
      duration: 60000,
    },
  });

  worker.on("completed", (job) => {
    console.log(`PDF job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`PDF job ${job?.id} failed:`, err.message);
  });

  return worker;
}
