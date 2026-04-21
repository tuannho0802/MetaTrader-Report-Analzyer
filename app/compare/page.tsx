"use client";

import React from "react";
import { EAComparator } from "@/components/compare/EAComparator";

export default function ComparePage() {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <EAComparator />
    </div>
  );
}
