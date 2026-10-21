"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/cn";

export const CHART_COLORS = ["#0b6b5c", "#e8a33d", "#14746f", "#b7791f", "#285cc4", "#16845b", "#8c6118", "#d64545"];

function Card({
  title,
  subtitle,
  action,
  children,
  className,
  ariaLabel,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <section className={cn("card flex flex-col p-5 sm:p-6", className)} aria-label={ariaLabel ?? title}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-navy">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-body">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

export { Card as ChartCard };

const tooltipStyle = {
  backgroundColor: "#0b2621",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
  padding: "8px 10px",
} as const;

export function TrendChart({
  data,
  ariaLabel,
}: {
  data: { day: string; enquiries: number; applications: number }[];
  ariaLabel: string;
}) {
  const formatted = data.map((row) => ({ ...row, label: row.day.slice(5) }));
  return (
    <div className="h-[260px] w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="gEnq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0b6b5c" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#0b6b5c" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gApp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e8a33d" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#e8a33d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5a6763" }} tickLine={false} axisLine={{ stroke: "#e7e1d5" }} minTickGap={18} />
          <YAxis tick={{ fontSize: 11, fill: "#5a6763" }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#e7e1d5" }} />
          <Area type="monotone" dataKey="enquiries" name="Enquiries" stroke="#0b6b5c" strokeWidth={2.4} fill="url(#gEnq)" />
          <Area type="monotone" dataKey="applications" name="Applications" stroke="#e8a33d" strokeWidth={2.4} fill="url(#gApp)" />
          <Legend wrapperStyle={{ fontSize: 12, color: "#5a6763", paddingTop: 8 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBarChart({
  data,
  ariaLabel,
  color = "#0b6b5c",
  layout = "vertical",
}: {
  data: { label: string; count: number }[];
  ariaLabel: string;
  color?: string;
  layout?: "vertical" | "horizontal";
}) {
  const rows = data.map((row) => ({
    ...row,
    short: row.label.length > 24 ? `${row.label.slice(0, 22)}…` : row.label,
  }));

  if (layout === "horizontal") {
    return (
      <div className="h-[260px] w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: "#5a6763" }} allowDecimals={false} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="short" tick={{ fontSize: 11, fill: "#5a6763" }} axisLine={false} tickLine={false} width={140} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(11,107,92,0.06)" }} />
            <Bar dataKey="count" name="Count" radius={[0, 8, 8, 0]} barSize={16}>
              {rows.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 6, right: 8, left: -18, bottom: 40 }}>
          <XAxis dataKey="short" tick={{ fontSize: 10, fill: "#5a6763" }} tickLine={false} axisLine={{ stroke: "#e7e1d5" }} angle={-24} textAnchor="end" height={60} interval={0} />
          <YAxis tick={{ fontSize: 11, fill: "#5a6763" }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(11,107,92,0.06)" }} />
          <Bar dataKey="count" name="Count" radius={[8, 8, 0, 0]} maxBarSize={46}>
            {rows.map((_, index) => (
              <Cell key={index} fill={index === 0 ? color : CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({ data, ariaLabel }: { data: { label: string; count: number }[]; ariaLabel: string }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="h-[190px] w-full max-w-[220px] shrink-0" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2.5 text-[12.5px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-slate-body">{item.label}</span>
            <span className="font-bold text-navy">{item.count}</span>
            <span className="w-10 text-right text-[11px] text-slate-body">
              {total ? Math.round((item.count / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FunnelList({ stages }: { stages: { label: string; value: number; percent: number }[] }) {
  return (
    <ol className="space-y-3.5">
      {stages.map((stage, index) => (
        <li key={stage.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[12.5px]">
            <span className="flex items-center gap-2 text-slate-body">
              <span className="section-index">{String(index + 1).padStart(2, "0")}</span>
              {stage.label}
            </span>
            <span className="font-bold text-navy">
              {stage.value}
              <span className="ml-1.5 text-[11px] font-medium text-slate-body">{stage.percent}%</span>
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-offwhite">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(stage.percent, 2)}%`,
                background: `linear-gradient(90deg, ${CHART_COLORS[index % CHART_COLORS.length]}, ${CHART_COLORS[index % CHART_COLORS.length]}bb)`,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function SparklineTrend({ data, color = "#0b6b5c" }: { data: number[]; color?: string }) {
  const points = data
    .map((value, index) => `${(index / Math.max(1, data.length - 1)) * 100},${40 - Math.min(40, value * 4)}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 40" className="h-10 w-full" preserveAspectRatio="none" aria-hidden>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LineTrend({ data }: { data: { day: string; value: number }[] }) {
  const formatted = data.map((row) => ({ label: row.day.slice(5), value: row.value }));
  return (
    <div className="h-24 w-full" role="img" aria-label="Trend over the selected period">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
          <XAxis dataKey="label" hide />
          <YAxis tick={false} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="value" name="Count" stroke="#0b6b5c" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
