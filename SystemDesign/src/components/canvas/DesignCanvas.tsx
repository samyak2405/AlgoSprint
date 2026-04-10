"use client";

import { useCallback, useEffect, useMemo, useRef, type DragEvent } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes } from "./nodes/nodeTypes";
import { edgeTypes } from "./edges/edgeTypes";
import { useCanvasStore, type ComponentNodeData } from "@/store/canvasStore";
import { getComponentById } from "@/data/components";
import { Layers } from "lucide-react";
import { CanvasTabBar } from "./CanvasTabBar";

export function DesignCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const addNode = useCanvasStore((s) => s.addNode);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode);
  const setSelectedEdge = useCanvasStore((s) => s.setSelectedEdge);

  // Listen for text node edits and persist them to the store
  useEffect(() => {
    function handleTextNodeUpdate(e: Event) {
      const { id, text } = (e as CustomEvent).detail;
      updateNodeData(id, { text } as Record<string, unknown>);
    }
    window.addEventListener("textnode:update", handleTextNodeUpdate);
    return () => window.removeEventListener("textnode:update", handleTextNodeUpdate);
  }, [updateNodeData]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const componentId = event.dataTransfer.getData(
        "application/systemsim-component"
      );
      if (!componentId) return;

      const component = getComponentById(componentId);
      if (!component) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<ComponentNodeData> = {
        id: `${componentId}-${crypto.randomUUID()}`,
        type: "component",
        position,
        data: {
          componentId: component.id,
          label: component.label,
          icon: component.icon,
          category: component.category,
          replicas: 1,
          maxQPS: component.maxQPS,
          latencyMs: component.latencyMs,
          scalable: component.scalable,
        },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge.id);
    },
    [setSelectedEdge]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  const miniMapNodeColor = useMemo(
    () => (node: Node) => {
      const data = node.data as ComponentNodeData;
      const status = data.status as string;
      if (status === "critical") return "#ef4444";
      if (status === "warning") return "#f59e0b";
      if (status === "healthy") return "#10b981";
      return "#52525b";
    },
    []
  );

  const isEmpty = nodes.length === 0;

  return (
    <div ref={reactFlowWrapper} className="relative flex-1 flex flex-col">
      <CanvasTabBar />
      <ReactFlow
        className="flex-1 bg-zinc-950"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: "animated" }}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(63, 63, 70, 0.5)"
          className="!bg-zinc-950"
        />
        <Controls
          className="!rounded-md !border !border-zinc-800 !bg-zinc-900 !shadow-sm [&>button]:!border-zinc-800 [&>button]:!bg-zinc-900 [&>button]:!text-zinc-400 [&>button:hover]:!bg-zinc-800 [&>button:hover]:!text-zinc-200"
          position="bottom-left"
        />
        <MiniMap
          className="!rounded-md !border !border-zinc-800 !bg-zinc-900"
          maskColor="rgba(9, 9, 11, 0.7)"
          nodeColor={miniMapNodeColor}
          position="bottom-right"
          style={{ width: 140, height: 90 }}
        />
      </ReactFlow>

      {/* Empty state overlay */}
      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
              <Layers className="h-7 w-7 text-zinc-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300">
                Design your system
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-400">
                Select a problem from the sidebar, then drag components to build your architecture
              </p>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 font-mono text-[9px]">
                  Drag
                </kbd>
                to add
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 font-mono text-[9px]">
                  Click
                </kbd>
                to select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 font-mono text-[9px]">
                  ⌫
                </kbd>
                to delete
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
