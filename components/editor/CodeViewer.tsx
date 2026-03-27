"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface CodeViewerProps {
  filePath: string;
  content: string;
  onClose: () => void;
}

export function CodeViewer({ filePath, content, onClose }: CodeViewerProps) {
  const lines = content.split("\n");
  const extension = filePath.split(".").pop() || "";

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 bg-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">📄</span>
          <span className="text-sm text-zinc-200 font-mono">{filePath}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-200 h-6 px-2"
        >
          ✕
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 font-mono text-sm">
          <table className="w-full">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-zinc-800/50">
                  <td className="text-zinc-600 text-right pr-4 select-none w-12 align-top">
                    {i + 1}
                  </td>
                  <td className="text-zinc-200 whitespace-pre-wrap break-all">
                    {line || " "}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
}
