"use client";

import { useEffect, useRef } from "react";
import type { ContentActionState } from "@/app/admin/actions/site-content";
import { useToast } from "@/components/ui/toast";

/**
 * Toasts the result of a form action exactly once per state, then runs
 * `onSuccess` (used to close a dialog or the inline block editor).
 */
export function useActionFeedback(
  state: ContentActionState,
  successTitle: string,
  onSuccess?: () => void,
): void {
  const toast = useToast();
  const handledRef = useRef<ContentActionState | null>(null);

  useEffect(() => {
    if (state.ok === undefined || state === handledRef.current) return;
    handledRef.current = state;
    if (state.ok) {
      toast.success(successTitle, state.message ?? "Your changes are live on the public site.");
      onSuccess?.();
    } else {
      toast.error("Could not save", state.message ?? "Please correct the highlighted fields and try again.");
    }
  }, [state, toast, successTitle, onSuccess]);
}
