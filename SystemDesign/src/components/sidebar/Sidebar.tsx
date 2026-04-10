"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComponentPalette } from "./ComponentPalette";
import { ProblemSelector } from "./ProblemSelector";
import { LearningPath } from "./LearningPath";

interface SidebarProps {
  open: boolean;
  onCreateProblem?: () => void;
}

export function Sidebar({ open, onCreateProblem }: SidebarProps) {
  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 overflow-hidden transition-all duration-200 ${
        open ? "w-[280px] opacity-100" : "w-0 opacity-0 border-r-0"
      }`}
      aria-hidden={!open || undefined}
      inert={!open || undefined}
    >
      <div className="flex w-[280px] flex-1 flex-col min-h-0">
        <Tabs defaultValue="components" className="flex flex-1 flex-col min-h-0">
          <TabsList className="mx-2 mt-2 h-8 w-auto shrink-0 bg-zinc-800">
            <TabsTrigger
              value="components"
              className="h-7 px-3 text-xs data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100"
            >
              Components
            </TabsTrigger>
            <TabsTrigger
              value="problems"
              className="h-7 px-3 text-xs data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100"
            >
              Problems
            </TabsTrigger>
            <TabsTrigger
              value="learn"
              className="h-7 px-3 text-xs data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100"
            >
              Learn
            </TabsTrigger>
          </TabsList>

          <TabsContent value="components" className="mt-0 flex-1 min-h-0 overflow-y-auto">
            <ComponentPalette />
          </TabsContent>

          <TabsContent value="problems" className="mt-0 flex-1 min-h-0 overflow-y-auto">
            <ProblemSelector onCreateProblem={onCreateProblem} />
          </TabsContent>

          <TabsContent value="learn" className="mt-0 flex-1 min-h-0 overflow-y-auto">
            <LearningPath />
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}
