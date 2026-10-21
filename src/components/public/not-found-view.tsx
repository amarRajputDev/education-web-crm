import Link from "next/link";
import { ArrowRight, Compass, Search } from "lucide-react";

const SUGGESTIONS = [
  { label: "All programmes", href: "/courses" },
  { label: "Admissions", href: "/admissions" },
  { label: "Apply online", href: "/admissions/apply" },
  { label: "Track application", href: "/admissions/track" },
  { label: "Faculty directory", href: "/faculty" },
  { label: "Campus life", href: "/campus-life" },
  { label: "News & events", href: "/news" },
  { label: "Contact us", href: "/contact" },
];

export function NotFoundView() {
  return (
    <section className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-navy px-6 py-20 text-center text-white">
      <div className="absolute inset-0 grid-lines-light opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-royal/40 blur-[110px]" aria-hidden />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-gold/12 blur-[100px]" aria-hidden />

      <div className="relative w-full max-w-3xl">
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.3em] text-gold">Error 404</p>
        <p className="mt-6 font-display text-[clamp(5rem,20vw,11rem)] font-semibold leading-[0.85] text-white">
          404
        </p>
        <h1 className="mt-6 text-[clamp(1.6rem,4vw,2.6rem)] leading-tight text-white">
          This page took an unplanned study break.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/65 md:text-base">
          The address may have changed, or the page was never published. Try one of the routes below, or search our
          programmes from the courses page.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="btn btn-gold btn-lg">
            <Compass className="h-4 w-4" aria-hidden />
            Back to home
          </Link>
          <Link href="/courses" className="btn btn-outline btn-lg !border-white/25 !text-white hover:!bg-white/10">
            <Search className="h-4 w-4" aria-hidden />
            Explore programmes
          </Link>
        </div>

        <nav aria-label="Suggested pages" className="mt-12">
          <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.26em] text-white/45">Popular destinations</p>
          <ul className="mt-5 flex flex-wrap justify-center gap-2.5">
            {SUGGESTIONS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-gold hover:text-gold"
                >
                  {item.label}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-12 text-xs text-white/40">
          Need help? Call the admission helpline on +91 98200 41127 or write to admissions@aarohan-institute.edu.
        </p>
      </div>
    </section>
  );
}
