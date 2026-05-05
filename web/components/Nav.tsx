"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { RiMenuLine as Menu, RiCloseLine as X } from "@remixicon/react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";

const PRIMARY_LINKS: Array<[string, string]> = [
  ["Product", "/how-it-works"],
  ["Performance", "/performance"],
  ["Security", "/security"],
  ["Pricing", "/pricing"],
];

const SECONDARY_LINKS: Array<[string, string]> = [
  ["Docs", "/docs"],
  ["Blog", "/blog"],
  ["Changelog", "/changelog"],
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (!isSignedIn) { setIsAdmin(false); return; }
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: { isAdmin: boolean }) => setIsAdmin(d.isAdmin ?? false))
      .catch(() => setIsAdmin(false));
  }, [isSignedIn]);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  }

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "#07090d",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="mx-auto flex h-[58px] max-w-page items-center px-5 sm:px-7">
        {/* Brand block */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <Mark />
          <span
            style={{
              fontFamily: "'Cabinet Grotesk', sans-serif",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#ECEDEE",
            }}
          >
            Acrossed
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 9.5,
              fontWeight: 500,
              padding: "2px 6px",
              borderRadius: 3,
              background: "rgba(255,255,255,0.05)",
              color: "#71717A",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginLeft: 2,
            }}
          >
            v1.0
          </span>
        </Link>

        {/* Desktop nav — left aligned, with vertical divider */}
        <div
          className="hidden lg:flex items-center ml-8 pl-8"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
        >
          <nav className="flex items-center gap-6 text-[13.5px]">
            {PRIMARY_LINKS.map(([label, href]) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    color: active ? "#ECEDEE" : "#A1A1AA",
                    transition: "color 120ms ease",
                    fontWeight: active ? 500 : 400,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ECEDEE"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = active ? "#ECEDEE" : "#A1A1AA"; }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div
            style={{
              width: 1,
              height: 14,
              background: "rgba(255,255,255,0.07)",
              margin: "0 24px",
            }}
          />

          <nav className="flex items-center gap-5 text-[13px]">
            {SECONDARY_LINKS.map(([label, href]) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    color: active ? "#ECEDEE" : "#71717A",
                    transition: "color 120ms ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ECEDEE"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = active ? "#ECEDEE" : "#71717A"; }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side — pushed right */}
        <div className="flex items-center gap-3 ml-auto">
          <SignedOut>
            <Link
              href="/sign-in"
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontSize: 13.5,
                color: "#A1A1AA",
                padding: "6px 12px",
                transition: "color 120ms ease",
              }}
              className="hidden sm:inline-flex"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ECEDEE"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#A1A1AA"; }}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
                color: "#07090d",
                background: "#ECEDEE",
                padding: "6px 14px",
                borderRadius: 6,
                transition: "background 120ms ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#ECEDEE"; }}
            >
              Get started
              <span style={{ opacity: 0.5, fontSize: 11 }}>→</span>
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontSize: 13.5,
                color: pathname.startsWith("/dashboard") ? "#ECEDEE" : "#A1A1AA",
                padding: "6px 12px",
                transition: "color 120ms ease",
                fontWeight: pathname.startsWith("/dashboard") ? 500 : 400,
              }}
              className="hidden sm:inline-flex"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ECEDEE"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = pathname.startsWith("/dashboard") ? "#ECEDEE" : "#A1A1AA"; }}
            >
              Dashboard
            </Link>
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 10.5,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#6E8BFF",
                  padding: "4px 8px",
                  borderRadius: 3,
                  background: "rgba(110,139,255,0.08)",
                  border: "1px solid rgba(110,139,255,0.18)",
                }}
                className="hidden sm:inline-flex"
              >
                Admin
              </Link>
            )}
            <div className="flex items-center" style={{ marginLeft: 4 }}>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md lg:hidden"
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#ECEDEE",
              background: open ? "rgba(255,255,255,0.04)" : "transparent",
            }}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="lg:hidden"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "#07090d",
          }}
        >
          <nav className="mx-auto flex max-w-page flex-col px-5 py-4">
            <p
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 10,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#71717A",
                marginBottom: 8,
                paddingLeft: 4,
              }}
            >
              Product
            </p>
            {PRIMARY_LINKS.map(([label, href]) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    padding: "10px 4px",
                    fontSize: 15,
                    color: active ? "#ECEDEE" : "#A1A1AA",
                    fontWeight: active ? 500 : 400,
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {label}
                </Link>
              );
            })}

            <p
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 10,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#71717A",
                marginTop: 20,
                marginBottom: 8,
                paddingLeft: 4,
              }}
            >
              Resources
            </p>
            {SECONDARY_LINKS.map(([label, href]) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    padding: "10px 4px",
                    fontSize: 15,
                    color: active ? "#ECEDEE" : "#A1A1AA",
                    fontWeight: active ? 500 : 400,
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {label}
                </Link>
              );
            })}

            <SignedOut>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }} className="sm:hidden">
                <Link
                  href="/sign-in"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "10px 14px",
                    fontSize: 14,
                    color: "#ECEDEE",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 6,
                  }}
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "10px 14px",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#07090d",
                    background: "#ECEDEE",
                    borderRadius: 6,
                  }}
                >
                  Get started →
                </Link>
              </div>
            </SignedOut>

            <SignedIn>
              <div style={{ marginTop: 20 }}>
                <Link
                  href="/dashboard"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "10px 14px",
                    fontSize: 14,
                    color: "#07090d",
                    background: "#ECEDEE",
                    borderRadius: 6,
                    fontWeight: 500,
                  }}
                >
                  Open dashboard
                </Link>
                {isAdmin && (
                  <Link
                    href="/dashboard/admin"
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "10px 14px",
                      fontSize: 13,
                      marginTop: 8,
                      color: "#6E8BFF",
                      background: "rgba(110,139,255,0.08)",
                      border: "1px solid rgba(110,139,255,0.18)",
                      borderRadius: 6,
                    }}
                  >
                    Admin panel
                  </Link>
                )}
              </div>
            </SignedIn>
          </nav>
        </div>
      )}
    </header>
  );
}

function Mark() {
  return (
    <div
      style={{
        position: "relative",
        width: 24,
        height: 24,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="20" height="22" viewBox="0 0 1087.05 1280.28" fill="none" aria-hidden style={{ display: "block" }}><path fill="#ECEDEE" d="M0,1280.28h136.38l296.35-349h336.93l-79,349h106.55L1087.05,0Zm793.17-453h-272.21l371.2-437.2Z"/></svg>
      </div>
  );
}
