"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { MobileNav } from "./sidebar";

export function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 md:px-6">
      <MobileNav />
      <div className="hidden md:block" />
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <span className="hidden sm:inline">{session?.user?.name}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {session?.user?.role}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
