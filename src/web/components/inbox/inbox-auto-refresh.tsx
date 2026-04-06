"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef } from "react";

type InboxAutoRefreshProps = {
  intervalMs?: number;
};

export function InboxAutoRefresh({
  intervalMs = 8000,
}: InboxAutoRefreshProps) {
  const router = useRouter();
  const refreshInFlightRef = useRef(false);

  useEffect(() => {
    function refreshInbox() {
      if (document.visibilityState !== "visible" || refreshInFlightRef.current) {
        return;
      }

      refreshInFlightRef.current = true;

      startTransition(() => {
        router.refresh();
      });

      window.setTimeout(() => {
        refreshInFlightRef.current = false;
      }, 1500);
    }

    const intervalId = window.setInterval(refreshInbox, intervalMs);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshInbox();
      }
    }

    function handleWindowFocus() {
      refreshInbox();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [intervalMs, router]);

  return null;
}
