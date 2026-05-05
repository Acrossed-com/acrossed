"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiDashboardLine as LayoutDashboard, RiBankCardLine as CreditCard, RiShieldCheckLine as ShieldCheck, RiInboxLine as Inbox } from "@remixicon/react";
type Tab = [string, string, React.ElementType];

export function DashboardTabs({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const TABS: Tab[] = [
    ["Projects", "/dashboard", LayoutDashboard],
    ["Billing", "/dashboard/billing", CreditCard],
    ...(isAdmin ? [["Admin", "/dashboard/admin", ShieldCheck] as Tab, ["Inbox", "/dashboard/admin/inbox", Inbox] as Tab] : []),
  ];

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="flex gap-1 rounded-lg p-1"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        display: "inline-flex",
      }}
    >
      {TABS.map(([label, href, Icon]) => {
        const active = isActive(href);
        const adminStyle = label === "Admin";
        return (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm tracking-wide transition-all duration-150"
            style={{
              background: active ? (adminStyle ? "rgba(110,139,255,0.12)" : "rgba(255,255,255,0.07)") : "transparent",
              color: active
                ? adminStyle ? "rgba(110,139,255,1)" : "#ECEDEE"
                : adminStyle ? "rgba(110,139,255,0.65)" : "#A1A1AA",
              boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.08)" : "none",
            }}
          >
            <Icon className="h-3.5 w-3.5" style={{ opacity: active ? 0.9 : 0.6 }} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
