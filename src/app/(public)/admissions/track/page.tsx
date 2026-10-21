import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileSearch, HelpCircle, Mail, Phone, RefreshCw } from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { TrackForm } from "@/components/public/track-form";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Track Application",
  description: "Check the status of a submitted admission application using your application reference number.",
};

const STATUS_GUIDE = [
  { status: "Submitted", tone: "info", text: "Received and queued for review." },
  { status: "Under Review", tone: "warning", text: "A reviewer is checking your details and documents." },
  { status: "Documents Required", tone: "danger", text: "Something is missing — you will be contacted with details." },
  { status: "Documents Verified", tone: "success", text: "Your uploads have been checked and accepted." },
  { status: "Interview Scheduled", tone: "gold", text: "A counselling or interview slot has been assigned." },
  { status: "Approved", tone: "success", text: "Offer made — complete fee payment to confirm your seat." },
  { status: "Waitlisted", tone: "warning", text: "On the waiting list for your programme; you will be updated." },
  { status: "Enrolled", tone: "success", text: "Admission confirmed. Welcome to Aarohan." },
] as const;

export default function TrackApplicationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Application Status"
        title="Track your application"
        description="Enter the reference number generated when you submitted your application to see its current stage."
        breadcrumbs={[{ label: "Admissions", href: "/admissions" }, { label: "Track Application" }]}
        meta={[
          { label: "Reference format", value: "APP-YYYY-####" },
          { label: "Updated by", value: "Review team" },
          { label: "Support", value: "Mon–Sat" },
        ]}
      >
        <Link href="/admissions/apply" className="btn btn-gold">
          Start a new application
        </Link>
      </PageHeader>

      <section className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_1fr] lg:py-20">
        <div className="rounded-[2rem] border border-line bg-paper p-6 sm:p-8">
          <SectionHeading index="01" align="left" eyebrow="Lookup" title="Enter your reference number" />
          <TrackForm />
          <div className="mt-6 rounded-2xl bg-offwhite p-4 text-xs leading-relaxed text-slate-body">
            <p className="font-bold text-navy">Demo sample references</p>
            <p className="mt-1">
              This demo ships with seeded applications — try <span className="font-mono text-navy">APP-2027-0001</span> or{" "}
              <span className="font-mono text-navy">APP-2027-0007</span> to preview the status view.
            </p>
          </div>
        </div>

        <div>
          <SectionHeading index="02" align="left" eyebrow="Status guide" title="What each status means" />
          <ul className="space-y-3">
            {STATUS_GUIDE.map((item) => (
              <li key={item.status} className="flex items-start gap-4 rounded-2xl border border-line bg-paper p-4">
                <Badge tone={item.tone as "info" | "warning" | "danger" | "success" | "gold"} className="mt-0.5 min-w-[132px] justify-center">
                  {item.status}
                </Badge>
                <p className="text-sm leading-relaxed text-slate-body">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line bg-paper">
        <div className="container-page grid gap-6 py-14 md:grid-cols-3">
          {[
            { icon: RefreshCw, title: "Status not updated?", text: "Reviews happen on working days. If your status has not moved for 3 working days, call the admission desk." },
            { icon: FileSearch, title: "Documents pending?", text: "Uploads are checked manually. Keep originals ready for verification at the counselling desk." },
            { icon: ClipboardCheck, title: "Approved?", text: "Complete fee payment within the given window to confirm your seat, then collect your enrolment confirmation." },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-line bg-offwhite/60 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy text-gold">
                <item.icon className="h-4 w-4" aria-hidden />
              </span>
              <h3 className="mt-4 text-[15px] font-bold text-navy">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-body">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="container-page border-t border-line py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-body">
              <a href="tel:+919820041127" className="flex items-center gap-2 font-semibold text-navy hover:text-royal">
                <Phone className="h-4 w-4 text-royal" aria-hidden />
                +91 98200 41127
              </a>
              <a href="mailto:admissions@aarohan-institute.edu" className="flex items-center gap-2 font-semibold text-navy hover:text-royal">
                <Mail className="h-4 w-4 text-royal" aria-hidden />
                admissions@aarohan-institute.edu
              </a>
              <span className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-royal" aria-hidden />
                Mon – Sat, 9:00 AM – 6:00 PM
              </span>
            </div>
            <Link href="/faqs" className="link-sweep text-sm font-bold text-navy">
              Admission FAQs <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
