import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileText,
  GraduationCap,
  LifeBuoy,
  Mail,
  Phone,
  Wallet,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { FaqAccordion } from "@/components/public/faq-accordion";
import { getFaqs } from "@/lib/content";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about admissions, fees, scholarships, academics, campus life and contacting Aarohan Institute of Higher Education.",
};

const QUICK_LINKS = [
  {
    href: "/admissions",
    title: "Admissions overview",
    text: "Eligibility, important dates, document checklist and the six-step application.",
    icon: GraduationCap,
  },
  {
    href: "/scholarships",
    title: "Scholarships & aid",
    text: "Merit, need-based, early-bird and sibling concessions with programme-wise details.",
    icon: Wallet,
  },
  {
    href: "/contact",
    title: "Contact the institute",
    text: "Helpline, department emails, office hours and a message form with a reference number.",
    icon: Mail,
  },
  {
    href: "/downloads",
    title: "Prospectus & downloads",
    text: "Prospectus, fee structure, admission checklist and academic calendar documents.",
    icon: FileText,
  },
];

export default function FaqsPage() {
  const faqs = getFaqs();
  const helpline = getSetting("admission_helpline", "+91 98200 41127");
  const admissionEmail = getSetting("admission_email", "admissions@aarohan-institute.edu");

  const categoryCount = new Set(faqs.map((faq) => faq.category)).size;

  return (
    <>
      <PageHeader
        eyebrow="Help Centre"
        title="Questions, answered before you ask"
        description="Admissions, fees, scholarships, timetables, hostels and placements — the answers our counselling desk gives most often, searchable in one place."
        breadcrumbs={<Breadcrumbs items={[{ label: "FAQs" }]} />}
        meta={[
          { label: "Questions", value: String(faqs.length) },
          { label: "Categories", value: String(categoryCount) },
          { label: "Helpline", value: helpline.replace("+91 ", "") },
          { label: "Updated", value: "Weekly" },
        ]}
      >
        <a href={`tel:${helpline.replace(/[^\d+]/g, "")}`} className="btn btn-gold">
          <Phone className="h-4 w-4" aria-hidden />
          Call the helpline
        </a>
        <Link href="/admissions/apply" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          Start an application
        </Link>
      </PageHeader>

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-14">
          <div>
            <SectionHeading
              index="01"
              eyebrow="Search & Browse"
              title="Frequently asked questions"
              description="Filter by category or type a word — for example “fee”, “hostel” or “internship”."
            />
            <FaqAccordion faqs={faqs} idPrefix="faqs-page" />
          </div>

          <aside aria-label="Helpful links" className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-line bg-paper p-6">
              <p className="flex items-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-royal">
                <LifeBuoy className="h-4 w-4 text-gold" aria-hidden />
                More help
              </p>
              <ul className="mt-5 space-y-4">
                {QUICK_LINKS.map((link, index) => (
                  <Reveal key={link.href} delay={index * 60} as="li">
                    <Link
                      href={link.href}
                      className="group block rounded-2xl border border-line bg-offwhite/60 p-4 transition hover:border-royal/40 hover:bg-paper"
                    >
                      <span className="flex items-center gap-2.5">
                        <link.icon className="h-4 w-4 shrink-0 text-royal" aria-hidden />
                        <span className="text-sm font-bold text-navy group-hover:text-royal">{link.title}</span>
                      </span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-slate-body">{link.text}</span>
                      <span className="mt-2 inline-block text-[11px] font-bold text-royal opacity-0 transition group-hover:opacity-100">
                        Open →
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </ul>

              <div className="mt-6 rounded-2xl border border-dashed border-gold/70 bg-gold-100/60 p-4">
                <p className="text-xs font-bold leading-relaxed text-gold-700">
                  Can&rsquo;t find your answer?
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-body">
                  Write to{" "}
                  <a href={`mailto:${admissionEmail}`} className="font-semibold text-royal underline underline-offset-2">
                    {admissionEmail}
                  </a>{" "}
                  or call{" "}
                  <a href={`tel:${helpline.replace(/[^\d+]/g, "")}`} className="font-semibold text-royal underline underline-offset-2">
                    {helpline}
                  </a>{" "}
                  — Monday to Saturday.
                </p>
                <Link href="/contact" className="btn btn-navy btn-sm mt-4 w-full">
                  <BookOpen className="h-4 w-4" aria-hidden />
                  Ask a question
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t border-line bg-paper">
        <div className="container-page rounded-none py-16 md:py-20">
          <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-navy p-8 text-white md:p-12">
            <div className="absolute inset-0 grid-lines-light opacity-50" aria-hidden />
            <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
              <div>
                <p className="flex items-center gap-3 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-gold">
                  <span className="h-px w-10 bg-gold/70" aria-hidden />
                  Next step
                </p>
                <h2 className="mt-4 text-[clamp(1.7rem,3.2vw,2.5rem)] leading-tight text-white">
                  Ready when you are —{" "}
                  <span className="italic text-gold">explore programmes or apply.</span>
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">
                  Applications for the 2027–28 session are open across all six schools. Compare eligibility and fees,
                  then start the six-step application whenever you are ready.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link href="/admissions/apply" className="btn btn-gold">
                  Apply now
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link href="/courses" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
                  Browse programmes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
