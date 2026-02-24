import { readFileSync } from "fs";
import { join } from "path";

let cachedLogoBase64: string | null = null;

export function getLogoBase64(): string {
  if (cachedLogoBase64) return cachedLogoBase64;

  try {
    const logoPath = join(process.cwd(), "public", "logo-small.png");
    const buffer = readFileSync(logoPath);
    cachedLogoBase64 = `data:image/png;base64,${buffer.toString("base64")}`;
    return cachedLogoBase64;
  } catch {
    return "";
  }
}
