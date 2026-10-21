import Link from "next/link";
import { ArrowRight, Ban, Copyright, FileText, Mail, Scale, Wallet } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/section";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Terms & Conditions",
  description:
    "Terms of use for the Aarohan Institute of Higher Education demo website — demo status of content, fee and payment disclaimers, intellectual property and limitation of liability.",
};

const LAST_UPDATED = "19 October 2026";

export default function TermsPage() {
  const generalEmail = getSetting("general_email", "info@aarohan-institute.edu");
  const helpline = getSetting("admission_helpline", "+91 98200 41127");
  const telHref = `tel:${helpline.replace(/[^\d+]/g, "")}`;

  return (
    <>
      <PageHeader
        eyebrow="Legal & Trust"
        title="Terms & conditions"
        description="The ground rules for using this website — including what is demo content, how fees and payments are handled, and where responsibility is limited."
        breadcrumbs={<Breadcrumbs items={[{ label: "Terms & Conditions" }]} />}
        meta={[
          { label: "Last updated", value: "Oct 2026" },
          { label: "Governing law", value: "Uttar Pradesh" },
          { label: "Site status", value: "Demo" },
          { label: "Queries", value: "info@" },
        ]}
      >
        <Link href="/contact" className="btn btn-gold">
          <Mail className="h-4 w-4" aria-hidden />
          Contact us
        </Link>
        <Link href="/privacy" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          Privacy policy
        </Link>
      </PageHeader>

      <section className="container-page py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-body">
            Last updated: {LAST_UPDATED}
          </p>

          <div className="prose-univ mt-6">
            <p>
              These terms govern your use of this website operated for{" "}
              <strong>Aarohan Institute of Higher Education</strong>. By browsing the site or submitting a form, you
              accept these terms. If you do not agree, please discontinue use of the site.
            </p>

            <h2 id="demo-status">1. Demonstration status of content</h2>
            <p>
              This website is a <strong>demonstration build</strong>. Aarohan Institute, its campuses, people,
              programmes, fees, statistics, testimonials, news, events and recruiter information are fictional sample
              content created to show how an institute website can work.
            </p>
            <ul>
              <li>No accreditation, recognition, approval or ranking is claimed anywhere on this site.</li>
              <li>Placement figures, scholarship percentages and fee amounts are illustrative, not offers.</li>
              <li>Testimonials and news items are marked as demo data where they appear.</li>
              <li>Documents in the downloads section are placeholder files, not official publications.</li>
            </ul>
            <p>
              Nothing on this site constitutes an offer of admission, a contract of enrolment or a guarantee of any
              outcome. Where real institute content replaces this material, it will be reviewed for accuracy before
              publication.
            </p>

            <h2 id="admissions">2. Admissions and programme information</h2>
            <p>
              Programme pages describe eligibility, duration, curriculum and career pathways in good faith. Seat
              availability, session dates and entry requirements may change, and the version confirmed during
              counselling always supersedes what is shown online. Submitting an application through this site does not
              create any entitlement to admission.
            </p>
            <p>
              You are responsible for the accuracy of the information and documents you submit. Applications found to
              contain false or altered records may be cancelled at any stage of the process.
            </p>

            <h2 id="fees">3. Fees, payments and refunds</h2>
            <p>
              Fee figures shown on programme and scholarship pages are indicative and per the schedule stated beside
              them (typically per semester). The official fee structure — including one-time charges, examination
              fees, laboratory fees, hostel charges and refund terms — is the document issued by the accounts office
              with the admission offer.
            </p>
            <ul>
              <li>
                <Wallet className="mr-1.5 inline h-4 w-4 text-royal" aria-hidden />
                <strong>No online payment is collected on this demo site.</strong> Any payment screen must only be used
                once it is connected to an approved, secured payment provider.
              </li>
              <li>Scholarship and concession amounts are applied only after written confirmation at counselling.</li>
              <li>Fee revisions, if any, are communicated in writing before the relevant due date.</li>
              <li>Refund and cancellation terms follow the institute&rsquo;s published policy applicable to the session.</li>
            </ul>
            <p>
              Always verify payment instructions against an official institute communication before transferring any
              amount, and never pay into personal accounts.
            </p>

            <h2 id="ip">4. Intellectual property</h2>
            <p>
              The design, layout, text, graphics, logos, component code and structure of this website are protected by
              copyright and other intellectual property laws. Institute name, monogram and brand assets belong to their
              respective owners; stock and sample photography is used under licence for this demonstration.
            </p>
            <ul>
              <li>You may view, download and print pages for personal, non-commercial reference.</li>
              <li>You may not republish, reproduce, redistribute or commercially exploit site content without written permission.</li>
              <li>You may not frame, mirror or scrape the site, or remove ownership notices from copied material.</li>
              <li>
                <Copyright className="mr-1.5 inline h-4 w-4 text-royal" aria-hidden />
                Where content includes third-party material (fonts, icons, imagery), its original licence continues to apply.
              </li>
            </ul>

            <h2 id="acceptable-use">5. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Submit unlawful, misleading, defamatory or infringing content through any form</li>
              <li>Attempt to gain unauthorised access to the admin panel, databases or other users&rsquo; records</li>
              <li>Interfere with the site&rsquo;s operation — including overload, probing or automated scraping</li>
              <li>Impersonate another person or misrepresent your affiliation with any organisation</li>
              <li>Use site contact details or forms for unsolicited marketing or spam</li>
            </ul>
            <p>
              We may restrict or block access where these rules are breached, and refer matters to the relevant
              authorities where the law requires it.
            </p>

            <h2 id="third-party">6. External links</h2>
            <p>
              Links to external websites, map embeds and social profiles are provided for convenience. We do not
              control their content, availability or privacy practices and do not endorse them by linking. Visiting an
              external site is at your own risk and that site&rsquo;s own terms apply.
            </p>

            <h2 id="liability">7. Limitation of liability</h2>
            <p>
              The website is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the maximum extent
              permitted by law, we do not warrant that the site will be uninterrupted, error-free or free of harmful
              components, or that the information is complete or current at every moment.
            </p>
            <p>
              Subject to applicable law, we are not liable for any indirect, incidental or consequential loss arising
              from your use of, or inability to use, this site — including loss of data, opportunity or goodwill
              resulting from reliance on demo content, temporary unavailability, or third-party services linked from
              these pages. Nothing in these terms limits liability that cannot be limited under Indian law, including
              liability for fraud or wilful misconduct.
            </p>

            <h2 id="changes">8. Changes to these terms</h2>
            <p>
              We may update these terms to reflect changes in the site, our practices or the law. The updated date at
              the top of this page will change when an update takes effect. Continued use of the site after an update
              means you accept the revised terms.
            </p>

            <h2 id="law">9. Governing law</h2>
            <p>
              These terms are governed by the laws of India, and disputes are subject to the exclusive jurisdiction of
              the courts in Gautam Buddh Nagar, Uttar Pradesh. Before taking formal action, please contact us — most
              concerns are resolved quickly when raised directly.
            </p>

            <h2 id="contact">10. Contact</h2>
            <p>
              Questions about these terms can be sent to <a href={`mailto:${generalEmail}`}>{generalEmail}</a>, or
              call <a href={telHref}>{helpline}</a> during office hours. You can also use the{" "}
              <Link href="/contact">contact form</Link>.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-navy">
              <Mail className="h-4 w-4" aria-hidden />
              Contact the institute
            </Link>
            <Link href="/accessibility" className="btn btn-outline">
              Accessibility statement
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-paper">
        <div className="container-page flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-2 text-sm text-slate-body">
            <Scale className="h-4 w-4 text-royal" aria-hidden />
            Demonstration terms — have them reviewed by legal counsel before launch.
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-body">
            <FileText className="h-4 w-4 text-royal" aria-hidden />
            Related: <Link href="/privacy" className="font-semibold text-royal underline underline-offset-2">Privacy policy</Link>
            <span aria-hidden>·</span>
            <Ban className="h-4 w-4 text-royal" aria-hidden />
            Demo content notice
          </p>
        </div>
      </section>
    </>
  );
}
