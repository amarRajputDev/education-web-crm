import Link from "next/link";
import { ArrowRight, FileLock2, Mail, Phone, Scale, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How Aarohan Institute of Higher Education collects, uses, retains and protects enquiry and application data — including your rights and how to exercise them.",
};

const LAST_UPDATED = "19 October 2026";

export default function PrivacyPage() {
  const retentionDays = getSetting("retention_days", "730");
  const helpline = getSetting("admission_helpline", "+91 98200 41127");
  const generalEmail = getSetting("general_email", "info@aarohan-institute.edu");
  const telHref = `tel:${helpline.replace(/[^\d+]/g, "")}`;

  return (
    <>
      <PageHeader
        eyebrow="Legal & Trust"
        title="Privacy policy"
        description="What we collect when you enquire or apply, why we collect it, how long we keep it and the choices you have — written in plain language."
        breadcrumbs={<Breadcrumbs items={[{ label: "Privacy Policy" }]} />}
        meta={[
          { label: "Last updated", value: "Oct 2026" },
          { label: "Retention", value: `${retentionDays} days` },
          { label: "Applies to", value: "Website" },
          { label: "Contact", value: "info@" },
        ]}
      >
        <Link href="/contact" className="btn btn-gold">
          <Mail className="h-4 w-4" aria-hidden />
          Raise a privacy request
        </Link>
        <Link href="/terms" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          Terms & conditions
        </Link>
      </PageHeader>

      <section className="container-page py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-body">
            Last updated: {LAST_UPDATED} · Effective for this demo website
          </p>

          <div className="prose-univ mt-6">
            <p>
              <strong>Aarohan Institute of Higher Education</strong> (&ldquo;Aarohan&rdquo;, &ldquo;we&rdquo;,
              &ldquo;us&rdquo;) operates this website to share information about our programmes and to receive
              enquiries and admission applications. This policy explains what personal data we handle through the
              website, the purposes we handle it for, how long we retain it and how you can reach us about it.
            </p>
            <p>
              This site is a demonstration build. Even so, the forms are wired to a working local database, so please
              treat anything you submit here as you would on a live site.
            </p>

            <h2 id="what-we-collect">1. What we collect</h2>
            <h3>When you send an enquiry or a contact message</h3>
            <ul>
              <li>Name, mobile number and email address</li>
              <li>Subject and message text you type, plus the programme you are interested in</li>
              <li>How you found us (source selection) and the page you submitted from</li>
              <li>
                Technical records created automatically: IP address, timestamps and anti-abuse counters used to stop
                repeated spam submissions
              </li>
            </ul>
            <h3>When you submit an admission application</h3>
            <ul>
              <li>Personal details: full name, date of birth, gender, contact information and parent/guardian contact</li>
              <li>Academic record: qualification, institution, board, passing year and marks</li>
              <li>Programme choice, study mode and academic session</li>
              <li>Address details (current and permanent), city, state and postal code</li>
              <li>
                Documents you upload: photograph, identity proof, mark sheets, certificates and any other file the form
                asks for — stored under generated file names, not public URLs
              </li>
              <li>Consent confirmation, application reference number and status history</li>
            </ul>

            <h2 id="why">2. Why we use it</h2>
            <ul>
              <li><strong>To respond to you:</strong> answer your question, call you back or email the information you asked for.</li>
              <li><strong>To process applications:</strong> verify eligibility, verify documents, communicate offers and maintain admission records.</li>
              <li>
                <strong>To improve counselling:</strong> keep a reference-numbered history so any team member can help
                you without asking for the same details twice.
              </li>
              <li><strong>To protect the site:</strong> rate limiting and abuse prevention so the forms stay usable for everyone.</li>
              <li><strong>To meet legal obligations:</strong> maintaining records that educational institutions are required to keep.</li>
            </ul>
            <p>
              We do <strong>not</strong> sell personal data, and we do not use your enquiry or application content for
              advertising.
            </p>

            <h2 id="consent">3. Consent and its withdrawal</h2>
            <p>
              Enquiry and contact forms include a consent checkbox that you must tick before submitting. By ticking it
              you agree that we may store the details you provided in order to respond to you. Application submission
              carries the same consent at the declaration step.
            </p>
            <p>
              You may withdraw consent at any time by writing to{" "}
              <a href={`mailto:${generalEmail}`}>{generalEmail}</a> or calling{" "}
              <a href={telHref}>{helpline}</a>. On withdrawal, we stop using the data for new responses and schedule it
              for deletion, subject to any records we must retain by law.
            </p>

            <h2 id="retention">4. How long we keep it</h2>
            <p>
              Enquiry and application records are retained for{" "}
              <strong>{retentionDays} days</strong> ({retentionDays} days is the retention period configured in Admin →
              Settings → Privacy) from the last meaningful activity, after which they are deleted or anonymised by the
              scheduled clean-up. Uploaded documents follow the same period unless a specific admission cycle requires
              a shorter or longer window.
            </p>
            <p>
              Server logs used for security are kept for a much shorter operational period. Where a record is needed
              for an active dispute or a statutory requirement, it is held only for as long as that need lasts.
            </p>

            <h2 id="sharing">5. Who we share it with</h2>
            <ul>
              <li>Internal teams (admissions, counselling, accounts) on a need-to-know basis</li>
              <li>Service providers operating strictly on our instructions — for example email delivery or hosting</li>
              <li>Competent authorities, only where disclosure is legally required</li>
            </ul>
            <p>Personal data is stored on servers under our control and is not transferred abroad in this demo setup.</p>

            <h2 id="rights">6. Your rights</h2>
            <p>Subject to applicable law, you can ask us to:</p>
            <ul>
              <li>Confirm whether we hold personal data about you and get a copy</li>
              <li>Correct data that is inaccurate or incomplete</li>
              <li>Delete data we no longer need to keep</li>
              <li>Restrict or object to a particular use</li>
              <li>Withdraw consent at any time without affecting earlier lawful processing</li>
            </ul>
            <p>
              We respond to verified requests within 30 days. Use the contact details below and quote any reference
              number you hold so we can locate your record quickly.
            </p>

            <h2 id="cookies">7. Cookies and analytics</h2>
            <p>
              This demo site uses only essential session cookies for admin sign-in. If analytics is enabled from Admin
              → Settings → Integrations, it is configured in a privacy-respecting mode with IP anonymisation and no
              advertising cookies.
            </p>

            <h2 id="security">8. Security</h2>
            <p>
              Access to enquiry and application records is role-based inside the institute, passwords are stored
              hashed, uploaded documents use non-guessable file names, and forms are protected by rate limiting. No
              system is perfectly secure — if we become aware of a breach affecting your data, we will notify you and
              the relevant authority as required by law.
            </p>

            <h2 id="changes">9. Changes to this policy</h2>
            <p>
              We update this page when our data practices change. The revision date at the top of the page always
              reflects the current version. Material changes will be highlighted on the home page for a reasonable
              period.
            </p>

            <h2 id="contact">10. Contact us</h2>
            <p>
              Privacy questions, requests and grievances can be sent to{" "}
              <a href={`mailto:${generalEmail}`}>{generalEmail}</a> with the subject line &ldquo;Privacy request&rdquo;,
              or raised in person at the administration office during{" "}
              {getSetting("office_hours", "office hours")}. You can also use the{" "}
              <Link href="/contact">contact form</Link> and select a subject mentioning privacy.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-line bg-paper p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-gold">
                <Mail className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-[15px] font-bold text-navy">Email</h3>
              <a href={`mailto:${generalEmail}`} className="mt-1 block break-all text-sm font-semibold text-royal hover:underline">
                {generalEmail}
              </a>
            </div>
            <div className="rounded-3xl border border-line bg-paper p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-gold">
                <Phone className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-[15px] font-bold text-navy">Helpline</h3>
              <a href={telHref} className="mt-1 block text-sm font-semibold text-royal hover:underline">
                {helpline}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-paper">
        <div className="container-page grid gap-6 py-12 md:grid-cols-[1.4fr_1fr] md:items-center md:py-14">
          <div>
            <p className="flex items-center gap-3 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-royal">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" aria-hidden />
              Related documents
            </p>
            <h2 className="mt-3 text-[clamp(1.4rem,2.6vw,2rem)] leading-tight text-navy">
              Read the terms and our accessibility commitment.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-body">
              The terms cover demo content, fees and intellectual property; the accessibility statement explains our
              WCAG 2.2 AA target and how to report a barrier.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/terms" className="btn btn-navy">
              <Scale className="h-4 w-4" aria-hidden />
              Terms & conditions
            </Link>
            <Link href="/accessibility" className="btn btn-outline">
              Accessibility
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="container-page border-t border-line py-5 text-[11px] text-slate-body">
          <FileLock2 className="mr-1.5 inline h-3.5 w-3.5" aria-hidden />
          Demonstration policy text — review with your legal advisor before publishing.
        </div>
      </section>
    </>
  );
}
