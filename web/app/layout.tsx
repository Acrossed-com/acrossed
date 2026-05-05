import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Background } from "@/components/Background";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acrossed — The cryptographic ALLOW/DENY layer for your apps",
  description:
    "A stateless security layer that sits in front of your app and answers ALLOW or DENY in under a millisecond. We never store your traffic — we just decide.",
  metadataBase: new URL("https://acrossed.com"),
  openGraph: {
    title: "Acrossed — Decide before you serve.",
    description:
      "Sub-millisecond, HMAC-signed, AES-256 encrypted rule decisions. Stateless by design — we decide, your servers store.",
    url: "https://acrossed.com",
    siteName: "Acrossed",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Acrossed — Decide before you serve.",
    description:
      "Sub-millisecond, HMAC-signed, stateless decision layer. Open source.",
  },
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#6E8BFF",
    colorBackground: "#0d1017",
    colorInputBackground: "#0a0c11",
    colorInputText: "#ECEDEE",
    colorText: "#ECEDEE",
    colorTextSecondary: "#A1A1AA",
    colorTextOnPrimaryBackground: "#07090d",
    colorDanger: "#EF6F6F",
    colorSuccess: "#5DD39E",
    colorNeutral: "#ECEDEE",
    fontFamily: "'Supreme', 'Switzer', system-ui, sans-serif",
    fontFamilyButtons: "'Supreme', 'Switzer', system-ui, sans-serif",
    fontSize: "14px",
    borderRadius: "8px",
    spacingUnit: "1rem",
  },
  elements: {
    rootBox: { width: "100%" },
    card: {
      backgroundColor: "#0d1017",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow:
        "0 30px 80px -30px rgba(0,0,0,0.6), 0 0 0 1px rgba(110,139,255,0.06)",
      borderRadius: "14px",
    },
    headerTitle: {
      fontFamily: "'Cabinet Grotesk', sans-serif",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "#ECEDEE",
    },
    headerSubtitle: { color: "#A1A1AA" },
    socialButtonsBlockButton: {
      backgroundColor: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#ECEDEE",
      "&:hover": { backgroundColor: "rgba(255,255,255,0.06)" },
    },
    formButtonPrimary: {
      backgroundColor: "#6E8BFF",
      color: "#07090d",
      fontWeight: 600,
      "&:hover": { backgroundColor: "#8AA1FF" },
      "&:focus": { boxShadow: "0 0 0 3px rgba(110,139,255,0.25)" },
    },
    formFieldInput: {
      backgroundColor: "#0a0c11",
      border: "1px solid rgba(255,255,255,0.1)",
      color: "#ECEDEE",
      "&:focus": {
        borderColor: "#6E8BFF",
        boxShadow: "0 0 0 3px rgba(110,139,255,0.15)",
      },
    },
    formFieldLabel: { color: "#C4C4CB", fontSize: "13px" },
    footerAction: { color: "#A1A1AA" },
    footerActionLink: {
      color: "#6E8BFF",
      "&:hover": { color: "#8AA1FF" },
    },
    identityPreview: {
      backgroundColor: "#0a0c11",
      border: "1px solid rgba(255,255,255,0.08)",
    },
    dividerLine: { background: "rgba(255,255,255,0.08)" },
    dividerText: { color: "#71717A" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en">
        <body className="min-h-screen antialiased text-ink-hi">
          <Background />
          <div className="relative z-10">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
