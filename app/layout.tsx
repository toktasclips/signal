import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Teneffüs",
    template: "%s · Teneffüs",
  },
  description: "Hot List & Sales Tracking OS — manage your leads and pipeline with clarity.",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F7F3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid #E7E7E0",
              color: "#111111",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  );
}
