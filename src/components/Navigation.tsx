"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, ClipboardList, BookOpen } from "lucide-react";

const tabs = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders/new", label: "New Order", icon: PlusCircle },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/catalog", label: "Catalog", icon: BookOpen },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-cream-dark no-print sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);

            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium
                  border-b-2 transition-all whitespace-nowrap
                  ${
                    isActive
                      ? "border-wine text-wine"
                      : "border-transparent text-charcoal-light hover:text-charcoal hover:border-charcoal/10"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
