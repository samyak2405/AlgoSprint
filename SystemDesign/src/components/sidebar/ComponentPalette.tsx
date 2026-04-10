"use client";

import { type DragEvent, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SYSTEM_COMPONENTS,
  COMPONENT_CATEGORIES,
} from "@/data/components";
import { CONCEPT_LIBRARY } from "@/data/conceptLibrary";
import { Server, GripVertical, Search as SearchIcon } from "lucide-react";
import { ICON_MAP } from "@/lib/icons";

const CATEGORY_ACCENT: Record<string, string> = {
  networking: "text-blue-400",
  compute: "text-violet-400",
  storage: "text-amber-400",
  messaging: "text-emerald-400",
  infrastructure: "text-cyan-400",
};

const CATEGORY_BG: Record<string, string> = {
  networking: "bg-blue-400/10",
  compute: "bg-violet-400/10",
  storage: "bg-amber-400/10",
  messaging: "bg-emerald-400/10",
  infrastructure: "bg-cyan-400/10",
};

const CATEGORY_BORDER: Record<string, string> = {
  networking: "border-l-blue-400",
  compute: "border-l-violet-400",
  storage: "border-l-amber-400",
  messaging: "border-l-emerald-400",
  infrastructure: "border-l-cyan-400",
};

export function ComponentPalette() {
  const [search, setSearch] = useState("");

  function handleDragStart(e: DragEvent, componentId: string) {
    e.dataTransfer.setData("application/systemsim-component", componentId);
    e.dataTransfer.effectAllowed = "copy";

    // Create a small custom drag ghost to prevent full-page shadow
    const ghost = document.createElement("div");
    ghost.style.cssText = "position:absolute;top:-1000px;left:-1000px;padding:6px 12px;background:#18181b;border:1px solid #3f3f46;border-radius:8px;color:#e4e4e7;font-size:12px;font-family:system-ui;white-space:nowrap;";
    const comp = SYSTEM_COMPONENTS.find((c) => c.id === componentId);
    ghost.textContent = comp?.label ?? componentId;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }

  const query = search.toLowerCase().trim();

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-3 pt-3 pb-1">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            aria-label="Search components"
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none transition-colors focus:border-cyan-500"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
      <div className="space-y-4 p-3">
        {COMPONENT_CATEGORIES.map((cat) => {
          const items = SYSTEM_COMPONENTS.filter(
            (c) => c.category === cat.key && (query === "" || c.label.toLowerCase().includes(query) || c.description.toLowerCase().includes(query))
          );
          if (query !== "" && items.length === 0) return null;
          return (
            <div key={cat.key}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {cat.label} ({items.length})
              </p>
              <TooltipProvider>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = ICON_MAP[item.icon] ?? Server;
                  const accent = CATEGORY_ACCENT[item.category] ?? "text-cyan-400";
                  const iconBg = CATEGORY_BG[item.category] ?? "bg-cyan-400/10";
                  const borderColor = CATEGORY_BORDER[item.category] ?? "border-l-cyan-400";
                  const concept = CONCEPT_LIBRARY[item.id];
                  const tipText = concept?.whenToUse[0] ?? item.description;
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger
                        render={
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            className={`group flex cursor-grab items-center gap-2 rounded-md border-l-2 px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 active:cursor-grabbing ${borderColor}`}
                          >
                            <GripVertical className="h-3 w-3 shrink-0 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${iconBg}`}>
                              <Icon className={`h-3.5 w-3.5 shrink-0 transition-colors ${accent}`} />
                            </div>
                            <span className="truncate">{item.label}</span>
                            <span className="ml-auto shrink-0 text-[11px] text-zinc-400">
                              {item.maxQPS === Infinity ? "\u221e" : `${(item.maxQPS / 1000).toFixed(0)}k`}
                            </span>
                          </div>
                        }
                      />
                      <TooltipContent side="right" sideOffset={8} className="max-w-[220px]">
                        <p className="text-xs leading-relaxed">{tipText}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
              </TooltipProvider>
            </div>
          );
        })}
      </div>
    </ScrollArea>
    </div>
  );
}
