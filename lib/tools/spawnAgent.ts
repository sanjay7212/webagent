import { tool, streamText, stepCountIs } from "ai";
import { z } from "zod";
import { registry } from "../providers/registry";
import { buildSubAgentPrompt } from "../agent/system-prompt";
import { fileReadTool } from "./fileRead";
import { fileWriteTool } from "./fileWrite";
import { fileEditTool } from "./fileEdit";
import { bashTool } from "./bash";
import { globTool } from "./glob";
import { grepTool } from "./grep";
import { memoryReadTool, memoryWriteTool } from "./memory";

const MAX_RESULT_LENGTH = 8000;
const MAX_DEPTH = 3; // main -> sub -> sub (max 3 levels)

/**
 * Build the tool set for a sub-agent based on its role and depth.
 * - explorer: read-only tools + can spawn other agents (up to depth limit)
 * - planner: read-only tools + can spawn other agents (up to depth limit)
 * - default: full tools + can spawn other agents (up to depth limit)
 */
function createSubAgentTools(
  agentType: string,
  workspaceId: string,
  modelId: string,
  depth: number
) {
  // Read-only tools available to all sub-agents
  const readTools = {
    fileRead: fileReadTool(workspaceId),
    glob: globTool(workspaceId),
    grep: grepTool(workspaceId),
    memoryRead: memoryReadTool(workspaceId),
  };

  // Write tools for agents that can execute
  const writeTools = {
    fileWrite: fileWriteTool(workspaceId),
    fileEdit: fileEditTool(workspaceId),
    bash: bashTool(workspaceId),
    memoryWrite: memoryWriteTool(workspaceId),
  };

  // Determine base tools by agent type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tools: Record<string, any> = {};

  if (agentType === "explorer") {
    // Explorer: read-only + bash for inspection (ls, find, etc.)
    tools = {
      ...readTools,
      bash: bashTool(workspaceId),
      memoryWrite: memoryWriteTool(workspaceId),
    };
  } else if (agentType === "planner") {
    // Planner: read-only + bash for inspection
    tools = {
      ...readTools,
      bash: bashTool(workspaceId),
      memoryWrite: memoryWriteTool(workspaceId),
    };
  } else if (agentType === "marketing" || agentType === "finance") {
    // Specialist agents: full tool access (they create documents, reports, etc.)
    tools = {
      ...readTools,
      ...writeTools,
    };
  } else {
    // Default/executor: full tool access
    tools = {
      ...readTools,
      ...writeTools,
    };
  }

  // Add spawnAgent if we haven't hit the depth limit
  if (depth < MAX_DEPTH) {
    tools.spawnAgent = spawnAgentToolWithDepth(workspaceId, modelId, depth + 1);
  }

  return tools;
}

/**
 * Internal: creates a spawnAgent tool that tracks recursion depth.
 */
function spawnAgentToolWithDepth(
  workspaceId: string,
  modelId: string,
  depth: number
) {
  return tool({
    description:
      depth >= MAX_DEPTH
        ? "Cannot spawn sub-agents: maximum delegation depth reached."
        : `Spawn a sub-agent to perform a focused task. Available agents: 'explorer' (search, research, understand), 'planner' (design approaches, break down tasks), 'default' (execute tasks, write files, run commands), 'marketing' (content creation, campaigns, brand messaging), 'finance' (budgeting, ROI analysis, financial reporting). The sub-agent runs independently with its own context and returns a summarized result. Current depth: ${depth}/${MAX_DEPTH}.`,
    inputSchema: z.object({
      agent: z
        .enum(["explorer", "planner", "default", "marketing", "finance"])
        .describe(
          "Which agent to spawn: 'explorer' for research/search, 'planner' for strategy/design, 'default' for execution, 'marketing' for content/campaigns, 'finance' for budgets/analysis"
        ),
      task: z
        .string()
        .describe("Clear description of what the sub-agent should do"),
      context: z
        .string()
        .optional()
        .describe(
          "Relevant context from the current conversation to pass to the sub-agent"
        ),
    }),
    execute: async ({ agent, task, context }) => {
      if (depth >= MAX_DEPTH) {
        return `Cannot spawn sub-agent: maximum delegation depth (${MAX_DEPTH}) reached. Please handle this task directly with your available tools.`;
      }

      try {
        const model = registry.languageModel(
          modelId as `${string}:${string}`
        );
        const systemPrompt = buildSubAgentPrompt(agent, workspaceId);

        const userContent = context
          ? `## Context\n${context}\n\n## Task\n${task}`
          : task;

        const subTools = createSubAgentTools(
          agent,
          workspaceId,
          modelId,
          depth
        );

        const result = streamText({
          model,
          system: systemPrompt,
          messages: [{ role: "user" as const, content: userContent }],
          tools: subTools,
          stopWhen: stepCountIs(15),
        });

        // Consume the full stream
        let fullText = "";
        for await (const chunk of result.textStream) {
          fullText += chunk;
        }

        // Collect execution metadata
        let agentMeta: Record<string, unknown> = {};
        try {
          const steps = await result.steps;
          const totalUsage = await result.totalUsage;

          let toolCallCount = 0;
          const toolsUsed = new Set<string>();
          for (const step of steps) {
            if (step.toolCalls) {
              for (const tc of step.toolCalls) {
                toolCallCount++;
                toolsUsed.add(tc.toolName);
              }
            }
          }

          agentMeta = {
            agent,
            depth,
            steps: steps.length,
            tools: Array.from(toolsUsed),
            toolCallCount,
            estimatedTokens: {
              prompt:
                totalUsage.inputTokens ||
                Math.ceil(userContent.length / 4),
              completion:
                totalUsage.outputTokens ||
                Math.ceil(fullText.length / 4),
              total:
                totalUsage.totalTokens ||
                Math.ceil((userContent.length + fullText.length) / 4),
            },
          };
        } catch {
          agentMeta = {
            agent,
            depth,
            steps: 1,
            tools: [],
            toolCallCount: 0,
            estimatedTokens: {
              prompt: Math.ceil(userContent.length / 4),
              completion: Math.ceil(fullText.length / 4),
              total: Math.ceil(
                (userContent.length + fullText.length) / 4
              ),
            },
          };
        }

        // Truncate if too long
        if (fullText.length > MAX_RESULT_LENGTH) {
          fullText =
            fullText.slice(0, MAX_RESULT_LENGTH) +
            "\n\n[Result truncated to 8000 characters]";
        }

        // Append metadata as parseable footer
        const metaJson = JSON.stringify(agentMeta);
        return (
          (fullText || "(Sub-agent completed with no text output)") +
          "\n---AGENT_META---\n" +
          metaJson
        );
      } catch (err: unknown) {
        const error = err as { message?: string };
        return `Sub-agent error: ${error.message || "Unknown error"}`;
      }
    },
  });
}

/**
 * Public: creates the top-level spawnAgent tool (depth 1).
 */
export function spawnAgentTool(workspaceId: string, modelId: string) {
  return spawnAgentToolWithDepth(workspaceId, modelId, 1);
}
