import { MessageCircle } from "lucide-react";
import { getSetting } from "@/lib/settings";

/**
 * Floating WhatsApp enquiry button. Rendered only when a WhatsApp number has
 * been configured in Admin → Settings → Contact.
 */
export function WhatsAppFloat() {
  const raw = getSetting("whatsapp_number", "").replace(/\D/g, "");
  if (!raw) return null;
  const number = raw.length === 12 && raw.startsWith("91") ? raw : raw.length === 10 ? `91${raw}` : raw;

  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent("Hello, I would like to know more about admissions at Aarohan Institute.")}`}
      target="_blank"
      rel="noreferrer noopener"
      className="fixed bottom-5 left-5 z-40 inline-flex h-13 items-center gap-2 rounded-full bg-[#1f9d55] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-14px_rgba(31,157,85,0.9)] transition hover:bg-[#178046] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55] no-print"
      aria-label="Chat with the admission team on WhatsApp"
    >
      <MessageCircle className="h-5 w-5" aria-hidden />
      <span className="hidden sm:inline">Chat on WhatsApp</span>
    </a>
  );
}
