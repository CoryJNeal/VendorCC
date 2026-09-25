"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileStack,
  Server,
  DollarSign,
  Shirt,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { CRM_VENDOR } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: FileStack },
  { href: "/ftp", label: "FTP Access", icon: Server },
  { href: "/pricing", label: "Pricing Setup", icon: DollarSign },
  { href: "/styles", label: "Style Setup", icon: Shirt },
  { href: "/reporting", label: "Reporting", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-[#0f2a32] transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-white/10 px-5 py-6">
          <p className="font-heading text-xl font-semibold tracking-tight text-[#e8f3f1]">
            Vendor Command Center
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#7eb8ad]">
            Ops workspace
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-[#1a4a52] text-white"
                    : "text-[#b7d4ce] hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-5 py-4 text-xs text-[#8fb8b0]">
          <p className="font-medium text-[#d5ebe6]">{CRM_VENDOR.name}</p>
          <p className="mt-1">From {CRM_VENDOR.source}</p>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#d5e3df] bg-[#f4f8f7]/80 px-4 py-3 backdrop-blur-md lg:px-8">
          <Button
            variant="outline"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            {open ? <X /> : <Menu />}
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#17343a]">
              {CRM_VENDOR.name}
            </p>
            <p className="truncate text-xs text-[#5f7a76]">
              {CRM_VENDOR.category} · CRM-linked vendor record
            </p>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
