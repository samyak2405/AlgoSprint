"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { type NodeProps, type Node } from "@xyflow/react";

export interface TextNodeData {
  text: string;
  fontSize?: "sm" | "base" | "lg";
  [key: string]: unknown;
}

type TextNodeType = Node<TextNodeData, "text">;

const FONT_SIZE_CLASS: Record<string, string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
};

function TextNodeInner({ data, selected, id }: NodeProps<TextNodeType>) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(data.text || "Double-click to edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fontClass = FONT_SIZE_CLASS[data.fontSize ?? "sm"] ?? "text-sm";

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  // Sync external data changes — use key mechanism via the data prop
  // The text local state is only for editing; when not editing, render data.text directly
  const displayText = editing ? text : (data.text || "Double-click to edit");

  const commitEdit = useCallback(() => {
    setEditing(false);
    const trimmed = text.trim();
    if (trimmed === "") {
      setText("Double-click to edit");
    }
    // Dispatch a custom event so the canvas can pick up the change
    // We use the ReactFlow built-in approach: update node data via store
    const event = new CustomEvent("textnode:update", {
      detail: { id, text: trimmed || "Double-click to edit" },
    });
    window.dispatchEvent(event);
  }, [text, id]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setText(data.text || "Double-click to edit");
    setEditing(true);
  }, [data.text]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        commitEdit();
      }
      // Allow Enter for newlines (no special handling)
    },
    [commitEdit]
  );

  return (
    <div
      className={`
        min-w-[120px] max-w-[300px] rounded-md px-3 py-2 transition-all duration-150
        ${selected ? "border border-dashed border-zinc-600 bg-zinc-900/60" : "border border-transparent"}
        ${!selected && !editing ? "hover:bg-zinc-900/50" : ""}
        ${editing ? "bg-zinc-900/70 border border-dashed border-zinc-500" : ""}
      `}
      onDoubleClick={handleDoubleClick}
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className={`w-full resize-none bg-transparent text-zinc-300 outline-none placeholder:text-zinc-500 ${fontClass}`}
          rows={Math.max(1, text.split("\n").length)}
          style={{ minHeight: "1.5em" }}
        />
      ) : (
        <p
          className={`whitespace-pre-wrap text-zinc-300 ${fontClass} ${
            displayText === "Double-click to edit" ? "italic text-zinc-500" : ""
          }`}
        >
          {displayText}
        </p>
      )}
    </div>
  );
}

function areTextNodePropsEqual(
  prev: NodeProps<TextNodeType>,
  next: NodeProps<TextNodeType>
): boolean {
  return (
    prev.selected === next.selected &&
    prev.data.text === next.data.text &&
    prev.data.fontSize === next.data.fontSize
  );
}

export const TextNode = memo(TextNodeInner, areTextNodePropsEqual);
