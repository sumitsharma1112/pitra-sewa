/**
 * Public business details come from environment variables for now and will
 * move to admin-editable settings (database) in Stage 4. Nothing here is
 * hardcoded: if a value is missing, the UI hides that contact method.
 *
 * Read on the server only (these are not NEXT_PUBLIC_ variables).
 */
const clean = (value: string | undefined) => {
  const v = value?.trim();
  return v ? v : undefined;
};

/** wa.me needs the full international number as digits only, e.g. 9198XXXXXXXX. */
const toWhatsAppDigits = (value: string | undefined) => {
  const digits = value?.replace(/\D/g, "");
  return digits && digits.length >= 10 && digits.length <= 15 ? digits : undefined;
};

export type ContactConfig = {
  phone?: string;
  email?: string;
  address?: string;
  whatsappDigits?: string;
};

export function getContactConfig(): ContactConfig {
  return {
    phone: clean(process.env.CONTACT_PHONE),
    email: clean(process.env.CONTACT_EMAIL),
    address: clean(process.env.CONTACT_ADDRESS),
    whatsappDigits: toWhatsAppDigits(process.env.WHATSAPP_NUMBER),
  };
}

export const hasAnyContact = (c: ContactConfig) =>
  Boolean(c.phone || c.email || c.address || c.whatsappDigits);

export const whatsappLink = (digits: string, message: string) =>
  `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

export function getSiteUrl(): URL {
  const raw = clean(process.env.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000";
  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}
