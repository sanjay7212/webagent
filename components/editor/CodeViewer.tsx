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
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">📄</span>
          <span className="text-sm text-gray-800 font-mono">{filePath}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 h-6 px-2"
        >
          ✕
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 font-mono text-sm">
          <table className="w-full">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="text-gray-400 text-right pr-4 select-none w-12 align-top">
                    {i + 1}
                  </td>
                  <td className="text-gray-800 whitespace-pre-wrap break-all">
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
