import Link from "next/link";
import { Mail, MapPin, Phone, Clock, ArrowUpRight } from "lucide-react";
import { FacebookIcon, InstagramIcon, LinkedInIcon, YouTubeIcon } from "@/components/ui/social-icons";
import { getSetting } from "@/lib/settings";
import { getDb } from "@/lib/db";
import { NewsletterForm } from "./newsletter-form";

const QUICK_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Courses & Programmes", href: "/courses" },
  { label: "Faculty Directory", href: "/faculty" },
  { label: "Campus Life", href: "/campus-life" },
  { label: "News & Events", href: "/news" },
  { label: "Contact Us", href: "/contact" },
];

const ADMISSION_LINKS = [
  { label: "Admission overview", href: "/admissions" },
  { label: "Apply online", href: "/admissions/apply" },
  { label: "Track application", href: "/admissions/track" },
  { label: "Eligibility & important dates", href: "/admissions#dates" },
  { label: "Scholarships & financial aid", href: "/scholarships" },
  { label: "Admission FAQs", href: "/faqs" },
  { label: "Downloads & prospectus", href: "/downloads" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Accessibility", href: "/accessibility" },
];

function safeDepartments() {
  try {
    return getDb()
      .prepare(`SELECT name, slug FROM departments WHERE visibility = 'published' ORDER BY sort_order, name`)
      .all() as { name: string; slug: string }[];
  } catch {
    return [];
  }
}

export function SiteFooter() {
  const instituteName = getSetting("institute_name");
  const shortName = getSetting("short_name");
  const address = getSetting("address");
  const helpline = getSetting("admission_helpline");
  const admissionEmail = getSetting("admission_email");
  const generalEmail = getSetting("general_email");
  const officeHours = getSetting("office_hours");
  const disclaimer = getSetting("footer_note");
  const departments = safeDepartments();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="border-b border-white/10">
        <div className="container-page grid gap-8 py-10 md:grid-cols-2 md:items-center lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Admissions 2027–28</p>
            <h2 className="mt-3 text-2xl font-extrabold leading-snug md:text-3xl">
              Start your application — it takes less than ten minutes.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
              Explore programmes, submit an enquiry or complete the full online application. You will receive a
              reference number you can use to track every update.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/courses" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10 hover:!text-white">
              Explore Courses
            </Link>
            <Link href="/admissions/apply" className="btn btn-gold">
              Apply for Admission
            </Link>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sm font-extrabold text-gold">
              {getSetting("logo_text", "AIHE")}
            </span>
            <span className="font-display text-lg font-semibold leading-tight">{shortName}</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            {instituteName} is a modern private institute offering undergraduate, postgraduate, diploma and
            professional programmes across six academic schools.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {[
              { icon: LinkedInIcon, label: "LinkedIn", href: "https://www.linkedin.com" },
              { icon: InstagramIcon, label: "Instagram", href: "https://www.instagram.com" },
              { icon: FacebookIcon, label: "Facebook", href: "https://www.facebook.com" },
              { icon: YouTubeIcon, label: "YouTube", href: "https://www.youtube.com" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/70 transition hover:border-gold hover:text-gold"
              >
                <social.icon className="h-4 w-4" aria-hidden />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Quick links">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gold">Quick Links</h3>
          <ul className="mt-4 space-y-2.5">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/70 transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Academic departments">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gold">Departments</h3>
          <ul className="mt-4 space-y-2.5">
            {departments.map((department) => (
              <li key={department.slug}>
                <Link href={`/academics#${department.slug}`} className="text-sm text-white/70 transition hover:text-white">
                  {department.name.replace("School of ", "")}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/placements" className="text-sm text-white/70 transition hover:text-white">
                Placements & Career Services
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gold">Admissions</h3>
          <ul className="mt-4 space-y-2.5">
            {ADMISSION_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/70 transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page grid gap-8 py-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gold">Campus</h3>
              <address className="mt-3 flex gap-3 text-sm not-italic leading-relaxed text-white/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                <span>{address}</span>
              </address>
              <div className="mt-3 space-y-2 text-sm text-white/70">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gold" aria-hidden />
                  <a href={`tel:${helpline.replace(/\s/g, "")}`} className="hover:text-white">
                    {helpline}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gold" aria-hidden />
                  <a href={`mailto:${admissionEmail}`} className="break-all hover:text-white">
                    {admissionEmail}
                  </a>
                </p>
                <p className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  <span>{officeHours}</span>
                </p>
              </div>
              <a
                href={`mailto:${generalEmail}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold hover:underline"
              >
                General enquiries: {generalEmail}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gold">Campus Map</h3>
              <div className="mt-3 flex h-40 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-center text-xs leading-relaxed text-white/55">
                Map embed placeholder — add your Google Maps embed URL in
                <span className="mx-1 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-gold">
                  Admin → Settings → Contact
                </span>
                to render the live campus map here.
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gold">Newsletter</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Admission deadlines, events and notices — one concise email each month.
            </p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
            <p className="mt-4 text-xs text-white/45">
              We store your email only to send institute updates. You can unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0f2138]">
        <div className="container-page flex flex-col gap-4 py-5 text-xs text-white/55 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {instituteName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-white">
                {link.label}
              </Link>
            ))}
            <Link href="/portal" className="transition hover:text-white">
              Student Portal
            </Link>
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="container-page py-4 text-[11px] leading-relaxed text-white/40">
            {disclaimer} Built as a demonstration product by Agentiva — web development, admission CRM and business
            automation for educational institutes.
          </div>
        </div>
      </div>
    </footer>
  );
}
