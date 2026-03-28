"use client";

import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useFiles } from "@/lib/hooks/useFiles";
import type { FileTreeNode } from "@/lib/types";
import { useState } from "react";

interface FileExplorerProps {
  workspaceId: string | null;
  onFileSelect?: (path: string, content: string) => void;
}

function FileTreeNodeComponent({
  node,
  depth,
  onFileClick,
}: {
  node: FileTreeNode;
  depth: number;
  onFileClick: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);

  const fileIcon = (name: string) => {
    if (name.endsWith(".ts") || name.endsWith(".tsx")) return "📘";
    if (name.endsWith(".js") || name.endsWith(".jsx")) return "📒";
    if (name.endsWith(".py")) return "🐍";
    if (name.endsWith(".json")) return "📋";
    if (name.endsWith(".md")) return "📝";
    if (name.endsWith(".css")) return "🎨";
    if (name.endsWith(".html")) return "🌐";
    return "📄";
  };

  if (node.type === "directory") {
    return (
      <div>
        <button
          className="flex items-center gap-1.5 w-full text-left px-2 py-1 hover:bg-zinc-700/50 rounded text-sm text-gray-700"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-xs">{expanded ? "📂" : "📁"}</span>
          <span className="truncate">{node.name}</span>
        </button>
        {expanded &&
          node.children?.map((child) => (
            <FileTreeNodeComponent
              key={child.path}
              node={child}
              depth={depth + 1}
              onFileClick={onFileClick}
            />
          ))}
      </div>
    );
  }

  return (
    <button
      className="flex items-center gap-1.5 w-full text-left px-2 py-1 hover:bg-zinc-700/50 rounded text-sm text-gray-500 hover:text-gray-800"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={() => onFileClick(node.path)}
    >
      <span className="text-xs">{fileIcon(node.name)}</span>
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FileExplorer({ workspaceId, onFileSelect }: FileExplorerProps) {
  const { fileTree, fetchFileTree, readFile, selectedFile } =
    useFiles(workspaceId);

  useEffect(() => {
    if (workspaceId) fetchFileTree();
  }, [workspaceId, fetchFileTree]);

  useEffect(() => {
    if (selectedFile && onFileSelect) {
      onFileSelect(selectedFile.path, selectedFile.content);
    }
  }, [selectedFile, onFileSelect]);

  const handleFileClick = (path: string) => {
    readFile(path);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Files</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-800 h-6 px-2"
          onClick={fetchFileTree}
        >
          ↻
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {fileTree.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-4">
              Workspace is empty
            </p>
          ) : (
            fileTree.map((node) => (
              <FileTreeNodeComponent
                key={node.path}
                node={node}
                depth={0}
                onFileClick={handleFileClick}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
