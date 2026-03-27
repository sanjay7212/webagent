import { fileReadTool } from "./fileRead";
import { fileWriteTool } from "./fileWrite";
import { fileEditTool } from "./fileEdit";
import { bashTool } from "./bash";
import { globTool } from "./glob";
import { grepTool } from "./grep";
import { memoryReadTool, memoryWriteTool } from "./memory";
import { spawnAgentTool } from "./spawnAgent";

export function createTools(workspaceId: string, modelId?: string) {
  const base = {
    fileRead: fileReadTool(workspaceId),
    fileWrite: fileWriteTool(workspaceId),
    fileEdit: fileEditTool(workspaceId),
    bash: bashTool(workspaceId),
    glob: globTool(workspaceId),
    grep: grepTool(workspaceId),
    memoryRead: memoryReadTool(workspaceId),
    memoryWrite: memoryWriteTool(workspaceId),
  };

  if (modelId) {
    return {
      ...base,
      spawnAgent: spawnAgentTool(workspaceId, modelId),
    };
  }

  return base;
}

export { requiresApproval, AUTO_APPROVED_TOOLS } from "./permissions";
