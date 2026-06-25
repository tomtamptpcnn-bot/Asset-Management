"use client";

import * as React from "react";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider swipeDirection="right">
        {children}
        <ToastViewport />
      </ToastProvider>
    </ThemeProvider>
  );
}
