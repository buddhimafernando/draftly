"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "saved" | "unsaved" | "saving" | "error";

export function useAutosave<T>(onSave: (value: T) => Promise<{ ok: boolean }>, delay = 1000) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<T | null>(null);
  const saveRef = useRef(onSave);

  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (pending.current === null) return;

    const value = pending.current;
    pending.current = null;
    setStatus("saving");

    const result = await saveRef.current(value);
    if (!result.ok) {
      pending.current ??= value; // keep it so the next edit retries
      setStatus("error");
      return;
    }
    setStatus(pending.current === null ? "saved" : "unsaved");
  }, []);

  const schedule = useCallback(
    (value: T) => {
      pending.current = value;
      setStatus("unsaved");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), delay);
    },
    [delay, flush],
  );

  // Save on unmount, and warn before closing the tab with unsaved changes.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current !== null) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (pending.current !== null) void flush();
    };
  }, [flush]);

  return { status, schedule, flush };
}