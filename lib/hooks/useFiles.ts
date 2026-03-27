"use client";

import { useState, useCallback } from "react";
import type { FileTreeNode } from "@/lib/types";

export function useFiles(workspaceId: string | null) {
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    path: string;
    content: string;
  } | null>(null);

  const fetchFileTree = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/files?workspaceId=${workspaceId}`);
      const data = await res.json();
      setFileTree(data);
    } catch (err) {
      console.error("Failed to fetch file tree:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const readFile = useCallback(
    async (filePath: string) => {
      if (!workspaceId) return;
      try {
        const res = await fetch(
          `/api/files/${filePath}?workspaceId=${workspaceId}`
        );
        const data = await res.json();
        setSelectedFile({ path: filePath, content: data.content });
      } catch (err) {
        console.error("Failed to read file:", err);
      }
    },
    [workspaceId]
  );

  return {
    fileTree,
    loading,
    selectedFile,
    fetchFileTree,
    readFile,
    setSelectedFile,
  };
}
