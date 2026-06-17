/** Shape of a lead as listed on the OBI Partnercenter project grid. */
export interface ObiListItem {
  /** Stable lead code, e.g. "DE096126L31435_2" — used as Client.externalId. */
  externalId: string;
  /** Raw display name, e.g. "Frau Almoustafa, Majd". */
  rawName: string;
  /** Phone as shown (tel: href stripped of scheme), e.g. "015780997381". */
  phone: string;
  /** Status badge text, e.g. "Neues Projekt". */
  status: string;
  /** Relative age text, e.g. "Seit Gestern". */
  ageText: string;
  /** 1-based list page the card was found on (for re-navigation when opening details). */
  pageNum?: number;
}

/** Fully-resolved lead after opening its detail page. */
export interface ObiLead {
  externalId: string;
  salutation: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  /** Free-text request, e.g. "Wärmepumpe beraten, verkaufen und installieren". */
  anfrage: string;
  status: string;
}
