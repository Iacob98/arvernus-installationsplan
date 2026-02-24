"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FolderOpen,
  Users,
  Settings,
  Menu,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { href: "/projects", label: "Projekte", icon: FolderOpen },
  { href: "/clients", label: "Kunden", icon: Users },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

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
          src="/logo.png"
          alt="Arvernus Meisterbetrieb"
          width={200}
          height={60}
          className="h-10 md:h-12 w-auto"
          priority
          unoptimized
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
