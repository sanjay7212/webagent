"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProviders } from "@/lib/hooks/useProviders";
import { Badge } from "@/components/ui/badge";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { groupedModels } = useProviders();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
              Vocareum Agent is a web-based AI coding assistant with multi-model support.
              Configure API keys in your .env.local file.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
