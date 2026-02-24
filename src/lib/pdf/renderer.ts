import { db } from "@/lib/db";
import { getFileBuffer } from "@/lib/storage";
import { getPdfStyles } from "./styles";
import { getLogoBase64 } from "./logo";
import { SECTION_LABELS, SECTION_ORDER } from "@/lib/validations/sections";

import { Client, Project, ProjectSection, Photo, HeatingCircuitItem, CompanySettings } from "@prisma/client";

// ─── Phosphor Icons (Bold weight, viewBox 0 0 256 256) ───

function phosphorIcon(path: string, size = 24, color = "currentColor"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256" fill="${color}" style="flex-shrink:0;vertical-align:middle;">${path}</svg>`;
}

const ICONS = {
  hardHat: (size?: number, color?: string) => phosphorIcon(
    `<path d="M228,148.4V136a100.41,100.41,0,0,0-64-93.3V40a20,20,0,0,0-20-20H112A20,20,0,0,0,92,40v2.7A100.41,100.41,0,0,0,28,136v12.4A20,20,0,0,0,12,168v24a20,20,0,0,0,20,20H224a20,20,0,0,0,20-20V168A20,20,0,0,0,228,148.4ZM204,136v12H164V69.07A76.35,76.35,0,0,1,204,136ZM140,44V148H116V44ZM92,69.07V148H52V136A76.35,76.35,0,0,1,92,69.07ZM220,188H36V172H220Z"/>`,
    size, color
  ),
  lightning: (size?: number, color?: string) => phosphorIcon(
    `<path d="M219.71,117.38a12,12,0,0,0-7.25-8.52L161.28,88.39l10.59-70.61a12,12,0,0,0-20.64-10l-112,120a12,12,0,0,0,4.31,19.33l51.18,20.47L84.13,238.22a12,12,0,0,0,20.64,10l112-120A12,12,0,0,0,219.71,117.38ZM113.6,203.55l6.27-41.77a12,12,0,0,0-7.41-12.92L68.74,131.37,142.4,52.45l-6.27,41.77a12,12,0,0,0,7.41,12.92l43.72,17.49Z"/>`,
    size, color
  ),
  gearSix: (size?: number, color?: string) => phosphorIcon(
    `<path d="M128,76a52,52,0,1,0,52,52A52.06,52.06,0,0,0,128,76Zm0,80a28,28,0,1,1,28-28A28,28,0,0,1,128,156Zm113.86-49.57A12,12,0,0,0,236,98.34L208.21,82.49l-.11-31.31a12,12,0,0,0-4.25-9.12,116,116,0,0,0-38-21.41,12,12,0,0,0-9.68.89L128,37.27,99.83,21.53a12,12,0,0,0-9.7-.9,116.06,116.06,0,0,0-38,21.47,12,12,0,0,0-4.24,9.1l-.14,31.34L20,98.35a12,12,0,0,0-5.85,8.11,110.7,110.7,0,0,0,0,43.11A12,12,0,0,0,20,157.66l27.82,15.85.11,31.31a12,12,0,0,0,4.25,9.12,116,116,0,0,0,38,21.41,12,12,0,0,0,9.68-.89L128,218.73l28.14,15.74a12,12,0,0,0,9.7.9,116.06,116.06,0,0,0,38-21.47,12,12,0,0,0,4.24-9.1l.14-31.34,27.81-15.81a12,12,0,0,0,5.85-8.11A110.7,110.7,0,0,0,241.86,106.43Zm-22.63,33.18-26.88,15.28a11.94,11.94,0,0,0-4.55,4.59c-.54,1-1.11,1.93-1.7,2.88a12,12,0,0,0-1.83,6.31L184.13,199a91.83,91.83,0,0,1-21.07,11.87l-27.15-15.19a12,12,0,0,0-5.86-1.53h-.29c-1.14,0-2.3,0-3.44,0a12.08,12.08,0,0,0-6.14,1.51L93,210.82A92.27,92.27,0,0,1,71.88,199l-.11-30.24a12,12,0,0,0-1.83-6.32c-.58-.94-1.16-1.91-1.7-2.88A11.92,11.92,0,0,0,63.7,155L36.8,139.63a86.53,86.53,0,0,1,0-23.24l26.88-15.28a12,12,0,0,0,4.55-4.58c.54-1,1.11-1.94,1.7-2.89a12,12,0,0,0,1.83-6.31L71.87,57A91.83,91.83,0,0,1,92.94,45.17l27.15,15.19a11.92,11.92,0,0,0,6.15,1.52c1.14,0,2.3,0,3.44,0a12.08,12.08,0,0,0,6.14-1.51L163,45.18A92.27,92.27,0,0,1,184.12,57l.11,30.24a12,12,0,0,0,1.83,6.32c.58.94,1.16,1.91,1.7,2.88A11.92,11.92,0,0,0,192.3,101l26.9,15.33A86.53,86.53,0,0,1,219.23,139.61Z"/>`,
    size, color
  ),
  broom: (size?: number, color?: string) => phosphorIcon(
    `<path d="M237.24,213.21C216.12,203,204,180.64,204,152V134.73a19.94,19.94,0,0,0-12.62-18.59l-24.86-9.81a4,4,0,0,1-2.26-5.14l21.33-53A32,32,0,0,0,167.17,6,32.13,32.13,0,0,0,126.25,24.2l-.07.18-21,53.09a3.94,3.94,0,0,1-2.14,2.2,3.89,3.89,0,0,1-3,.06L74.6,69.43A19.89,19.89,0,0,0,52.87,74C31.06,96.43,20,122.68,20,152a115.46,115.46,0,0,0,32.29,80.3A12,12,0,0,0,61,236H232a12,12,0,0,0,5.24-22.79ZM68.19,92.73,91.06,102A28,28,0,0,0,127.5,86.31l20.95-53a8.32,8.32,0,0,1,10.33-4.81,8,8,0,0,1,4.61,10.57,1.17,1.17,0,0,0,0,.11L142,92.29a28.05,28.05,0,0,0,15.68,36.33L180,137.45V152c0,1,0,2.07.05,3.1l-122.44-49A101.91,101.91,0,0,1,68.19,92.73ZM116.74,212a83.73,83.73,0,0,1-22.09-39,12,12,0,0,0-23.25,6,110.27,110.27,0,0,0,14.49,33H66.25A91.53,91.53,0,0,1,44,152a84,84,0,0,1,3.41-24.11l136.67,54.66A86.58,86.58,0,0,0,198.66,212Z"/>`,
    size, color
  ),
  warning: (size?: number, color?: string) => phosphorIcon(
    `<path d="M240.26,186.1,152.81,34.23h0a28.74,28.74,0,0,0-49.62,0L15.74,186.1a27.45,27.45,0,0,0,0,27.71A28.31,28.31,0,0,0,40.55,228h174.9a28.31,28.31,0,0,0,24.79-14.19A27.45,27.45,0,0,0,240.26,186.1Zm-20.8,15.7a4.46,4.46,0,0,1-4,2.2H40.55a4.46,4.46,0,0,1-4-2.2,3.56,3.56,0,0,1,0-3.73L124,46.2a4.77,4.77,0,0,1,8,0l87.44,151.87A3.56,3.56,0,0,1,219.46,201.8ZM116,136V104a12,12,0,0,1,24,0v32a12,12,0,0,1-24,0Zm28,40a16,16,0,1,1-16-16A16,16,0,0,1,144,176Z"/>`,
    size, color
  ),
  wifiHigh: (size?: number, color?: string) => phosphorIcon(
    `<path d="M144,204a16,16,0,1,1-16-16A16,16,0,0,1,144,204ZM239.61,83.91a176,176,0,0,0-223.22,0,12,12,0,1,0,15.23,18.55,152,152,0,0,1,192.76,0,12,12,0,1,0,15.23-18.55Zm-32.16,35.73a128,128,0,0,0-158.9,0,12,12,0,0,0,14.9,18.81,104,104,0,0,1,129.1,0,12,12,0,0,0,14.9-18.81ZM175.07,155.3a80.05,80.05,0,0,0-94.14,0,12,12,0,0,0,14.14,19.4,56,56,0,0,1,65.86,0,12,12,0,1,0,14.14-19.4Z"/>`,
    size, color
  ),
  trash: (size?: number, color?: string) => phosphorIcon(
    `<path d="M216,48H180V36A28,28,0,0,0,152,8H104A28,28,0,0,0,76,36V48H40a12,12,0,0,0,0,24h4V208a20,20,0,0,0,20,20H192a20,20,0,0,0,20-20V72h4a12,12,0,0,0,0-24ZM100,36a4,4,0,0,1,4-4h48a4,4,0,0,1,4,4V48H100Zm88,168H68V72H188ZM116,104v64a12,12,0,0,1-24,0V104a12,12,0,0,1,24,0Zm48,0v64a12,12,0,0,1-24,0V104a12,12,0,0,1,24,0Z"/>`,
    size, color
  ),
  clipboardText: (size?: number, color?: string) => phosphorIcon(
    `<path d="M172,164a12,12,0,0,1-12,12H96a12,12,0,0,1,0-24h64A12,12,0,0,1,172,164Zm-12-52H96a12,12,0,0,0,0,24h64a12,12,0,0,0,0-24Zm60-64V216a20,20,0,0,1-20,20H56a20,20,0,0,1-20-20V48A20,20,0,0,1,56,28H90.53a51.88,51.88,0,0,1,74.94,0H200A20,20,0,0,1,220,48ZM100.29,60h55.42a28,28,0,0,0-55.42,0ZM196,52H178.59A52.13,52.13,0,0,1,180,64v8a12,12,0,0,1-12,12H88A12,12,0,0,1,76,72V64a52.13,52.13,0,0,1,1.41-12H60V212H196Z"/>`,
    size, color
  ),
};

type ProjectData = Project & {
  client: Client;
  sections: (ProjectSection & { photos: Photo[] })[];
  heatingCircuits: (HeatingCircuitItem & { photos: Photo[] })[];
};

type CompanyData = CompanySettings;

// ─── Exported: generate footer HTML for Playwright's footerTemplate ───

export async function getFooterHtml(projectId: string): Promise<string> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { client: true },
  });
  if (!project) return "";

  const company = (await db.companySettings.findFirst()) || {
    name: "Arvernus Meisterbetrieb",
    street: "Tübinger Straße 2",
    postalCode: "10715",
    city: "Berlin",
    phone: "0123 456789",
    email: "info@arvernus-energie.de",
    website: "www.arvernus-energie.de",
    primaryColor: "#1565C0",
  } as CompanyData;

  const logoSrc = getLogoBase64();

  return `<div style="width:100%;padding:0 15mm;font-family:'Segoe UI',Tahoma,sans-serif;">
    <div style="text-align:center;font-size:7pt;color:#888;margin-bottom:5px;">
      Seite <span class="pageNumber"></span>/<span class="totalPages"></span>
    </div>
    <div style="border-top:1px solid #ddd;padding-top:6px;display:flex;justify-content:space-between;font-size:6.5pt;color:#999;line-height:1.4;">
      <div style="flex:1;">
        ${logoSrc ? `<img src="${logoSrc}" style="height:18px;margin-bottom:3px;display:block;" />` : ""}
        ${esc(company.name)}<br>
        ${esc(company.street)}<br>
        ${esc(company.postalCode)} ${esc(company.city)}
      </div>
      <div style="flex:1;text-align:center;">
        ${company.phone ? esc(company.phone) : ""}
      </div>
      <div style="flex:1;text-align:right;">
        ${company.email ? esc(company.email) : ""}<br>
        ${company.website ? esc(company.website) : ""}
      </div>
    </div>
  </div>`;
}

// ─── Exported: render full HTML content ───

export async function renderPdfHtml(projectId: string): Promise<string> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      client: true,
      sections: {
        orderBy: { order: "asc" },
        include: { photos: { orderBy: { order: "asc" } } },
      },
      heatingCircuits: {
        orderBy: { number: "asc" },
        include: { photos: true },
      },
    },
  });

  if (!project) throw new Error("Project not found");

  const company =
    (await db.companySettings.findFirst()) ||
    ({
      name: "Arvernus Meisterbetrieb",
      street: "Tübinger Straße 2",
      postalCode: "10715",
      city: "Berlin",
      phone: "0123 456789",
      email: "info@arvernus-energie.de",
      website: "www.arvernus-energie.de",
      primaryColor: "#1565C0",
      secondaryColor: "#F57C00",
    } as CompanyData);

  const styles = getPdfStyles(company.primaryColor, company.secondaryColor);

  // Convert photos to base64 data URIs
  const photoUrls: Record<string, string> = {};
  for (const section of project.sections) {
    for (const photo of section.photos) {
      try {
        const buffer = await getFileBuffer(photo.storagePath);
        const base64 = buffer.toString("base64");
        photoUrls[photo.id] = `data:${photo.mimeType};base64,${base64}`;
      } catch {
        // Skip missing photos
      }
    }
  }

  const sectionHtmls: string[] = [];

  for (const section of project.sections) {
    const html = renderSection(section, project, company, photoUrls);
    sectionHtmls.push(html);
  }

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <style>${styles}</style>
</head>
<body>
  ${sectionHtmls.join("\n")}
</body>
</html>`;
}

// ─── Page header (gray bar — for pages 2+) ───

function pageHeader(project: ProjectData, company: CompanyData): string {
  const logoSrc = getLogoBase64();
  const logoHtml = logoSrc
    ? `<img src="${logoSrc}" alt="${esc(company.name)}" class="header-logo" />`
    : `<span class="logo-text">${esc(company.name)}</span>`;

  return `<div class="page-header">
    <div>${logoHtml}</div>
    <div class="meta">
      <div><span class="meta-label">Auftraggeber/in</span>&nbsp;&nbsp;<span class="meta-value">${esc(project.client.firstName)} ${esc(project.client.lastName)}</span></div>
      <div><span class="meta-label">Kundennummer</span>&nbsp;&nbsp;<span class="meta-value">${esc(project.client.customerNumber)}</span></div>
    </div>
  </div>`;
}

function sectionTitleBlock(title: string): string {
  return `<div class="section-title">${esc(title)}</div>
  <div class="section-title-line"></div>`;
}

// ─── Section renderer ───

function renderSection(
  section: ProjectData["sections"][0],
  project: ProjectData,
  company: CompanyData,
  photoUrls: Record<string, string>
): string {
  const data = (section.data as Record<string, unknown>) || {};
  const photos = section.photos;
  const header = pageHeader(project, company);

  switch (section.type) {
    case "TITLE_PAGE":
      return renderTitlePage(project, company, data, header);

    case "INSTALLATION_PROCESS":
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Ablauf Ihrer Installation")}
        <p style="font-size:10pt;color:#444;margin-bottom:10px;">Im Folgenden haben wir den typischen Ablauf einer Installation für Sie dargestellt. In Einzelfällen kann es vorkommen, dass Termine parallel stattfinden oder vorgezogen sind.</p>

        <div class="phase-timeline">
          <div class="timeline-step">
            <div class="timeline-circle">1</div>
            <div class="timeline-label">${esc(str(data.phase1Title, "Fundamentarbeiten"))}</div>
          </div>
          <div class="timeline-connector"></div>
          <div class="timeline-step">
            <div class="timeline-circle">2</div>
            <div class="timeline-label">${esc(str(data.phase2Title, "Elektrikarbeiten"))}</div>
          </div>
          <div class="timeline-connector"></div>
          <div class="timeline-step">
            <div class="timeline-circle">3</div>
            <div class="timeline-label">${esc(str(data.phase3Title, "Installation"))}</div>
          </div>
        </div>

        <div class="phase-section">
          <div class="phase-heading">
            <div class="phase-icon">${ICONS.hardHat(28, company.primaryColor)}</div>
            <div>
              <span class="phase-name">${esc(str(data.phase1Title, "Fundamentarbeiten"))}</span>
              <span class="phase-duration"> ${esc(str(data.phase1Duration, "(ca. 1–2 Arbeitstage)"))}</span>
            </div>
          </div>
          <p class="phase-text">${esc(str(data.phase1Description, "Wir erstellen das Fundament für die Außeneinheit Ihrer Wärmepumpe, führen die Kernbohrung durch und verlegen alle Rohre und Leitungen bis zum Heizungsraum und Zählerschrank. Dort installieren wir den Steuerschrank für Ihre Wärmepumpe."))}</p>
          ${str(data.phase1Important) ? `<div class="callout-box"><span class="callout-label">Wichtig:</span> ${esc(str(data.phase1Important))}</div>` : `<div class="callout-box"><span class="callout-label">Wichtig:</span> Es gibt währenddessen <strong>keine Einschränkungen</strong> für Ihre Strom- und Heizversorgung.</div>`}
        </div>

        <div class="phase-section">
          <div class="phase-heading">
            <div class="phase-icon">${ICONS.lightning(28, company.primaryColor)}</div>
            <div>
              <span class="phase-name">${esc(str(data.phase2Title, "Elektrikarbeiten"))}</span>
              <span class="phase-duration"> ${esc(str(data.phase2Duration, "(i. d. R. ca. 0,5 Arbeitstage)"))}</span>
            </div>
          </div>
          <p class="phase-text">${esc(str(data.phase2Description, "Wir stellen die Installation für den neuen Steuerschrank fertig, der das intelligente Steuerungsmodul für Ihren Energiemanager enthält. Zudem verbinden wir den Steuerschrank mit Ihrem Zählerschrank."))}</p>
          ${str(data.phase2Important) ? `<div class="callout-box"><span class="callout-label">Wichtig:</span> ${esc(str(data.phase2Important))}</div>` : `<div class="callout-box"><span class="callout-label">Wichtig:</span> Ihre Stromversorgung ist hier <strong>temporär unterbrochen</strong> (wenige Stunden abhängig vom Umfang der Arbeiten).</div>`}
        </div>

        <div class="phase-section">
          <div class="phase-heading">
            <div class="phase-icon">${ICONS.gearSix(28, company.primaryColor)}</div>
            <div>
              <span class="phase-name">${esc(str(data.phase3Title, "Installation & Inbetriebnahme"))}</span>
              <span class="phase-duration"> ${esc(str(data.phase3Duration, "(ca. 2–4 Arbeitstage)"))}</span>
            </div>
          </div>
          <p class="phase-text">${esc(str(data.phase3Description, "Wir demontieren Ihre alte Heizung und installieren Ihre neue Inneneinheit samt Steuereinheit und Speicher. Die Außeneinheit wird auf das Fundament gesetzt. Ein hydraulischer Abgleich sorgt für eine gleichmäßige Wärmeverteilung."))}</p>
          ${str(data.phase3Important) ? `<div class="callout-box"><span class="callout-label">Wichtig:</span> ${esc(str(data.phase3Important))}</div>` : `<div class="callout-box"><span class="callout-label">Wichtig:</span> Während dieses Einsatzes gibt es eine <strong>mehrtägige Unterbrechung</strong> Ihrer Heizversorgung.</div>`}
        </div>

        ${renderNotes(str(data.notes))}
      </div>`;

    case "CLIENT_PREPARATION":
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Ihre Vorbereitungen für die Installation")}
        <p style="font-size:10pt;color:#444;margin-bottom:16px;">Ihre Mitwirkung ist wichtig, damit die Installation effizient und erfolgreich ablaufen kann.</p>

        <div class="info-card">
          <div class="card-heading">
            <span class="card-icon">${ICONS.broom(28, company.primaryColor)}</span>
            <span class="card-title">Frei geräumte Aufstellorte</span>
          </div>
          <p class="card-text">${esc(str(data.clearAreaText, "Die mit Ihnen abgestimmten Aufstellorte müssen für die Einsätze komplett freigeräumt sein (z. B. für Außeneinheit, Inneneinheit, Steuerschrank der Wärmepumpe). Ggf. müssen Sie dafür Gegenstände oder Möbelstücke wegräumen."))}</p>
        </div>

        <div class="info-card">
          <div class="card-heading">
            <span class="card-icon">${ICONS.warning(28, company.primaryColor)}</span>
            <span class="card-title">Freier Zugang zu allen Arbeitsorten, inkl. Transportwegen</span>
          </div>
          <p class="card-text">${esc(str(data.accessText, "Bitte stellen Sie sicher, dass unsere Teams möglichst direkt auf alle Aufstellorte und sonstigen Arbeitsorte zugreifen können. Bitte beachten Sie, dass auch die Transportwege zu diesen Orten frei sind (z. B. Treppenhäuser, Gartenwege)."))}</p>
        </div>

        <div class="info-card">
          <div class="card-heading">
            <span class="card-icon">${ICONS.wifiHigh(28, company.primaryColor)}</span>
            <span class="card-title">Vorbereitung des Internetanschlusses</span>
          </div>
          <p class="card-text">${esc(str(data.internetText, "Für die Internetanbindung Ihrer Wärmepumpe wird eine kabelgebundene Internetverbindung benötigt (LAN). Stellen Sie bitte vorab sicher, dass uns dafür ein freier LAN-Anschluss an Ihrem Internetrouter zur Verfügung steht."))}</p>
          ${str(data.internetHint) ? `<p class="card-text" style="margin-top:8px;"><span class="hint-label">Hinweis:</span> ${esc(str(data.internetHint))}</p>` : ""}
        </div>

        ${renderNotes(str(data.notes))}
      </div>`;

    case "TECHNICAL_PLANNING":
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Technische Planung")}
        <table class="spec-table">
          ${specRow("Modell", data.heatPumpModel)}
          ${specRow("Hersteller", data.manufacturer)}
          ${specRow("Heizleistung", data.heatingCapacity, "kW")}
          ${specRow("Kühlleistung", data.coolingCapacity, "kW")}
          ${specRow("Vorlauftemperatur", data.flowTemperature, "°C")}
          ${specRow("Rücklauftemperatur", data.returnTemperature, "°C")}
          ${specRow("Kältemittel", data.refrigerant)}
          ${specRow("Schallleistungspegel", data.soundPowerLevel, "dB(A)")}
          ${specRow("COP", data.cop)}
        </table>
        ${renderPhotos(photos, photoUrls)}
        ${renderNotes(str(data.notes))}
      </div>`;

    case "INSTALLATION_SITE":
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Aufstellort")}
        <table class="spec-table">
          ${specRow("Fundamenttyp", data.foundationType)}
          ${specRow("Untergrund", data.surfaceType)}
          ${specRow("Abstand zur Hauswand", data.distanceToWall, "cm")}
          ${specRow("Abstand zum Nachbarn", data.distanceToNeighbor, "m")}
          ${specRow("Lichte Höhe", data.clearanceHeight, "cm")}
        </table>
        ${renderPhotos(photos, photoUrls)}
        ${str(data.requirements) ? `<div class="content-block"><h3>Anforderungen</h3><p>${esc(str(data.requirements))}</p></div>` : ""}
        ${renderNotes(str(data.notes))}
      </div>`;

    case "EXISTING_SYSTEM":
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Bestandsanlage")}

        <div class="info-card">
          <div class="card-heading">
            <span class="card-icon">${ICONS.trash(28, company.primaryColor)}</span>
            <span class="card-title">Hinweis zur Entsorgung Ihrer Altanlage</span>
          </div>
          <p class="card-text">${esc(str(data.disposalNotes, "Wann Ihre alte Heizung im Prozess ausgebaut und entsorgt wird, ist abhängig vom Typ der Anlage und von Ihrem Angebotsumfang."))}</p>
          <ul class="bullet-list" style="margin-top:10px;">
            <li><strong>Bei Gasheizungen:</strong> Gewöhnlich während des Einsatzes "Installation &amp; Inbetriebnahme".</li>
            <li><strong>Bei Ölheizungen oder Nachtspeicheröfen:</strong> Ggf. früherer Zeitpunkt.</li>
          </ul>
        </div>

        <table class="spec-table">
          ${specRow("Heizungsart", data.currentHeatingType)}
          ${specRow("Entsorgung erforderlich", data.disposalRequired ? "Ja" : "Nein")}
          ${specRow("Solarpanels vorhanden", data.hasSolarPanels ? "Ja" : "Nein")}
          ${specRow("Warmwasserbereitung", data.hotWaterSystem)}
        </table>
        ${renderPhotos(photos, photoUrls)}
        ${renderNotes(str(data.notes))}
      </div>`;

    case "HEATING_CIRCUITS": {
      const circuits = (data.circuits as Array<Record<string, string>>) || [];
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Heizkreise")}
        ${data.totalCircuits ? `<p style="margin-bottom:14px;font-size:10pt;">Gesamtanzahl Heizkreise: <strong>${data.totalCircuits}</strong></p>` : ""}
        ${circuits.length > 0
          ? `<table class="circuit-table">
            <tr><th>#</th><th>Etage</th><th>Raum</th><th>Typ</th><th>Modell</th><th>Leistung</th></tr>
            ${circuits.map((c, i) => `<tr>
              <td>${i + 1}</td>
              <td>${esc(c.floor || "")}</td>
              <td>${esc(c.room || "")}</td>
              <td>${esc(c.radiatorType || "")}</td>
              <td>${esc(c.model || "")}</td>
              <td>${esc(c.power || "")} W</td>
            </tr>`).join("")}
          </table>`
          : ""}
        ${renderPhotos(photos, photoUrls)}
        ${renderNotes(str(data.notes))}
      </div>`;
    }

    case "HYDRAULICS":
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Hydraulik")}
        <table class="spec-table">
          ${specRow("Inneneinheit", data.indoorUnitType)}
          ${specRow("Pufferspeicher", data.bufferTankVolume, "Liter")}
          ${specRow("Warmwasserspeicher", data.hotWaterTankVolume, "Liter")}
        </table>
        ${renderPhotos(photos, photoUrls)}
        ${renderNotes(str(data.notes))}
      </div>`;

    case "PIPING":
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Rohrleitungen")}
        <table class="spec-table">
          ${specRow("Wanddurchbrüche", data.wallPenetrations)}
          ${specRow("Deckendurchbrüche", data.floorPenetrations)}
          ${specRow("Rohrleitungslänge", data.pipeLength, "m")}
          ${specRow("Isolierung", data.insulationType)}
        </table>
        ${renderPhotos(photos, photoUrls)}
        ${renderNotes(str(data.notes))}
      </div>`;

    case "ELECTRICAL_PLANNING":
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Elektroplanung")}
        <table class="spec-table">
          ${specRow("Hauptsicherung", data.mainFuseSize)}
          ${specRow("PV-Anlage", data.hasPvSystem ? "Ja" : "Nein")}
          ${data.hasPvSystem ? specRow("PV-Leistung", data.pvSystemSize, "kWp") : ""}
          ${data.hasPvSystem ? specRow("Wechselrichter", data.inverterType) : ""}
          ${specRow("Batteriespeicher", data.batteryStorage ? "Ja" : "Nein")}
          ${data.batteryStorage ? specRow("Kapazität", data.batteryCapacity, "kWh") : ""}
        </table>
        ${renderPhotos(photos, photoUrls)}
        ${renderNotes(str(data.notes))}
      </div>`;

    case "TARIFF_METER":
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Tarif & Zähler")}
        <table class="spec-table">
          ${specRow("Tarifart", data.tariffType)}
          ${specRow("Zählernummer", data.meterNumber)}
          ${specRow("Zählerstandort", data.meterLocation)}
        </table>
        ${renderPhotos(photos, photoUrls)}
        ${renderNotes(str(data.notes))}
      </div>`;

    case "PANEL_REPLACEMENT":
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Zählerschrank")}
        <table class="spec-table">
          ${specRow("Tausch erforderlich", data.replacementRequired ? "Ja" : "Nein")}
          ${data.replacementRequired ? specRow("Neuer Standort", data.newPanelLocation) : ""}
        </table>
        ${str(data.instructions) ? `<div class="info-card"><div class="card-heading"><span class="card-icon">${ICONS.clipboardText(28, company.primaryColor)}</span><span class="card-title">Anweisungen</span></div><p class="card-text">${esc(str(data.instructions))}</p></div>` : ""}
        ${renderPhotos(photos, photoUrls)}
        ${renderNotes(str(data.notes))}
      </div>`;

    case "CABLE_ROUTES":
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Kabelwege")}
        <table class="spec-table">
          ${specRow("Kabellänge", data.cableLength, "m")}
        </table>
        ${str(data.routeDescription) ? `<div class="content-block"><h3>Beschreibung der Kabelführung</h3><p>${esc(str(data.routeDescription))}</p></div>` : ""}
        ${renderPhotos(photos, photoUrls)}
        ${renderNotes(str(data.notes))}
      </div>`;

    case "CONTROL_CABINET":
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Steuerschrank")}
        <table class="spec-table">
          ${specRow("Typ", data.cabinetType)}
          ${specRow("Maße", data.dimensions)}
          ${specRow("Standort", data.location)}
        </table>
        ${renderPhotos(photos, photoUrls)}
        ${renderNotes(str(data.notes))}
      </div>`;

    case "ADDITIONAL_EQUIPMENT":
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Zusatzausstattung")}
        <table class="spec-table">
          ${specRow("Lagerort", data.storageLocation)}
        </table>
        ${str(data.equipmentList) ? `<div class="content-block"><h3>Ausstattungsliste</h3><p>${esc(str(data.equipmentList))}</p></div>` : ""}
        ${renderPhotos(photos, photoUrls)}
        ${renderNotes(str(data.notes))}
      </div>`;

    case "CONSENT":
      return `<div class="page">
        ${header}
        ${sectionTitleBlock("Einverständniserklärung")}
        <div class="content-block">
          <p>Hiermit bestätige ich, dass alle Angaben im vorliegenden Installationsplan
          korrekt sind und die Installationsarbeiten wie beschrieben durchgeführt werden können.</p>
          <p style="margin-top:8px;">Wir bitten Sie deshalb um eine genaue Prüfung und Ihr Einverständnis.</p>
        </div>
        <div class="signature-area">
          <p><strong>Datum:</strong> ${esc(str(data.signatureDate, "_______________"))}</p>
          <div class="signature-line"></div>
          <p class="signature-label">Unterschrift Kunde</p>
          <div style="margin-top:30px">
            <div class="signature-line"></div>
            <p class="signature-label">Unterschrift Techniker</p>
          </div>
        </div>
        ${renderNotes(str(data.notes))}
      </div>`;

    default:
      return `<div class="page">
        ${header}
        ${sectionTitleBlock(SECTION_LABELS[section.type] || "Abschnitt")}
        ${renderPhotos(photos, photoUrls)}
        ${renderNotes(str(data.notes))}
      </div>`;
  }
}

// ─── Title page ───

function renderTitlePage(
  project: ProjectData,
  company: CompanyData,
  data: Record<string, unknown>,
  header: string
): string {
  const dateStr = project.installationDate
    ? new Date(project.installationDate).toLocaleDateString("de-DE")
    : new Date().toLocaleDateString("de-DE");

  return `<div class="page title-page">
    ${header}
    <div class="company-line">${esc(company.name)} | ${esc(company.street)} | ${esc(company.postalCode)} ${esc(company.city)}</div>

    <div class="address-block">
      <div class="label">Auftraggeber/in</div>
      <p>${esc(project.client.salutation || "")} ${esc(project.client.firstName)} ${esc(project.client.lastName)}</p>
      <p>${esc(project.client.street)} ${esc(project.client.houseNumber)}</p>
      <p>${esc(project.client.postalCode)} ${esc(project.client.city)}</p>
    </div>

    <div class="address-block">
      <div class="label">Objekt</div>
      <p>${esc(project.street)} ${esc(project.houseNumber)}</p>
      <p>${esc(project.postalCode)} ${esc(project.city)}</p>
    </div>

    <div class="date-right">${esc(company.city)}, ${dateStr}</div>

    <div class="doc-title">${esc(str(data.projectTitle, "Ihr Installationsplan"))}</div>
    <div class="section-title-line"></div>

    <p class="intro-text">Wir freuen uns, Ihnen die Ergebnisse der technischen Feinplanung zu übergeben. Unsere Elektro- und SHK-Meister haben diese für Ihr Bauprojekt durchgeführt.</p>

    <p class="intro-text">Basierend auf den Informationen aus der technischen Datenaufnahme haben wir die optimale Auslegung Ihrer Wärmepumpe berechnet. Diese ist unter anderem relevant für die Größe bzw. Leistung Ihrer Wärmepumpe. Zudem haben wir Details zur Umsetzung der Installation festgelegt, beispielsweise die Aufstellorte von Außen- und Inneneinheit, die Position der Hauseinführung sowie die Rohr- und Kabelführung.</p>

    <p class="intro-text">Unsere Erfahrung zeigt: Mit einer guten Planung ist die Grundlage für eine erfolgreiche Umsetzung Ihres Bauprojekts geschaffen. Wir bitten Sie deshalb um eine genaue Prüfung und Ihr Einverständnis.</p>
  </div>`;
}

// ─── Helpers ───

function renderPhotos(
  photos: Array<{ id: string; caption: string | null }>,
  urls: Record<string, string>
): string {
  if (photos.length === 0) return "";

  if (photos.length === 1) {
    const p = photos[0];
    const url = urls[p.id];
    if (!url) return "";
    return `<div class="photo-full">
      <img src="${url}" alt="${esc(p.caption || "Foto")}" />
      ${p.caption ? `<div class="photo-caption">${esc(p.caption)}</div>` : ""}
    </div>`;
  }

  return `<div class="photo-grid">
    ${photos
      .filter((p) => urls[p.id])
      .map(
        (p) => `<div class="photo-container">
        <img src="${urls[p.id]}" alt="${esc(p.caption || "Foto")}" />
        ${p.caption ? `<div class="photo-caption">${esc(p.caption)}</div>` : ""}
      </div>`
      )
      .join("")}
  </div>`;
}

function renderNotes(notes: string): string {
  if (!notes) return "";
  return `<div class="notes-block">${esc(notes)}</div>`;
}

function specRow(label: string, value: unknown, unit?: string): string {
  if (!value && value !== 0) return "";
  const display = unit ? `${value} ${unit}` : String(value);
  return `<tr><td class="key">${esc(label)}</td><td class="value">${esc(display)}</td></tr>`;
}

function str(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  return fallback;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
