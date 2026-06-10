"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";

/**
 * ResponsiveDialogContent renders as a centered Dialog on `sm+` viewports
 * (≥ 640 px) and as a bottom Sheet on smaller screens — without swapping
 * Radix primitives at runtime (no hydration mismatch).
 *
 * Wide dialogs (catalog item, wizard, …) pass `desktopMaxWidthClass` to
 * override the default `sm:max-w-lg`.
 */
function ResponsiveDialogContent({
  className,
  children,
  showCloseButton = true,
  desktopMaxWidthClass = "sm:max-w-lg",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  /** Tailwind class controlling the dialog width from `sm` upwards. */
  desktopMaxWidthClass?: string;
}) {
  return (
    <DialogPortal data-slot="responsive-dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="responsive-dialog-content"
        className={cn(
          // base + mobile: bottom sheet, full width, 92dvh tall
          "bg-background fixed inset-x-0 bottom-0 z-50 grid w-full max-w-full gap-4 rounded-t-xl border-t p-4 shadow-lg outline-none",
          "max-h-[92dvh] overflow-y-auto",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          // sm+: classic centered dialog
          "sm:inset-auto sm:bottom-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]",
          "sm:rounded-lg sm:border sm:p-6 sm:max-h-[92vh]",
          "sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0",
          "sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0",
          "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
          desktopMaxWidthClass,
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="responsive-dialog-close"
            className="ring-offset-background focus:ring-ring absolute top-3 right-3 sm:top-4 sm:right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Schließen</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

const ResponsiveDialog = Dialog;
const ResponsiveDialogTrigger = DialogTrigger;
const ResponsiveDialogClose = DialogClose;
const ResponsiveDialogHeader = DialogHeader;
const ResponsiveDialogFooter = DialogFooter;
const ResponsiveDialogTitle = DialogTitle;
const ResponsiveDialogDescription = DialogDescription;

export {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
};
