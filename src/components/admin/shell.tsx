"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions/auth";
import { markAllReadAction, markReadAction } from "@/app/admin/actions/notifications";
import { QUICK_CREATE, ROLE_BADGES, visibleNav, type AdminNavItem } from "./nav";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format";
import type { PermissionKey } from "@/lib/rbac";

export type ShellNotification = {
  id: number;
  title: string;
  body: string;
  link: string;
  type: string;
  created_at: string;
  read_at: string | null;
};

export type ShellUser = {
  name: string;
  email: string;
  roleKey: string;
  roleName: string;
  designation: string;
};

const TONE_DOT: Record<string, string> = {
  urgent: "bg-danger",
  warning: "bg-amber",
  success: "bg-success",
  info: "bg-royal",
};

function useBreadcrumbs(pathname: string, nav: AdminNavItem[]) {
  return useMemo(() => {
    const segments = pathname.split("/").filter(Boolean); // ["admin","enquiries","42"]
    const crumbs: { label: string; href?: string }[] = [{ label: "Admin", href: "/admin/dashboard" }];
    if (segments.length <= 1) {
      crumbs.push({ label: "Dashboard" });
      return crumbs;
    }
    const sectionKey = `/${segments[1]}`;
    const item = nav.find((entry) => entry.href === sectionKey || entry.href.startsWith(`${sectionKey}/`));
    if (item) crumbs.push({ label: item.label, href: item.href });
    else crumbs.push({ label: segments[1].replace(/-/g, " ") });

    if (segments[2]) {
      const child = item?.children?.find((entry) => entry.href.includes(segments[2]));
      const isAction = ["new", "edit"].includes(segments[2]);
      crumbs.push({
        label: isAction
          ? segments[2] === "new"
            ? "New record"
            : "Edit record"
          : child?.label ?? (Number.isNaN(Number(segments[2])) ? segments[2].replace(/-/g, " ") : `#${segments[2]}`),
      });
    }
    return crumbs;
  }, [pathname, nav]);
}

export function AdminShell({
  user,
  permissions,
  notifications,
  unreadCount,
  badges,
  children,
}: {
  user: ShellUser;
  permissions: PermissionKey[];
  notifications: ShellNotification[];
  unreadCount: number;
  badges: { enquiries: number; applications: number };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = useMemo(() => visibleNav(permissions), [permissions]);
  const crumbs = useBreadcrumbs(pathname, nav);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [notifItems, setNotifItems] = useState(notifications);
  const [prevNotifications, setPrevNotifications] = useState(notifications);
  if (prevNotifications !== notifications) {
    // Adopt freshly revalidated notifications without an effect round-trip.
    setPrevNotifications(notifications);
    setNotifItems(notifications);
  }

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Defer the reset so React does not treat it as a cascading render on navigation.
    const timer = setTimeout(() => {
      setMobileOpen(false);
      setNotifOpen(false);
      setProfileOpen(false);
      setQuickOpen(false);
      setOpenGroup(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
      if (quickRef.current && !quickRef.current.contains(target)) setQuickOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const quickItems = QUICK_CREATE.filter((item) => permissions.includes(item.permission));

  const badgeValue = (item: AdminNavItem) => {
    if (item.badge === "enquiries") return badges.enquiries;
    if (item.badge === "applications") return badges.applications;
    return 0;
  };

  const markRead = async (id: number) => {
    setNotifItems((items) => items.map((item) => (item.id === id ? { ...item, read_at: new Date().toISOString() } : item)));
    await markReadAction(id);
    router.refresh();
  };

  const markAll = async () => {
    setNotifItems((items) => items.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })));
    await markAllReadAction();
    router.refresh();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* brand */}
      <div className={cn("flex items-center gap-3 border-b border-white/10 px-5 py-4", collapsed && "justify-center px-0")}>
        <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-extrabold text-gold">
            AI
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] font-semibold text-white">Aarohan Admin</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Admission CRM</span>
            </span>
          ) : null}
        </Link>
      </div>

      {/* nav */}
      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`) || pathname.startsWith(`${item.href}?`);
            const hasChildren = Boolean(item.children?.length);
            const groupOpen = openGroup === item.label;
            const count = badgeValue(item);
            return (
              <li key={item.label}>
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition",
                      active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/[0.06] hover:text-white",
                      collapsed && "justify-center px-0",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-gold" : "text-white/50 group-hover:text-gold")} />
                    {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
                    {!collapsed && count > 0 ? (
                      <span className="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-navy">
                        {count}
                      </span>
                    ) : null}
                    {!collapsed && active && !hasChildren ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
                    ) : null}
                  </Link>
                  {!collapsed && hasChildren ? (
                    <button
                      type="button"
                      onClick={() => setOpenGroup(groupOpen ? null : item.label)}
                      className="ml-1 rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
                      aria-expanded={groupOpen}
                      aria-label={`${groupOpen ? "Collapse" : "Expand"} ${item.label}`}
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform", groupOpen && "rotate-180")} />
                    </button>
                  ) : null}
                </div>

                {!collapsed && hasChildren && groupOpen ? (
                  <ul className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                    {item.children!.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "block rounded-lg px-2.5 py-2 text-[12.5px] transition",
                              childActive ? "bg-white/10 font-bold text-white" : "text-white/50 hover:text-white",
                            )}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>

        {!collapsed ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-gold">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Demo workspace
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-white/55">
              Seeded with 45 enquiries, 15 applications and full website content. Every figure in this panel is
              calculated from stored records.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-gold hover:underline"
            >
              View public site →
            </Link>
          </div>
        ) : null}
      </nav>

      {/* footer */}
      <div className={cn("border-t border-white/10 px-3 py-3", collapsed && "px-2")}>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className={cn(
            "hidden w-full items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold text-white/50 transition hover:bg-white/10 hover:text-white lg:flex",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed ? "Collapse" : null}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-offwhite">
      {/* sidebar (desktop) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col bg-navy transition-[width] duration-300 lg:flex",
          collapsed ? "w-[78px]" : "w-[264px]",
        )}
      >
        {sidebarContent}
      </aside>

      {/* sidebar (mobile drawer) */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />
          <div className="absolute inset-y-0 left-0 w-[278px] bg-navy shadow-[var(--shadow-pop)]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      ) : null}

      {/* workspace */}
      <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-[78px]" : "lg:pl-[264px]")}>
        {/* topbar */}
        <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-navy lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 md:block">
              <ol className="flex items-center gap-1.5 text-[12.5px] text-slate-body">
                {crumbs.map((crumb, index) => {
                  const last = index === crumbs.length - 1;
                  return (
                    <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                      {crumb.href && !last ? (
                        <Link href={crumb.href} className="transition hover:text-royal">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={cn("truncate font-semibold", last ? "text-navy" : "")}>{crumb.label}</span>
                      )}
                      {!last ? <span className="text-line-strong">/</span> : null}
                    </li>
                  );
                })}
              </ol>
            </nav>

            <div className="relative hidden flex-1 md:block md:max-w-xs lg:max-w-sm">
              <form action="/admin/search" method="GET">
                <label htmlFor="global-search" className="sr-only">
                  Search enquiries, applications, courses
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-body" aria-hidden />
                <input
                  id="global-search"
                  name="q"
                  type="search"
                  placeholder="Search everything…"
                  className="field !py-2 !pl-9 !text-[13px]"
                />
              </form>
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {/* quick create */}
              <div className="relative" ref={quickRef}>
                <button
                  type="button"
                  onClick={() => setQuickOpen((value) => !value)}
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-royal px-3 text-[13px] font-bold text-white transition hover:bg-royal-600"
                  aria-expanded={quickOpen}
                  aria-haspopup="menu"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create</span>
                  <ChevronDown className="hidden h-3.5 w-3.5 sm:block" />
                </button>
                {quickOpen && quickItems.length > 0 ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-paper p-1.5 shadow-[var(--shadow-pop)]" role="menu">
                    {quickItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-navy transition hover:bg-offwhite"
                      >
                        <item.icon className="h-4 w-4 text-royal" aria-hidden />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((value) => !value)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line text-navy transition hover:border-royal hover:text-royal"
                  aria-expanded={notifOpen}
                  aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-extrabold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </button>

                {notifOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-line bg-paper shadow-[var(--shadow-pop)]" role="dialog" aria-label="Notifications">
                    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                      <p className="text-sm font-bold text-navy">Notifications</p>
                      <button type="button" onClick={markAll} className="text-xs font-bold text-royal hover:underline">
                        Mark all read
                      </button>
                    </div>
                    <ul className="max-h-[320px] overflow-y-auto">
                      {notifItems.length === 0 ? (
                        <li className="px-4 py-8 text-center text-sm text-slate-body">You are all caught up.</li>
                      ) : (
                        notifItems.map((item) => (
                          <li key={item.id} className={cn("border-b border-line/70 last:border-0", !item.read_at && "bg-royal-100/40")}>
                            <button
                              type="button"
                              onClick={() => {
                                if (!item.read_at) void markRead(item.id);
                                if (item.link) router.push(item.link);
                              }}
                              className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-offwhite"
                            >
                              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", TONE_DOT[item.type] ?? "bg-royal")} aria-hidden />
                              <span className="min-w-0 flex-1">
                                <span className="block text-[13px] font-bold leading-snug text-navy">{item.title}</span>
                                <span className="mt-0.5 block text-xs leading-relaxed text-slate-body">{item.body}</span>
                                <span className="mt-1 block text-[11px] text-slate-body/80">{relativeTime(item.created_at)}</span>
                              </span>
                              {!item.read_at ? <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-royal" aria-hidden /> : null}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>

              {/* profile */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-xl border border-line py-1.5 pl-1.5 pr-2.5 transition hover:border-royal"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy text-[11px] font-extrabold text-gold">
                    {user.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-[140px] truncate text-[12.5px] font-bold leading-tight text-navy">{user.name}</span>
                    <span className="block text-[10px] uppercase tracking-wide text-slate-body">{ROLE_BADGES[user.roleKey]}</span>
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-slate-body sm:block" />
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-paper shadow-[var(--shadow-pop)]" role="menu">
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-sm font-bold text-navy">{user.name}</p>
                      <p className="truncate text-xs text-slate-body">{user.email}</p>
                      <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-royal-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-royal">
                        {user.roleName}
                      </p>
                    </div>
                    <div className="p-1.5">
                      <Link href="/admin/settings" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-navy hover:bg-offwhite">
                        <Settings className="h-4 w-4 text-royal" aria-hidden />
                        Settings
                      </Link>
                      <Link href="/admin/profile" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-navy hover:bg-offwhite">
                        <UserRound className="h-4 w-4 text-royal" aria-hidden />
                        My profile
                      </Link>
                      <Link href="/admin/dashboard" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-navy hover:bg-offwhite">
                        <LayoutDashboard className="h-4 w-4 text-royal" aria-hidden />
                        Dashboard
                      </Link>
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          role="menuitem"
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-danger hover:bg-danger-100"
                        >
                          <LogOut className="h-4 w-4" aria-hidden />
                          Sign out
                        </button>
                      </form>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* mobile search */}
          <div className="border-t border-line px-4 py-2 md:hidden">
            <form action="/admin/search" method="GET">
              <label htmlFor="mobile-search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-body" aria-hidden />
                <input
                  id="mobile-search"
                  name="q"
                  type="search"
                  placeholder="Search enquiries, applications…"
                  className="field !py-2 !pl-9 !text-[13px]"
                />
              </div>
            </form>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>

        <footer className="border-t border-line px-4 py-5 text-center text-[11px] text-slate-body sm:px-6 md:text-left">
          <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 md:justify-start">
            <span>{user.designation || user.roleName}</span>
            <span aria-hidden>·</span>
            <span>Access enforced server-side by role</span>
            <span aria-hidden>·</span>
            <CircleAlert className="h-3.5 w-3.5 text-royal" aria-hidden />
            <span>Demo data — not real student records</span>
          </span>
        </footer>
      </div>
    </div>
  );
}
