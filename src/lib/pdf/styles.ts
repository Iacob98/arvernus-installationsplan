export function getPdfStyles(primaryColor: string, secondaryColor: string): string {
  return `
    @page {
      size: A4;
      margin: 15mm 15mm 30mm 15mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #333;
    }

    .page {
      page-break-after: always;
      position: relative;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* ===== HEADER BAR (thermondo style) ===== */
    .page-header {
      background: #f5f5f5;
      margin: 0 -15mm 30px -15mm;
      padding: 14px 15mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-header .header-logo {
      height: 32px;
      width: auto;
    }

    .page-header .logo-text {
      font-weight: bold;
      font-size: 14pt;
      color: ${primaryColor};
    }

    .page-header .meta {
      display: flex;
      gap: 24px;
      font-size: 9pt;
      color: #555;
    }

    .page-header .meta-label {
      color: #888;
    }

    .page-header .meta-value {
      font-weight: 500;
      color: #333;
    }

    /* ===== FOOTER ===== */
    .page-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px 15mm 8px;
      border-top: 1px solid #ddd;
    }

    .page-footer .page-number {
      text-align: center;
      font-size: 8pt;
      color: #888;
      margin-bottom: 8px;
    }

    .footer-columns {
      display: flex;
      justify-content: space-between;
      font-size: 7pt;
      color: #999;
      line-height: 1.5;
    }

    .footer-columns div {
      flex: 1;
    }

    .footer-columns div:nth-child(2) {
      text-align: center;
    }

    .footer-columns div:nth-child(3) {
      text-align: right;
    }

    /* ===== SECTION TITLE (gradient underline) ===== */
    .section-title {
      font-size: 18pt;
      font-weight: bold;
      color: #222;
      margin-bottom: 4px;
      padding-bottom: 0;
    }

    .section-title-line {
      height: 4px;
      background: linear-gradient(90deg, ${primaryColor}, ${secondaryColor}, #7B1FA2);
      border-radius: 2px;
      margin-bottom: 20px;
    }

    /* ===== TITLE PAGE (page 1) ===== */
    .title-page .company-line {
      font-size: 8.5pt;
      color: #666;
      margin-bottom: 40px;
    }

    .title-page .address-block {
      margin-bottom: 24px;
    }

    .title-page .address-block .label {
      font-weight: bold;
      font-size: 10pt;
      color: #333;
      margin-bottom: 2px;
    }

    .title-page .address-block p {
      font-size: 10pt;
      color: #444;
      line-height: 1.5;
    }

    .title-page .date-right {
      text-align: right;
      font-size: 10pt;
      color: #444;
      margin-bottom: 40px;
    }

    .title-page .doc-title {
      font-size: 22pt;
      font-weight: bold;
      color: #222;
      margin-bottom: 4px;
    }

    .title-page .intro-text {
      font-size: 10pt;
      color: #444;
      line-height: 1.7;
      margin-bottom: 16px;
    }

    .title-page .title-logo {
      height: 50px;
      width: auto;
      margin-bottom: 40px;
    }

    /* ===== PHASE TIMELINE ===== */
    .phase-timeline {
      display: flex;
      align-items: center;
      margin: 24px 0;
      padding: 0 10px;
    }

    .timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
    }

    .timeline-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${primaryColor};
      color: white;
      font-weight: 700;
      font-size: 13pt;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .timeline-label {
      margin-top: 6px;
      font-size: 8.5pt;
      font-weight: 600;
      color: #444;
      text-align: center;
      max-width: 120px;
    }

    .timeline-connector {
      flex: 1;
      height: 3px;
      background: ${primaryColor};
      margin: 0 4px;
      margin-bottom: 22px;
      border-radius: 2px;
    }

    /* ===== PHASE DESCRIPTION BLOCK ===== */
    .phase-section {
      margin: 28px 0;
    }

    .phase-section .phase-heading {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .phase-section .phase-icon {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .phase-section .phase-name {
      font-size: 12pt;
      font-weight: bold;
      color: #222;
    }

    .phase-section .phase-duration {
      font-weight: normal;
      color: #666;
      font-size: 10pt;
    }

    .phase-section .phase-text {
      font-size: 10pt;
      color: #444;
      line-height: 1.7;
      margin-bottom: 12px;
    }

    /* ===== WICHTIG CALLOUT BOX ===== */
    .callout-box {
      background: #f5f5f5;
      border-radius: 6px;
      padding: 14px 18px;
      margin: 14px 0;
      font-size: 9.5pt;
      line-height: 1.6;
      color: #444;
    }

    .callout-box .callout-label {
      color: ${primaryColor};
      font-weight: bold;
    }

    .callout-box strong {
      font-weight: 700;
    }

    /* ===== INFO CARDS (preparation page) ===== */
    .info-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
    }

    .info-card .card-heading {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .info-card .card-icon {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .info-card .card-title {
      font-size: 12pt;
      font-weight: bold;
      color: #222;
    }

    .info-card .card-text {
      font-size: 9.5pt;
      color: #444;
      line-height: 1.7;
    }

    .info-card .card-text .hint-label {
      font-weight: bold;
      color: #333;
    }

    /* ===== SPEC TABLE (key-value) ===== */
    .spec-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }

    .spec-table td {
      padding: 8px 14px;
      border-bottom: 1px solid #eee;
      font-size: 9.5pt;
    }

    .spec-table .key {
      font-weight: 600;
      width: 45%;
      color: #555;
    }

    .spec-table .value {
      color: #222;
    }

    .spec-table tr:last-child td {
      border-bottom: none;
    }

    /* ===== DATA TABLE ===== */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9pt;
    }

    .data-table th {
      background: ${primaryColor};
      color: white;
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
    }

    .data-table td {
      padding: 6px 12px;
      border-bottom: 1px solid #eee;
    }

    .data-table tr:nth-child(even) td {
      background: #f9f9f9;
    }

    /* ===== CIRCUIT TABLE ===== */
    .circuit-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 8.5pt;
    }

    .circuit-table th {
      background: ${primaryColor};
      color: white;
      padding: 6px 10px;
      text-align: left;
    }

    .circuit-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #eee;
    }

    .circuit-table tr:nth-child(even) td {
      background: #f9f9f9;
    }

    .circuit-photo {
      width: 80px;
      height: 60px;
      object-fit: cover;
      border-radius: 3px;
    }

    /* ===== PHOTOS ===== */
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 16px 0;
    }

    .photo-container {
      border: 1px solid #ddd;
      border-radius: 6px;
      overflow: hidden;
    }

    .photo-container img {
      width: 100%;
      height: auto;
      display: block;
    }

    .photo-caption {
      padding: 6px 10px;
      font-size: 8pt;
      color: #666;
      background: #f9f9f9;
    }

    .photo-full {
      width: 100%;
      margin: 16px 0;
      border: 1px solid #ddd;
      border-radius: 6px;
      overflow: hidden;
    }

    .photo-full img {
      width: 100%;
      height: auto;
      display: block;
    }

    /* ===== CHECKLIST ===== */
    .checklist {
      margin: 14px 0;
    }

    .checklist-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 0;
      font-size: 9.5pt;
    }

    .check-icon {
      width: 18px;
      height: 18px;
      border: 2px solid ${primaryColor};
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11pt;
      color: ${primaryColor};
      flex-shrink: 0;
    }

    .check-icon.checked {
      background: ${primaryColor};
      color: white;
    }

    /* ===== CONTENT BLOCKS ===== */
    .content-block {
      margin: 18px 0;
    }

    .content-block h3 {
      font-size: 11pt;
      color: #333;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .content-block p {
      font-size: 9.5pt;
      line-height: 1.7;
      color: #444;
    }

    /* ===== SIGNATURE ===== */
    .signature-area {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }

    .signature-line {
      border-bottom: 1px solid #333;
      width: 260px;
      height: 60px;
      margin-top: 30px;
    }

    .signature-label {
      font-size: 8pt;
      color: #666;
      margin-top: 4px;
    }

    /* ===== NOTES ===== */
    .notes-block {
      margin-top: 14px;
      padding: 12px 16px;
      background: #f5f5f5;
      border-radius: 6px;
      font-size: 8.5pt;
      color: #666;
      font-style: italic;
      line-height: 1.6;
    }

    /* ===== BULLET LIST ===== */
    .bullet-list {
      margin: 10px 0;
      padding-left: 16px;
    }

    .bullet-list li {
      font-size: 9.5pt;
      color: #444;
      line-height: 1.7;
      margin-bottom: 4px;
    }

    .bullet-list li strong {
      color: #333;
    }
  `;
}
