"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { get3DPreference, set3DPreference } from "@/lib/cookies";

export function use3DPreference(): [boolean, () => void] {
  const [isometric, setIsometric] = useState(false);
  const lastToggleRef = useRef(0);

  useEffect(() => {
    setIsometric(get3DPreference());
  }, []);

  const toggle = useCallback(() => {
    const now = Date.now();
    if (now - lastToggleRef.current < 200) return;
    lastToggleRef.current = now;
    setIsometric((prev) => {
      const next = !prev;
      set3DPreference(next);
      return next;
    });
  }, []);

  return [isometric, toggle];
}
