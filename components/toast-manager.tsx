"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Toast, ToastClose, ToastDescription, ToastTitle } from "@/components/ui/toast";

type ToastTone = "success" | "error";
type ToastMessage = {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
};

type ToastContextValue = {
  showToast: (message: Omit<ToastMessage, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastManager({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<ToastMessage[]>([]);

  const showToast = React.useCallback((message: Omit<ToastMessage, "id">) => {
    setMessages((current) => [...current, { ...message, id: Date.now() + Math.random() }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <React.Suspense fallback={null}>
        <ToastUrlListener />
      </React.Suspense>
      {messages.map((message) => (
        <Toast
          key={message.id}
          open
          onOpenChange={(open) => {
            if (!open) setMessages((current) => current.filter((item) => item.id !== message.id));
          }}
          duration={3600}
          className={message.tone === "success" ? "border-emerald-200" : "border-red-200"}
        >
          <ToastTitle className={message.tone === "success" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}>
            {message.title}
          </ToastTitle>
          {message.description ? <ToastDescription className="mt-1 text-sm text-muted-foreground">{message.description}</ToastDescription> : null}
          <ToastClose />
        </Toast>
      ))}
    </ToastContext.Provider>
  );
}

function ToastUrlListener() {
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const tone = searchParams.get("toast");
    const title = searchParams.get("toastTitle");
    const description = searchParams.get("toastDescription");

    if (tone !== "success" && tone !== "error") return;

    showToast({
      tone,
      title: title ?? (tone === "success" ? "ทำรายการสำเร็จ" : "ทำรายการไม่สำเร็จ"),
      description: description ?? undefined
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    params.delete("toastTitle");
    params.delete("toastDescription");
    router.replace(params.size ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
    router.refresh();
  }, [pathname, router, searchParams, showToast]);

  return null;
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastManager");
  return context;
}
