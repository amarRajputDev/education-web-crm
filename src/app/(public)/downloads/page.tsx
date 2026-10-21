import Link from "next/link";
import {
  ArrowRight,
  Award,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Info,
  Mail,
  Paperclip,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { getDownloads } from "@/lib/content";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Downloads & Prospectus",
  description:
    "Prospectus, fee structure, admission checklist and academic calendar downloads from Aarohan Institute of Higher Education.",
};

const EXT_TYPES: Record<string, string> = {
  pdf: "PDF document",
  txt: "Plain-text file",
  doc: "Word document",
  docx: "Word document",
  xls: "Spreadsheet",
  xlsx: "Spreadsheet",
  ppt: "Presentation",
  pptx: "Presentation",
  jpg: "Image",
  jpeg: "Image",
  png: "Image",
};

function fileNote(filePath: string, externalUrl: string): string {
  const source = filePath || externalUrl;
  const ext = source.split(".").pop()?.toLowerCase() ?? "";
  if (filePath && EXT_TYPES[ext]) return `${EXT_TYPES[ext]} · demo file`;
  if (filePath) return "Linked file · demo placeholder";
  if (externalUrl) return "External resource · opens in a new tab";
  return "Not uploaded yet";
}

type DownloadRow = ReturnType<typeof getDownloads>[number];

function rowAction(download: DownloadRow) {
  if (download.file_path) {
    return (
      <a href={download.file_path} download className="btn btn-outline btn-sm shrink-0">
        <Download className="h-4 w-4" aria-hidden />
        Download
      </a>
    );
  }
  if (download.external_url) {
    return (
      <a
        href={download.external_url}
        target="_blank"
        rel="noreferrer noopener"
        className="btn btn-outline btn-sm shrink-0"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        Open
      </a>
    );
  }
  return (
    <button type="button" className="btn btn-outline btn-sm shrink-0" disabled title="Document not uploaded yet">
      Available on request
    </button>
  );
}

export default function DownloadsPage() {
  const downloads = getDownloads();
  const admissionEmail = getSetting("admission_email", "admissions@aarohan-institute.edu");

  const categories: { name: string; items: DownloadRow[] }[] = [];
  for (const download of downloads) {
    const existing = categories.find((group) => group.name === download.category);
    if (existing) existing.items.push(download);
    else categories.push({ name: download.category, items: [download] });
  }

  const prospectus =
    downloads.find((item) => /prospectus/i.test(item.title) || /prospectus/i.test(item.category)) ?? downloads[0];

  return (
    <>
      <PageHeader
        eyebrow="Resources"
        title="Prospectus, forms & handbooks"
        description="The documents families ask for most — prospectus, fee structure, admission checklist and the draft academic calendar — in one place."
        breadcrumbs={<Breadcrumbs items={[{ label: "Downloads" }]} />}
        meta={[
          { label: "Documents", value: String(downloads.length) },
          { label: "Categories", value: String(categories.length) },
          { label: "Session", value: "2027–28" },
          { label: "Format", value: "PDF · TXT" },
        ]}
      >
        <a href="#documents" className="btn btn-gold">
          <Download className="h-4 w-4" aria-hidden />
          Browse documents
        </a>
        <Link href="/admissions" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          Admission process
        </Link>
      </PageHeader>

      {/* prospectus highlight */}
      <section id="prospectus" className="container-page scroll-mt-32 py-16 md:py-24">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-stretch">
          <Reveal className="relative isolate overflow-hidden rounded-[2.5rem] bg-navy p-8 text-white md:p-10">
            <div className="absolute inset-0 grid-lines-light opacity-50" aria-hidden />
            <div className="relative">
              <p className="flex items-center gap-3 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-gold">
                <Award className="h-3.5 w-3.5" aria-hidden />
                Highlighted document
              </p>
              <h2 className="mt-4 text-[clamp(1.6rem,3vw,2.3rem)] leading-tight text-white">
                {prospectus?.title ?? "Institute Prospectus 2027–28"}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70">
                {prospectus?.description ??
                  "Programmes, campuses, facilities, admission process and a fee overview in a single document."}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-white/60">
                <span className="inline-flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-gold" aria-hidden />
                  {prospectus ? fileNote(prospectus.file_path, prospectus.external_url) : "Not uploaded yet"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5 text-gold" aria-hidden />
                  Category: {prospectus?.category ?? "Prospectus"}
                </span>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                {prospectus && (prospectus.file_path || prospectus.external_url) ? (
                  <a
                    href={prospectus.file_path || prospectus.external_url}
                    download={prospectus.file_path ? true : undefined}
                    target={prospectus.file_path ? undefined : "_blank"}
                    rel={prospectus.file_path ? undefined : "noreferrer noopener"}
                    className="btn btn-gold"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Download prospectus
                  </a>
                ) : (
                  <button type="button" className="btn btn-gold" disabled>
                    <Download className="h-4 w-4" aria-hidden />
                    Available on request
                  </button>
                )}
                <Link href="/contact" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
                  <Mail className="h-4 w-4" aria-hidden />
                  Request a copy
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80} className="flex">
            <div className="flex w-full flex-col justify-center rounded-[2rem] border border-dashed border-gold/70 bg-gold-100/60 p-7">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-100 text-gold-700">
                <Info className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold text-navy">Demo placeholder documents</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-body">
                Every file listed on this page is a sample placeholder created for this demonstration. Replace them
                with the institute&rsquo;s signed, up-to-date documents — and confirm file sizes and print quality —
                before the website goes live.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-navy/85">
                {["Prospectus and fee structure", "Admission checklist and forms", "Academic calendar and notices"].map(
                  (item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-royal" aria-hidden />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* grouped documents */}
      <section id="documents" className="scroll-mt-32 border-y border-line bg-paper py-16 md:py-24">
        <div className="container-page">
          <SectionHeading
            index="01"
            eyebrow="All Documents"
            title="Browse by category"
            description="Each row shows what the document covers and its format. Files download directly where a file has been uploaded."
          />

          {downloads.length === 0 ? (
            <EmptyState
              title="No downloads published yet"
              description="Documents added from Admin → Downloads will appear here once published."
              icon="document"
            />
          ) : (
            <div className="space-y-10">
              {categories.map((group, groupIndex) => (
                <div key={group.name}>
                  <div className="mb-4 flex items-center gap-4" aria-hidden>
                    <span className="section-index">{String(groupIndex + 1).padStart(2, "0")}</span>
                    <h3 className="font-ui text-sm font-extrabold uppercase tracking-[0.16em] text-navy">
                      {group.name}
                    </h3>
                    <span className="h-px flex-1 bg-line-strong" />
                    <span className="text-[11px] font-semibold text-slate-body">
                      {group.items.length} {group.items.length === 1 ? "file" : "files"}
                    </span>
                  </div>

                  <ul className="space-y-3">
                    {group.items.map((download, index) => (
                      <Reveal key={download.id} delay={index * 55} as="li">
                        <article className="flex flex-col gap-4 rounded-3xl border border-line bg-offwhite/60 p-5 transition hover:border-royal/40 hover:bg-paper sm:flex-row sm:items-center">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy text-gold">
                            <FileText className="h-5 w-5" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h4 className="text-[15px] font-bold leading-snug text-navy">{download.title}</h4>
                              <Badge tone="neutral">{download.category}</Badge>
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-slate-body">{download.description}</p>
                            <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-body">
                              {fileNote(download.file_path, download.external_url)}
                              {download.downloads_count > 0 ? ` · ${download.downloads_count} downloads` : ""}
                            </p>
                          </div>
                          <div className="sm:pl-4">{rowAction(download)}</div>
                        </article>
                      </Reveal>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16 md:py-24">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-line bg-paper p-8">
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-royal">Next step</p>
            <h2 className="mt-4 text-[clamp(1.5rem,2.6vw,2rem)] leading-tight text-navy">
              Read enough? Start the application.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-body">
              The six-step application collects your details, academic record, programme choice and documents in one
              sitting — you receive a reference number immediately.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admissions/apply" className="btn btn-navy">
                Apply now
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/scholarships" className="btn btn-outline">
                Scholarship details
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-line bg-navy p-8 text-white">
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-gold">Need a document?</p>
            <h2 className="mt-4 text-[clamp(1.5rem,2.6vw,2rem)] leading-tight text-white">
              Ask for a copy in an accessible format.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Large print, screen-reader friendly or regional-language summaries can be requested from the admission
              office — write to{" "}
              <a href={`mailto:${admissionEmail}`} className="font-semibold text-gold underline underline-offset-2">
                {admissionEmail}
              </a>
              .
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-gold">
                Contact the office
              </Link>
              <Link href="/accessibility" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
                Accessibility statement
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
