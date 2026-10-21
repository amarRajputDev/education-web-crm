import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  ClipboardList,
  CreditCard,
  KeyRound,
  LifeBuoy,
  Lock,
  LogIn,
  Mail,
  Phone,
  Timer,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Student Portal",
  description:
    "Application tracking, results, attendance and fee payment entry points for Aarohan Institute of Higher Education — demo placeholder.",
};

const PANELS = [
  {
    href: "/admissions/track",
    icon: ClipboardList,
    title: "Track your application",
    text: "Enter your application reference number to see the live review status, document checks and counselling slot.",
    status: "Available",
    action: "Track application",
    live: true,
  },
  {
    href: undefined,
    icon: BarChart3,
    title: "Results & attendance",
    text: "Semester results, attendance percentages and internal assessment records for enrolled students.",
    status: "Coming soon",
    action: null,
    live: false,
  },
  {
    href: undefined,
    icon: CreditCard,
    title: "Fee payment",
    text: "Semester invoices, instalment schedules and downloadable payment receipts in one place.",
    status: "Coming soon",
    action: null,
    live: false,
  },
];

export default function PortalPage() {
  const helpline = getSetting("admission_helpline", "+91 98200 41127");
  const admissionEmail = getSetting("admission_email", "admissions@aarohan-institute.edu");
  const generalEmail = getSetting("general_email", "info@aarohan-institute.edu");
  const officeHours = getSetting("office_hours");
  const telHref = `tel:${helpline.replace(/[^\d+]/g, "")}`;

  return (
    <>
      <PageHeader
        eyebrow="Student Portal"
        title="One sign-in for results, fees and records"
        description="The portal brings application tracking, attendance, results and fee payments together for Aarohan students and applicants."
        breadcrumbs={<Breadcrumbs items={[{ label: "Student Portal" }]} />}
        meta={[
          { label: "Status", value: "Demo" },
          { label: "Applicant tools", value: "1 live" },
          { label: "Student tools", value: "2 soon" },
          { label: "Support", value: "Mon–Sat" },
        ]}
      >
        <a href={telHref} className="btn btn-gold">
          <Phone className="h-4 w-4" aria-hidden />
          {helpline}
        </a>
        <Link href="/contact" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          Contact support
        </Link>
      </PageHeader>

      {/* demo banner */}
      <section className="border-b border-line bg-paper">
        <div className="container-page py-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-dashed border-gold/70 bg-gold-100/60 p-5 sm:flex-row sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-100 text-gold-700">
              <Bell className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-navy">
                Demo placeholder
                <Badge tone="gold">Not connected to live accounts</Badge>
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-body">
                This page previews the portal experience. Sign-in, results and fee payment are not wired up in this
                demonstration — application tracking uses the public tracker and works without an account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* panels */}
      <section id="tools" className="container-page scroll-mt-32 py-16 md:py-24">
        <SectionHeading
          index="01"
          eyebrow="Portal Tools"
          title="What you can do from here"
          description="Applicant tools are live today; student records follow in the next release."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {PANELS.map((panel, index) => (
            <Reveal key={panel.title} delay={index * 70}>
              <article
                className={`flex h-full flex-col rounded-3xl border p-6 transition ${
                  panel.live
                    ? "border-line bg-paper hover:border-royal/40"
                    : "border-dashed border-line-strong bg-offwhite/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      panel.live ? "bg-navy text-gold" : "bg-line/70 text-slate-body"
                    }`}
                  >
                    <panel.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <Badge tone={panel.live ? "success" : "neutral"}>{panel.status}</Badge>
                </div>
                <h3 className="mt-5 text-lg font-bold text-navy">{panel.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-body">{panel.text}</p>
                <div className="mt-5">
                  {panel.live && panel.href ? (
                    <Link href={panel.href} className="btn btn-primary btn-sm w-full">
                      {panel.action}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  ) : (
                    <button type="button" className="btn btn-outline btn-sm w-full" disabled>
                      <Lock className="h-4 w-4" aria-hidden />
                      Coming soon
                    </button>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* disabled sign-in */}
      <section id="sign-in" className="scroll-mt-32 border-y border-line bg-paper py-16 md:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <SectionHeading
              index="02"
              eyebrow="Sign in"
              title="Student sign-in is not connected in this demo"
              description="Real credentials, single sign-on and password reset flows are configured when the portal is connected to the student database."
            />
            <ul className="space-y-3">
              {[
                { icon: KeyRound, text: "Enrolled students will sign in with the institute email issued at admission." },
                { icon: Timer, text: "Session timeouts and multi-device checks follow the institute's security policy." },
                { icon: BadgeCheck, text: "Applicants do not need an account — the reference number tracks an application." },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3 text-sm leading-relaxed text-slate-body">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-royal" aria-hidden />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <Reveal>
            <form className="rounded-[2rem] border border-line bg-offwhite/60 p-7 md:p-8" noValidate>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-gold">
                  <LogIn className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-base font-bold text-navy">Portal sign-in</h3>
                  <p className="text-xs text-slate-body">Preview only — no authentication in this demo.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="portal-email" className="label">
                    Institute email
                  </label>
                  <input
                    id="portal-email"
                    type="email"
                    className="field"
                    placeholder="student@aarohan-institute.edu"
                    autoComplete="username"
                    disabled
                    readOnly
                  />
                </div>
                <div>
                  <label htmlFor="portal-password" className="label">
                    Password
                  </label>
                  <input
                    id="portal-password"
                    type="password"
                    className="field"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled
                    readOnly
                  />
                  <p className="hint mt-1">Minimum 8 characters — reset by email in the live portal.</p>
                </div>
              </div>

              <button type="button" className="btn btn-primary btn-lg mt-6 w-full" disabled>
                <Lock className="h-4 w-4" aria-hidden />
                Sign in (disabled in demo)
              </button>

              <p className="mt-4 rounded-xl border border-line bg-paper p-3 text-xs leading-relaxed text-slate-body">
                This form is intentionally disabled. Nothing you type is sent anywhere — for application status today,
                use the public tracker with your reference number.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-body">Forgot password? Available when accounts go live.</span>
                <Link href="/admissions/track" className="font-bold text-royal hover:underline">
                  Use the public tracker →
                </Link>
              </div>
            </form>
          </Reveal>
        </div>
      </section>

      {/* support */}
      <section id="support" className="container-page scroll-mt-32 py-16 md:py-24">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-line bg-paper p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-gold">
              <Phone className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-4 text-[15px] font-bold text-navy">Helpline</h3>
            <a href={telHref} className="mt-1.5 block font-display text-xl font-semibold text-royal hover:text-navy">
              {helpline}
            </a>
            <p className="mt-1 text-xs text-slate-body">{officeHours}</p>
          </div>
          <div className="rounded-3xl border border-line bg-paper p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-gold">
              <Mail className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-4 text-[15px] font-bold text-navy">Email support</h3>
            <a href={`mailto:${admissionEmail}`} className="mt-1.5 block break-all text-sm font-semibold text-royal hover:text-navy">
              {admissionEmail}
            </a>
            <p className="mt-1 break-all text-xs text-slate-body">
              General queries: {generalEmail}
            </p>
          </div>
          <div className="rounded-3xl border border-line bg-paper p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-gold">
              <LifeBuoy className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-4 text-[15px] font-bold text-navy">Self-service</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-body">
              FAQs, document downloads and the contact form are available around the clock.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/faqs" className="btn btn-outline btn-sm">
                FAQs
              </Link>
              <Link href="/contact" className="btn btn-ghost btn-sm">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
