"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  GraduationCap,
  Mail,
  Menu,
  Phone,
  X,
  } from "lucide-react";
import { FacebookIcon, InstagramIcon, LinkedInIcon, YouTubeIcon } from "@/components/ui/social-icons";
import { cn } from "@/lib/cn";

export type NavCourse = { name: string; slug: string; degreeLevel: string; department: string };
export type NavDepartment = { name: string; slug: string };

type NavLink = {
  label: string;
  href: string;
  children?: { label: string; href: string; meta?: string }[];
};

export function SiteHeader({
  instituteName,
  shortName,
  monogram,
  helpline,
  email,
  announcement,
  announcementLink,
  portalHref,
  courses,
  departments,
}: {
  instituteName: string;
  shortName: string;
  monogram: string;
  helpline: string;
  email: string;
  announcement: string;
  announcementLink: string;
  portalHref: string;
  courses: NavCourse[];
  departments: NavDepartment[];
}) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(68);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [desktopGroup, setDesktopGroup] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileOpen(false);
      setOpenGroup(null);
      setDesktopGroup(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      setHeaderHeight(headerRef.current?.offsetHeight ?? 68);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const ugCourses = courses.filter((course) => course.degreeLevel === "Undergraduate");
  const pgCourses = courses.filter((course) => course.degreeLevel === "Postgraduate");
  const otherCourses = courses.filter(
    (course) => !["Undergraduate", "Postgraduate"].includes(course.degreeLevel),
  );

  const links: NavLink[] = [
    { label: "Home", href: "/" },
    {
      label: "About Us",
      href: "/about",
      children: [
        { label: "Overview & history", href: "/about#overview" },
        { label: "Vision, mission & values", href: "/about#vision" },
        { label: "Leadership & director's message", href: "/about#leadership" },
        { label: "Accreditations & affiliations", href: "/about#accreditations" },
        { label: "Downloads", href: "/downloads" },
      ],
    },
    {
      label: "Academics",
      href: "/academics",
      children: [
        { label: "Academic overview", href: "/academics", meta: "Six schools of study" },
        ...departments.map((department) => ({
          label: department.name,
          href: `/academics#${department.slug}`,
          meta: "Department",
        })),
        { label: "Faculty directory", href: "/faculty", meta: "Profiles & research" },
        { label: "Placements & career services", href: "/placements" },
      ],
    },
    {
      label: "Courses",
      href: "/courses",
      children: [
        { label: "All programmes", href: "/courses", meta: `${courses.length} programmes` },
        ...ugCourses.map((course) => ({ label: course.name, href: `/courses/${course.slug}`, meta: course.department })),
        ...pgCourses.map((course) => ({ label: course.name, href: `/courses/${course.slug}`, meta: course.department })),
        ...otherCourses.map((course) => ({ label: course.name, href: `/courses/${course.slug}`, meta: course.department })),
      ],
    },
    { label: "Faculty", href: "/faculty" },
    { label: "Campus Life", href: "/campus-life" },
    {
      label: "Admissions",
      href: "/admissions",
      children: [
        { label: "Admission overview", href: "/admissions" },
        { label: "Apply online", href: "/admissions/apply", meta: "Six-step application" },
        { label: "Track application status", href: "/admissions/track" },
        { label: "Eligibility & dates", href: "/admissions#dates" },
        { label: "Scholarships & financial aid", href: "/scholarships" },
        { label: "Admission FAQs", href: "/faqs" },
      ],
    },
    {
      label: "News & Events",
      href: "/news",
      children: [
        { label: "News & notices", href: "/news" },
        { label: "Events calendar", href: "/events" },
        { label: "Campus gallery", href: "/campus-life#gallery" },
      ],
    },
    { label: "Contact Us", href: "/contact" },
  ];

  const openDesktopGroup = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDesktopGroup(label);
  };
  const scheduleDesktopClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setDesktopGroup(null), 160);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div ref={headerRef} className="sticky top-0 z-50 no-print">
      {/* utility bar */}
      <div className="hidden border-b border-white/10 bg-navy text-white lg:block">
        <div className="container-page flex items-center justify-between gap-6 py-2 text-xs">
          <div className="flex items-center gap-5">
            <a href={`tel:${helpline.replace(/\s/g, "")}`} className="flex items-center gap-1.5 text-white/80 transition hover:text-gold">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              <span>Admission helpline</span>
              <span className="font-semibold text-white">{helpline}</span>
            </a>
            <a href={`mailto:${email}`} className="flex items-center gap-1.5 text-white/80 transition hover:text-gold">
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {email}
            </a>
            <span className="hidden items-center gap-1.5 text-white/70 xl:flex">
              <CalendarDays className="h-3.5 w-3.5 text-gold" aria-hidden />
              Applications close 31 July 2027
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href={portalHref} className="text-white/80 transition hover:text-gold">
              Student Portal
            </Link>
            <span className="hidden h-3 w-px bg-white/20 xl:block" aria-hidden />
            <div className="hidden items-center gap-3 text-white/70 xl:flex">
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer noopener" aria-label="LinkedIn" className="transition hover:text-gold">
                <LinkedInIcon className="h-3.5 w-3.5" />
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noreferrer noopener" aria-label="Instagram" className="transition hover:text-gold">
                <InstagramIcon className="h-3.5 w-3.5" />
              </a>
              <a href="https://www.facebook.com" target="_blank" rel="noreferrer noopener" aria-label="Facebook" className="transition hover:text-gold">
                <FacebookIcon className="h-3.5 w-3.5" />
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noreferrer noopener" aria-label="YouTube" className="transition hover:text-gold">
                <YouTubeIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* main bar */}
      <div
        className={cn(
          "border-b bg-white/95 backdrop-blur transition-shadow",
          scrolled ? "border-line shadow-[0_10px_30px_-24px_rgba(20,43,74,0.6)]" : "border-transparent",
        )}
      >
        <div className="container-page flex h-[68px] items-center justify-between gap-4 lg:h-[76px]">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-sm font-extrabold tracking-tight text-gold transition group-hover:bg-royal">
              {monogram}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-[17px] font-semibold leading-tight text-navy lg:text-[19px]">
                {instituteName}
              </span>
              <span className="block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-body">
                Higher Education · Demo Institute
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 xl:flex">
            {links.map((link) => {
              const hasChildren = Boolean(link.children?.length);
              const active = isActive(link.href);
              return (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => (hasChildren ? openDesktopGroup(link.label) : scheduleDesktopClose())}
                  onMouseLeave={scheduleDesktopClose}
                >
                  <div className="flex items-center">
                    <Link
                      href={link.href}
                      className={cn(
                        "relative flex items-center gap-1 rounded-full px-3 py-2 font-ui text-[13.5px] font-semibold transition",
                        active ? "text-royal" : "text-navy hover:text-royal",
                        active &&
                          "after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-gold after:content-['']",
                      )}
                      aria-expanded={hasChildren ? desktopGroup === link.label : undefined}
                    >
                      {link.label}
                      {hasChildren ? (
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition-transform",
                            desktopGroup === link.label && "rotate-180",
                          )}
                          aria-hidden
                        />
                      ) : null}
                    </Link>
                  </div>

                  {hasChildren && desktopGroup === link.label ? (
                    <div className="absolute left-1/2 top-full z-50 w-[540px] -translate-x-1/2 pt-4">
                      <div className="animate-scale-in overflow-hidden rounded-3xl border border-line bg-paper p-2.5 shadow-[var(--shadow-pop)]">
                        <div className="grid max-h-[62vh] grid-cols-2 gap-1 overflow-y-auto px-1 pb-1">
                          {link.children!.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="rounded-2xl px-3.5 py-3 transition hover:bg-offwhite"
                              onClick={() => setDesktopGroup(null)}
                            >
                              <span className="block font-ui text-[13px] font-bold text-navy">{child.label}</span>
                              {child.meta ? (
                                <span className="mt-0.5 block text-[11px] text-slate-body">{child.meta}</span>
                              ) : null}
                            </Link>
                          ))}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-3 rounded-2xl bg-navy px-4 py-3">
                          <p className="text-[11px] leading-snug text-white/65">
                            Admissions open for the 2027–28 session
                          </p>
                          <Link
                            href="/admissions/apply"
                            onClick={() => setDesktopGroup(null)}
                            className="text-[11px] font-bold text-gold hover:underline"
                          >
                            Apply now →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/admissions/apply"
              className="btn btn-gold hidden !px-5 !py-3 text-sm sm:inline-flex"
            >
              <GraduationCap className="h-4 w-4" aria-hidden />
              Apply Now
            </Link>
            <a
              href={`tel:${helpline.replace(/\s/g, "")}`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line text-navy transition hover:border-royal hover:text-royal lg:hidden"
              aria-label={`Call admission helpline ${helpline}`}
            >
              <Phone className="h-5 w-5" aria-hidden />
            </a>
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white transition hover:bg-navy-800 xl:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {/* announcement strip */}
      {announcement ? (
        <div className="border-b border-white/10 bg-navy-800">
          <div className="container-page flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2.5 text-center text-xs text-white/75">
            <span className="rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-navy">
              Notice
            </span>
            <Link href={announcementLink || "/admissions"} className="font-semibold text-gold underline-offset-4 hover:underline">
              {announcement}
            </Link>
            <span className="hidden text-white/45 sm:inline">· Applications close 31 July 2027</span>
          </div>
        </div>
      ) : null}

      {/* mobile navigation */}
      <div
        id="mobile-navigation"
        hidden={!mobileOpen}
        style={{ top: headerHeight }}
        className="fixed inset-x-0 bottom-0 z-40 overflow-y-auto border-t border-line bg-white xl:hidden"
      >
        <div className="container-page flex flex-col gap-1 py-4 pb-28">
          {links.map((link) => {
            const hasChildren = Boolean(link.children?.length);
            const expanded = openGroup === link.label;
            return (
              <div key={link.label} className="border-b border-line/70 last:border-0">
                <div className="flex items-center">
                  <Link
                    href={link.href}
                    className={cn(
                      "flex-1 rounded-xl px-3 py-3.5 text-base font-semibold transition",
                      isActive(link.href) ? "text-royal" : "text-navy",
                    )}
                  >
                    {link.label}
                  </Link>
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => setOpenGroup(expanded ? null : link.label)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-body transition hover:bg-offwhite"
                      aria-expanded={expanded}
                      aria-label={`${expanded ? "Collapse" : "Expand"} ${link.label}`}
                    >
                      <ChevronDown className={cn("h-5 w-5 transition-transform", expanded && "rotate-180")} aria-hidden />
                    </button>
                  ) : null}
                </div>
                {hasChildren && expanded ? (
                  <div className="mb-2 ml-2 flex flex-col gap-1 rounded-xl bg-offwhite p-2">
                    {link.children!.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="rounded-lg px-3 py-2.5 text-sm text-slate-body transition hover:bg-white hover:text-royal"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className="mt-4 grid grid-cols-1 gap-2">
            <Link href="/admissions/apply" className="btn btn-primary w-full">
              <GraduationCap className="h-4 w-4" aria-hidden />
              Apply for Admission
            </Link>
            <Link href="/admissions/track" className="btn btn-outline w-full">
              Track Application
            </Link>
            <a href={`tel:${helpline.replace(/\s/g, "")}`} className="btn btn-navy w-full">
              <Phone className="h-4 w-4" aria-hidden />
              Call {helpline}
            </a>
            <Link href={portalHref} className="btn btn-ghost w-full">
              Student Portal
            </Link>
          </div>
          <p className="mt-3 px-1 text-xs text-slate-body">
            {shortName} · {email}
          </p>
        </div>
      </div>
    </div>
  );
}
