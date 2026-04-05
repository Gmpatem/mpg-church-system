"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Church,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/platform", label: "Dashboard", icon: LayoutDashboard },
  { href: "/platform/churches", label: "Churches", icon: Church },
  { href: "/platform/support", label: "Support", icon: HelpCircle },
  { href: "/platform/settings", label: "Settings", icon: Settings },
];

export function PlatformSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-16 items-center border-b border-gray-200 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
            <Church className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold leading-tight text-gray-900">MPG Church</h1>
              <p className="text-xs text-gray-500">Platform Admin</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-full items-center rounded-xl transition-all duration-200",
                collapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
                active
                  ? "bg-blue-50 font-medium text-blue-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <>
                  <span>{item.label}</span>
                  {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className={cn("rounded-xl bg-gray-50 p-3", collapsed ? "flex justify-center" : "flex items-center gap-3")}>
          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-medium text-white">
              AD
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">Admin User</p>
                <p className="truncate text-xs text-gray-500">admin@mpgchurch.com</p>
              </div>
              <LogOut className="h-4 w-4 text-gray-400" />
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-gray-500" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-gray-500" />
        )}
      </button>
    </aside>
  );
}
