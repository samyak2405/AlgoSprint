"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Monitor } from "lucide-react";

export default function Home() {
  return (
    <>
      <div className="flex h-full items-center justify-center bg-background p-8 text-center md:hidden">
        <div>
          <Monitor className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
          <h2 className="text-lg font-semibold text-zinc-200">Desktop Only</h2>
          <p className="mt-2 text-sm text-zinc-400">SystemSim requires a desktop browser for the best experience. Please visit on a laptop or desktop computer.</p>
        </div>
      </div>
      <div className="hidden h-full md:block">
        <AppShell />
      </div>
    </>
  );
}
