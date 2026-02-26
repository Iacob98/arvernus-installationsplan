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
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type NavItem = { href: string; label: string; icon: typeof FolderOpen };

function getNavItems(role?: string): NavItem[] {
  if (role !== "ADMIN") {
    return [
      { href: "/clients", label: "Kunden", icon: Users },
    ];
  }

  return [
    { href: "/projects", label: "Projekte", icon: FolderOpen },
    { href: "/clients", label: "Kunden", icon: Users },
    { href: "/users", label: "Benutzer", icon: UserCog },
    { href: "/campaigns", label: "Kampagnen", icon: Megaphone },
    { href: "/settings", label: "Einstellungen", icon: Settings },
  ];
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const navItems = getNavItems(session?.user?.role);

  return (
    <nav className="flex-1 p-4 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LogoBlock() {
  return (
    <div className="p-4 border-b">
      <Link href="/projects" className="flex items-center gap-2">
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
