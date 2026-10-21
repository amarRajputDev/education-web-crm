import Link from "next/link";
import {
  Accessibility,
  ArrowRight,
  Captions,
  Eye,
  HandHeart,
  Keyboard,
  Mail,
  MessageCircle,
  Phone,
  Ruler,
  Wrench,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accessibility Statement",
  description:
    "Aarohan Institute of Higher Education's accessibility commitment, WCAG 2.2 AA target, known limitations and how to report a barrier.",
};

const LAST_UPDATED = "19 October 2026";

const MEASURES = [
  {
    icon: Keyboard,
    title: "Keyboard operability",
    text: "Every control — navigation menus, FAQ rows, tabs and forms — can be reached and activated with the keyboard alone, with a visible focus indicator throughout.",
  },
  {
    icon: Eye,
    title: "Contrast & readability",
    text: "Body copy, labels and interactive states are checked against WCAG contrast ratios; headings follow a logical h1–h6 outline for screen-reader navigation.",
  },
  {
    icon: Ruler,
    title: "Layout & zoom",
    text: "Pages reflow without horizontal scrolling at 320 px width and remain usable at 200% browser zoom on desktop and mobile.",
  },
  {
    icon: Wrench,
    title: "Forms & errors",
    text: "All inputs carry programmatic labels, required fields are announced, and validation problems appear in a summary linked to the affected fields.",
  },
  {
    icon: Captions,
    title: "Images & media",
    text: "Content images receive meaningful alternative text; decorative images are hidden from assistive technology. Video captions are pending — see known limitations.",
  },
  {
    icon: HandHeart,
    title: "Motion & language",
    text: "Animations respect prefers-reduced-motion, plain language is used for instructions, and text can be resized with browser controls.",
  },
];

const LIMITATIONS = [
  {
    issue: "Archived PDF downloads are not fully tagged",
    impact: "Some older documents in the downloads section may not read in a logical order with a screen reader.",
    fix: "Each document is being regenerated as a tagged, searchable PDF; an accessible HTML summary is offered on request in the meantime.",
  },
  {
    issue: "Third-party map embed",
    impact: "The campus map (when configured) relies on the provider's own interface, which we do not fully control.",
    fix: "The address is always provided as text beside the map, and directions can be obtained by phone or email.",
  },
  {
    issue: "Video captions and transcripts",
    impact: "Recorded campus and event videos are not yet captioned.",
    fix: "Captions and transcripts are being added alongside each new video; transcripts can be requested before then.",
  },
  {
    issue: "Some third-party social content",
    impact: "Posts embedded from social networks may contain images without alt text as authored by the account owner.",
    fix: "Equivalent information is published on our own news pages wherever it matters.",
  },
];

export default function AccessibilityPage() {
  const generalEmail = getSetting("general_email", "info@aarohan-institute.edu");
  const helpline = getSetting("admission_helpline", "+91 98200 41127");
  const officeHours = getSetting("office_hours", "Monday – Saturday, 9:00 AM – 6:00 PM");
  const telHref = `tel:${helpline.replace(/[^\d+]/g, "")}`;

  return (
    <>
      <PageHeader
        eyebrow="Inclusive Access"
        title="Accessibility statement"
        description="Our target, what is already in place, where this site still falls short — and exactly how to tell us when something gets in your way."
        breadcrumbs={<Breadcrumbs items={[{ label: "Accessibility" }]} />}
        meta={[
          { label: "Last updated", value: "Oct 2026" },
          { label: "Target", value: "WCAG 2.2 AA" },
          { label: "Status", value: "Ongoing" },
          { label: "Reply", value: "5 days" },
        ]}
      >
        <a href="#report" className="btn btn-gold">
          <MessageCircle className="h-4 w-4" aria-hidden />
          Report a barrier
        </a>
        <Link href="/contact" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          Contact form
        </Link>
      </PageHeader>

      {/* commitment */}
      <section id="commitment" className="container-page scroll-mt-32 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <SectionHeading
              index="01"
              eyebrow="Our Commitment"
              title="Aiming for WCAG 2.2 Level AA"
              description="Aarohan Institute of Higher Education wants every visitor — students, parents, staff and applicants using assistive technology — to reach the same information and complete the same tasks."
            />
            <div className="prose-univ">
              <p>
                This website is designed and tested against the <strong>Web Content Accessibility Guidelines (WCAG) 2.2</strong>{" "}
                at <strong>Level AA</strong>. Where a page or feature cannot meet that level today, it is listed under
                known limitations below with a remediation plan.
              </p>
              <p>
                Accessibility is reviewed as part of every content and feature release, not as a one-time exercise.
                New components — forms, tables, navigation and downloadable documents — must pass keyboard, screen
                reader and contrast checks before they go live.
              </p>
              <p className="text-xs text-slate-body">
                Last updated: {LAST_UPDATED}. This is a demonstration statement; replace it with your formal
                accessibility review before publishing.
              </p>
            </div>
          </div>

          <Reveal className="rounded-[2rem] border border-dashed border-royal/50 bg-royal-100/50 p-7">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-gold">
              <Accessibility className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="mt-5 text-lg font-bold text-navy">Conformance goal</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-body">
              Level AA of WCAG 2.2 across all public pages of this website, with the exceptions declared below.
            </p>
            <dl className="mt-5 space-y-3 border-t border-royal/20 pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-body">Standard</dt>
                <dd className="font-semibold text-navy">WCAG 2.2 Level AA</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-body">Assessment method</dt>
                <dd className="font-semibold text-navy">Manual + automated audit</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-body">Review cycle</dt>
                <dd className="font-semibold text-navy">Every release</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-body">Target completion</dt>
                <dd className="font-semibold text-navy">Before public launch</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      {/* measures */}
      <section id="measures" className="scroll-mt-32 border-y border-line bg-paper py-16 md:py-24">
        <div className="container-page">
          <SectionHeading
            index="02"
            eyebrow="What We Do"
            title="Measures built into this site"
            description="Technical and editorial practices that keep the pages usable for everyone."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MEASURES.map((item, index) => (
              <Reveal key={item.title} delay={index * 55}>
                <div className="h-full rounded-3xl border border-line bg-offwhite/60 p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-gold">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-[15px] font-bold text-navy">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-body">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* known limitations */}
      <section id="limitations" className="container-page scroll-mt-32 py-16 md:py-24">
        <SectionHeading
          index="03"
          eyebrow="Known Limitations"
          title="Where the site does not yet conform"
          description="Declared openly, with what we are doing about each one. Tell us if a limitation blocks you — we can usually supply an accessible alternative quickly."
        />
        <ul className="space-y-4">
          {LIMITATIONS.map((item, index) => (
            <Reveal key={item.issue} delay={index * 60} as="li">
              <div className="grid gap-4 rounded-3xl border border-line bg-paper p-6 lg:grid-cols-[1.1fr_1fr_1fr]">
                <div>
                  <span className="rounded-full border border-gold/60 bg-gold-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-gold-700">
                    Limitation {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-[15px] font-bold leading-snug text-navy">{item.issue}</h3>
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-body">Impact</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-body">{item.impact}</p>
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-royal">Our response</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-navy/85">{item.fix}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* report a barrier */}
      <section id="report" className="scroll-mt-32 bg-navy py-16 text-white md:py-24">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
            <div>
              <SectionHeading
                index="04"
                eyebrow="Report a Barrier"
                title={<span className="text-white">Tell us what stopped you</span>}
                description={
                  <span className="text-white/65">
                    Describe the page, what you were trying to do and which assistive technology you use if you know
                    it. You do not need to be a technical expert — a screenshot or a quote of the error text helps.
                  </span>
                }
              />
              <ul className="space-y-3 text-sm text-white/75">
                {[
                  "We acknowledge every accessibility report within 2 working days.",
                  "We aim to resolve reported barriers within 5 working days.",
                  "If a fix takes longer, we will offer an accessible alternative and keep you updated.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
                <p className="flex items-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-gold">
                  <Mail className="h-4 w-4" aria-hidden />
                  Email
                </p>
                <a href={`mailto:${generalEmail}?subject=Accessibility%20barrier%20report`} className="mt-3 block break-all font-display text-xl font-semibold text-white hover:text-gold">
                  {generalEmail}
                </a>
                <p className="mt-1 text-xs text-white/55">Subject line: “Accessibility barrier report”</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
                <p className="flex items-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-gold">
                  <Phone className="h-4 w-4" aria-hidden />
                  Phone
                </p>
                <a href={telHref} className="mt-3 block font-display text-xl font-semibold text-white hover:text-gold">
                  {helpline}
                </a>
                <p className="mt-1 text-xs text-white/55">{officeHours}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/contact" className="btn btn-gold">
                  Use the contact form
                </Link>
                <Link href="/terms" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
                  Terms & conditions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* alternative formats */}
      <section className="container-page py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <p className="flex items-center gap-3 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-royal">
              <ArrowRight className="h-3.5 w-3.5 text-gold" aria-hidden />
              Alternative formats
            </p>
            <h2 className="mt-3 text-[clamp(1.4rem,2.6vw,2rem)] leading-tight text-navy">
              Prospectus, fee structure and forms in the format you need.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-body">
              Large print, plain text or screen-reader optimised versions of our published documents can be requested
              by email or phone — usually within two working days.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/downloads" className="btn btn-navy">
              Browse downloads
            </Link>
            <Link href="/faqs" className="btn btn-outline">
              Help centre
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
