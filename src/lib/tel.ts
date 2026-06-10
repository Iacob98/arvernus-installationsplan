/**
 * Normalises a free-form phone string into a value usable in a `tel:` URI.
 * Strips spaces, dashes, parentheses, slashes and any other non-dialable
 * characters; keeps the leading `+` for international numbers.
 *
 * "+49 30 / 123 4567" → "+493012347567" → wrapped as "tel:+493012347567"
 */
export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const leadingPlus = trimmed.startsWith("+") ? "+" : "";
  const digits = trimmed.replace(/\D+/g, "");
  if (!digits) return null;
  return `tel:${leadingPlus}${digits}`;
}
