export const DEFAULT_SERVICE_ITEMS: string[] = [
  "Rüstzeit",
  "Kernbohrung für Wärmepumpe und Klimageräte",
  "Montage des Hydro-Innengerätes / Heizstab an der ausgewählten Position",
  "Montage des Außengerätes an der ausgewählten Position",
  "Verlegung der Leitungen von Hydrobox / Heizstab bis zum Außengerät",
  "Verlegung der Leitungen von Hydrobox / Heizstab bis zum Brauchwasserspeicher",
  "Verlegung der Zuleitung vom Zählerschrank bis zur Hydrobox / Heizstab, Außengerät, Brauchwasserspeicher",
  "Herstellung Fußbodenheizung",
  "Drucktest der Leitungen",
  "Anschluss der Heizkörper / Abfuhr",
  "Verklemmen aller benötigten Leitungen im Zählerschrank",
  "Förderanfrage durch einen zertifizierten Energieberater vor der Montage bei der KfW (Programm 458)",
  "Anmeldung der Anlage nach Inbetriebnahme",
  "Erstellung der Dokumentation",
];

export function parseServiceItems(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  return items.length > 0 ? items : [];
}
