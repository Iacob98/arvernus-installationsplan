import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { templateUploadSchema } from "@/lib/validations/campaign";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const formData = await request.formData();

  const name = formData.get("name") as string;
  const subject = formData.get("subject") as string;
  const htmlFile = formData.get("html") as File | null;
  const imageFiles = formData.getAll("images") as File[];

  const validated = templateUploadSchema.safeParse({ name, subject });
  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (!htmlFile) {
    return NextResponse.json({ error: "HTML-Datei ist erforderlich" }, { status: 400 });
  }

  const htmlContent = await htmlFile.text();

  // Create template record first (need ID for storage path)
  const template = await db.emailTemplate.create({
    data: {
      name: validated.data.name,
      subject: validated.data.subject,
      htmlContent,
      htmlCid: "", // will be updated after image processing
    },
  });

  // Upload images and create records
  let processedHtml = htmlContent;
  const imageRecords: Array<{
    filename: string;
    storagePath: string;
    cid: string;
    mimeType: string;
  }> = [];

  for (const imageFile of imageFiles) {
    const filename = imageFile.name;
    const cid = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `email-templates/${template.id}/${filename}`;
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const mimeType = imageFile.type || "image/png";

    await uploadFile(storagePath, buffer, mimeType);

    imageRecords.push({ filename, storagePath, cid, mimeType });

    // Replace any src attribute ending with this filename (handles all path variants)
    const pattern = new RegExp(
      `src=["'][^"']*${escapeRegex(filename)}["']`,
      "g"
    );
    processedHtml = processedHtml.replace(pattern, `src="cid:${cid}"`);
  }

  // Batch create image records
  if (imageRecords.length > 0) {
    await db.emailTemplateImage.createMany({
      data: imageRecords.map((img) => ({
        ...img,
        templateId: template.id,
      })),
    });
  }

  // Update template with CID-processed HTML
  await db.emailTemplate.update({
    where: { id: template.id },
    data: { htmlCid: processedHtml },
  });

  return NextResponse.json({ id: template.id });
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
