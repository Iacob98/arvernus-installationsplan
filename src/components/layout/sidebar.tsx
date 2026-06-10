"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import logoImg from "@/../public/logo.png";
import { cn } from "@/lib/utils";
import {
  FolderOpen,
  Users,
  UserCog,
  Megaphone,
  Settings,
  Menu,
  Package,
  BarChart3,
  LayoutTemplate,
  User as UserIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof FolderOpen;
  /** Show numeric badge to the right of the label. */
  badgeKey?: "inboxUnread";
};

function getNavItems(role?: string): NavItem[] {
  if (role !== "ADMIN") {
    return [
      { href: "/kpi", label: "Meine KPI", icon: BarChart3 },
      { href: "/clients", label: "Kunden", icon: Users, badgeKey: "inboxUnread" },
      { href: "/profile", label: "Mein Profil", icon: UserIcon },
    ];
  }

  return [
    { href: "/kpi", label: "KPI", icon: BarChart3 },
    { href: "/clients", label: "Kunden", icon: Users, badgeKey: "inboxUnread" },
    { href: "/users", label: "Benutzer", icon: UserCog },
    { href: "/campaigns", label: "Kampagnen", icon: Megaphone },
    { href: "/settings/catalog", label: "Katalog", icon: Package },
    { href: "/settings/templates", label: "Vorlagen", icon: LayoutTemplate },
    { href: "/settings", label: "Einstellungen", icon: Settings },
    { href: "/profile", label: "Mein Profil", icon: UserIcon },
  ];
}

function useInboxUnreadCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function fetchCount() {
      try {
        const res = await fetch("/api/inbox/unread-count", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (!cancelled) setCount(data.count ?? 0);
      } catch {
        // network error — keep previous count
      }
    }
    fetchCount();
    const id = setInterval(fetchCount, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
  return count;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const navItems = getNavItems(session?.user?.role);
  const inboxUnread = useInboxUnreadCount();

  function badgeFor(item: NavItem): number {
    if (item.badgeKey === "inboxUnread") return inboxUnread;
    return 0;
  }

  return (
    <nav className="flex-1 p-4 space-y-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/settings"
            ? pathname === "/settings"
            : pathname.startsWith(item.href);
        const badge = badgeFor(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-3 md:py-2 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 md:h-4 md:w-4" />
            <span className="flex-1">{item.label}</span>
            {badge > 0 && (
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function LogoBlock() {
  return (
    <div className="p-4 border-b">
      <Link href="/clients" className="flex items-center gap-2">
        <Image
          src={logoImg}
          alt="Arvernus Meisterbetrieb"
          className="h-10 md:h-12 w-auto"
          priority
        />
      </Link>
    </div>
  );
}

/** Desktop sidebar — hidden on mobile */
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 border-r bg-white min-h-screen flex-col">
      <LogoBlock />
      <NavLinks />
      <div className="p-4 border-t text-xs text-muted-foreground">
        Arvernus Meisterbetrieb
      </div>
    </aside>
  );
}

/** Mobile hamburger + sheet drawer — visible only on mobile */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menü</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <LogoBlock />
        <NavLinks onNavigate={() => setOpen(false)} />
        <div className="p-4 border-t text-xs text-muted-foreground">
          Arvernus Meisterbetrieb
        </div>
      </SheetContent>
    </Sheet>
  );
}
