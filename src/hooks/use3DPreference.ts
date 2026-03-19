"use client";

import { useState, useEffect, useCallback } from "react";
import { get3DPreference, set3DPreference } from "@/lib/cookies";

export function use3DPreference(): [boolean, () => void] {
  const [isometric, setIsometric] = useState(false);

  useEffect(() => {
    setIsometric(get3DPreference());
  }, []);

  const toggle = useCallback(() => {
    setIsometric((prev) => {
      const next = !prev;
      set3DPreference(next);
      return next;
    });
  }, []);

  return [isometric, toggle];
}
