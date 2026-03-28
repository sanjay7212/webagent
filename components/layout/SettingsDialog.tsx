"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProviders } from "@/lib/hooks/useProviders";
import { Badge } from "@/components/ui/badge";
import { ToolPolicyPanel } from "@/components/chat/ToolPolicyPanel";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { groupedModels } = useProviders();
  const [tab, setTab] = useState<"providers" | "policies">("providers");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Settings</DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex border-b border-zinc-700">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "providers"
                ? "border-indigo-400 text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
            onClick={() => setTab("providers")}
          >
            Providers
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "policies"
                ? "border-indigo-400 text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
            onClick={() => setTab("policies")}
          >
            Tool Policies
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {tab === "providers" && (
            <div className="space-y-6 py-2">
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-3">
                  API Provider Status
                </h3>
                <div className="space-y-2">
                  {[
                    { name: "Anthropic", key: "Anthropic" },
                    { name: "OpenAI", key: "OpenAI" },
                    { name: "Google", key: "Google" },
                  ].map(({ name, key }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2 px-3 bg-zinc-800 rounded"
                    >
                      <span className="text-sm text-zinc-200">{name}</span>
                      {groupedModels[key] ? (
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                          Connected ({groupedModels[key].length} models)
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-zinc-500 border-zinc-600"
                        >
                          Not configured
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-2">About</h3>
                <p className="text-xs text-zinc-500">
                  Vocareum Agent is a general-purpose AI assistant with multi-model support.
                  Configure API keys in your .env.local file.
                </p>
              </div>
            </div>
          )}

          {tab === "policies" && (
            <div className="py-2">
              <ToolPolicyPanel />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
