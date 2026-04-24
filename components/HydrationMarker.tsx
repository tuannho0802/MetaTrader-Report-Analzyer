"use client";

import { useEffect } from "react";

export function HydrationMarker() {
  useEffect(() => {
    // Đánh dấu đã hydrate xong
    document.body.setAttribute('data-hydrated', 'true');
  }, []);
  
  return null;
}
