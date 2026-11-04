"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Globe,
  History,
  Mail,
  Search,
  ShieldAlert,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/url-analysis", label: "URL Scanner", icon: Search },
  { href: "/email-analysis", label: "Email Analysis", icon: Mail },
  { href: "/website-analysis", label: "Website Analysis", icon: Globe },
  { href: "/history", label: "Scan History", icon: History },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-[#e4e7ec] bg-white md:w-64 md:border-b-0 md:border-r">
      <div className="flex h-full flex-col p-4 md:p-5">
        <div className="mb-6 flex items-center gap-3 px-2 py-1">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dfe3e8] bg-[#f8f9fa] text-[#111827]">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#667085]">
              Cyber intelligence
            </p>
            <h1 className="text-lg font-semibold text-[#111827]">
              Phishing Guard
            </h1>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 border px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-[#111827] bg-[#111827] text-white"
                    : "border-[#dfe3e8] bg-white text-[#475467] hover:bg-[#f8f9fa]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
