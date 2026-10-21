import type { Metadata } from "next";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { getSetting } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const name = getSetting("institute_name") ?? "Aarohan Institute of Higher Education";
  const tagline = getSetting("tagline") ?? "Discover Your Potential. Build Your Future.";
  return {
    metadataBase: new URL(getSetting("site_url") ?? "http://localhost:3000"),
    title: {
      default: `${name} | ${tagline}`,
      template: `%s | ${name}`,
    },
    description:
      "Aarohan Institute of Higher Education — undergraduate, postgraduate, diploma and professional programmes with industry-oriented learning, experienced faculty and dedicated career support. (Demo website built by Agentiva.)",
    applicationName: name,
    openGraph: {
      type: "website",
      siteName: name,
      title: `${name} | ${tagline}`,
      description:
        "Explore programmes, campus life, admissions and career opportunities at Aarohan Institute of Higher Education.",
      images: ["/images/hero-campus.jpg"],
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
