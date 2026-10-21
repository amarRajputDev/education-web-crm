import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clock,
  Compass,
  Headphones,
  HelpCircle,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Users,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { ContactForm } from "@/components/public/contact-form";
import { FacebookIcon, InstagramIcon, LinkedInIcon, YouTubeIcon } from "@/components/ui/social-icons";
import { getDepartments, getFaqs } from "@/lib/content";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact Us",
  description:
    "Write to Aarohan Institute of Higher Education, call the admission helpline, find department contacts, office hours and campus location details.",
};

const JUMPS = [
  { href: "#write", label: "Write to us" },
  { href: "#departments", label: "Department contacts" },
  { href: "#map", label: "Campus map" },
  { href: "#faq", label: "Contact FAQs" },
];

const SOCIALS = [
  { icon: LinkedInIcon, label: "LinkedIn", href: "https://www.linkedin.com", handle: "Aarohan Institute" },
  { icon: InstagramIcon, label: "Instagram", href: "https://www.instagram.com", handle: "@aarohaninstitute" },
  { icon: FacebookIcon, label: "Facebook", href: "https://www.facebook.com", handle: "Aarohan Institute" },
  { icon: YouTubeIcon, label: "YouTube", href: "https://www.youtube.com", handle: "Aarohan Institute" },
];

export default function ContactPage() {
  const address = getSetting("address");
  const helpline = getSetting("admission_helpline", "+91 98200 41127");
  const admissionEmail = getSetting("admission_email", "admissions@aarohan-institute.edu");
  const generalEmail = getSetting("general_email", "info@aarohan-institute.edu");
  const officeHours = getSetting("office_hours");
  const mapEmbed = getSetting("map_embed");

  const departments = getDepartments();
  const faqs = getFaqs().slice(0, 4);
  const telHref = `tel:${helpline.replace(/[^\d+]/g, "")}`;

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to the people behind the prospectus"
        description="Admission questions, document doubts, campus visits or fee queries — reach the right desk by phone, email or message, and keep your reference number handy for follow-ups."
        breadcrumbs={<Breadcrumbs items={[{ label: "Contact Us" }]} />}
        meta={[
          { label: "Helpline", value: helpline.replace("+91 ", "") },
          { label: "Admissions", value: "admissions@" },
          { label: "Office hours", value: "Mon–Sat" },
          { label: "Reply within", value: "1 day" },
        ]}
      >
        <a href={telHref} className="btn btn-gold">
          <Phone className="h-4 w-4" aria-hidden />
          Call {helpline}
        </a>
        <a href="#write" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          <MessageSquare className="h-4 w-4" aria-hidden />
          Write a message
        </a>
      </PageHeader>

      {/* on-this-page anchors */}
      <nav aria-label="On this page" className="border-b border-line bg-paper">
        <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-body">On this page</span>
          {JUMPS.map((jump) => (
            <a key={jump.href} href={jump.href} className="link-sweep text-sm font-bold text-navy hover:text-royal">
              {jump.label}
            </a>
          ))}
        </div>
      </nav>

      {/* form + direct contacts */}
      <section id="write" className="container-page scroll-mt-32 py-16 md:py-24">
        <SectionHeading
          index="01"
          eyebrow="Write to us"
          title="Send a message, get a reference number"
          description="Every message submitted here is logged with a unique reference so our team can follow up — and you can quote it on the helpline."
        />

        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          <Reveal className="card p-6 md:p-8">
            <ContactForm sourcePage="/contact" />
          </Reveal>

          <div className="space-y-5">
            <Reveal delay={60}>
              <div className="rounded-3xl border border-line bg-paper p-6">
                <p className="flex items-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-royal">
                  <Building2 className="h-4 w-4 text-gold" aria-hidden />
                  Campus address
                </p>
                <p className="mt-3 font-display text-lg leading-relaxed text-navy">{address}</p>
                <p className="mt-3 text-xs leading-relaxed text-slate-body">
                  Gate 2 is the visitor entrance — carry a photo ID at the security desk for a campus pass.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-3xl border border-line bg-navy p-6 text-white">
                <p className="flex items-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-gold">
                  <Headphones className="h-4 w-4" aria-hidden />
                  Admission helpline
                </p>
                <a href={telHref} className="mt-3 block font-display text-[clamp(1.6rem,3vw,2.1rem)] font-semibold text-white hover:text-gold">
                  {helpline}
                </a>
                <p className="mt-1 text-xs text-white/60">Tap to call · Monday to Saturday, 9:00 AM – 6:00 PM</p>
                <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
                  <a href={`mailto:${admissionEmail}`} className="flex items-center gap-2 text-white/80 hover:text-gold">
                    <Mail className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                    <span className="break-all">{admissionEmail}</span>
                  </a>
                  <a href={`mailto:${generalEmail}`} className="flex items-center gap-2 text-white/80 hover:text-gold">
                    <Mail className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                    <span className="break-all">{generalEmail}</span>
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={180}>
              <div className="rounded-3xl border border-line bg-paper p-6">
                <p className="flex items-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-royal">
                  <Clock className="h-4 w-4 text-gold" aria-hidden />
                  Office hours
                </p>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-navy">{officeHours}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-body">
                  Government holidays are observed; the online application form stays open on non-working days.
                </p>
              </div>
            </Reveal>

            <Reveal delay={240}>
              <div id="social" className="rounded-3xl border border-line bg-offwhite/70 p-6">
                <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-royal">Follow the institute</p>
                <ul className="mt-4 flex flex-wrap gap-3">
                  {SOCIALS.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`${social.label} — ${social.handle}`}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-paper text-navy transition hover:border-gold/70 hover:bg-gold-100 hover:text-gold-700"
                      >
                        <social.icon className="h-4 w-4" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-body">
                  Demo social profiles — replace with the institute&rsquo;s official accounts before launch.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* departments */}
      <section id="departments" className="scroll-mt-32 border-y border-line bg-paper py-16 md:py-24">
        <div className="container-page">
          <SectionHeading
            index="02"
            eyebrow="Department Contacts"
            title="Reach a school directly"
            description="For curriculum, timetable or faculty questions, write to the school concerned — general queries are always welcome on the admission helpline."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((department, index) => {
              const email = `${department.code.toLowerCase()}@aarohan-institute.edu`;
              return (
                <Reveal key={department.id} delay={index * 60}>
                  <div className="flex h-full flex-col rounded-3xl border border-line bg-offwhite/60 p-5 transition hover:border-royal/40 hover:bg-paper">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[15px] font-bold leading-snug text-navy">{department.name}</h3>
                      <Badge tone="gold">{department.code}</Badge>
                    </div>
                    {department.head_name ? (
                      <p className="mt-2 text-xs text-slate-body">Head of school · {department.head_name}</p>
                    ) : null}
                    <a
                      href={`mailto:${email}`}
                      className="link-sweep mt-4 self-start break-all text-sm font-bold text-royal"
                    >
                      {email}
                    </a>
                  </div>
                </Reveal>
              );
            })}
            {departments.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line-strong px-4 py-4 text-sm text-slate-body sm:col-span-2 lg:col-span-3">
                Department contacts are published from the admin panel and will appear here once available.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* map */}
      <section id="map" className="container-page scroll-mt-32 py-16 md:py-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <SectionHeading
            index="03"
            eyebrow="Find the Campus"
            title="Knowledge Park III, Greater Noida"
            description="The campus sits inside the Knowledge Park III institutional belt, a short ride from the Aqua Line metro corridor."
          />
          <Reveal delay={60} className="overflow-hidden rounded-[2rem] border border-line bg-paper">
            {mapEmbed ? (
              <iframe
                src={mapEmbed}
                title="Aarohan Institute campus map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-80 w-full border-0"
              />
            ) : (
              <div className="flex h-80 flex-col items-center justify-center gap-4 bg-gradient-to-br from-offwhite to-paper px-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-gold">
                  <Compass className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-xl font-semibold text-navy">Interactive map not configured</p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-body">
                    Add a Google Maps embed URL in <span className="font-semibold text-navy">Admin → Settings → Contact</span>{" "}
                    to display the campus map here. Until then, use the address above for directions.
                  </p>
                </div>
                <span className="rounded-full border border-dashed border-gold/70 bg-gold-100 px-3 py-1 text-[11px] font-bold text-gold-700">
                  Demo placeholder
                </span>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm">
              <p className="flex items-center gap-2 text-slate-body">
                <MapPin className="h-4 w-4 text-royal" aria-hidden />
                {address.split(",")[1]?.trim() ?? "Greater Noida"}, Uttar Pradesh
              </p>
              <Link href="/admissions" className="link-sweep text-sm font-bold text-navy">
                Plan a campus visit →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* contact FAQs */}
      <section id="faq" className="scroll-mt-32 border-t border-line bg-paper py-16 md:py-24">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <SectionHeading
              index="04"
              eyebrow="Quick Answers"
              title="Frequently asked contact questions"
              description="The four questions our counselling desk hears most often — the full list covers admissions, fees, academics and campus life."
            />
            <div>
              <dl className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-offwhite/60">
                {faqs.map((faq, index) => (
                  <Reveal key={faq.id} delay={index * 60} as="div" className="px-6 py-5">
                    <dt className="flex items-start gap-3 text-[15px] font-bold text-navy">
                      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                      {faq.question}
                    </dt>
                    <dd className="mt-2 pl-7 text-sm leading-relaxed text-slate-body">{faq.answer}</dd>
                  </Reveal>
                ))}
                {faqs.length === 0 ? (
                  <div className="px-6 py-5 text-sm text-slate-body">
                    FAQs are managed from the admin panel and will appear here once published.
                  </div>
                ) : null}
              </dl>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/faqs" className="btn btn-outline btn-sm">
                  <Users className="h-4 w-4" aria-hidden />
                  All FAQs
                </Link>
                <Link href="/contact" className="btn btn-ghost btn-sm">
                  Still stuck? Write to us
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
