import { tool, streamText, stepCountIs } from "ai";
import { z } from "zod";
import { registry } from "../providers/registry";
import { buildSubAgentPrompt } from "../agent/system-prompt";
import { fileReadTool } from "./fileRead";
import { bashTool } from "./bash";
import { globTool } from "./glob";
import { grepTool } from "./grep";
import { memoryReadTool, memoryWriteTool } from "./memory";

const MAX_RESULT_LENGTH = 8000;

function createSubAgentTools(workspaceId: string) {
  return {
    fileRead: fileReadTool(workspaceId),
    bash: bashTool(workspaceId),
    glob: globTool(workspaceId),
    grep: grepTool(workspaceId),
    memoryRead: memoryReadTool(workspaceId),
    memoryWrite: memoryWriteTool(workspaceId),
  };
}

export function spawnAgentTool(workspaceId: string, modelId: string) {
  return tool({
    description:
      "Spawn a sub-agent to perform a focused task. Use 'explorer' for codebase search and understanding, or 'planner' for designing implementation plans. The sub-agent runs independently with its own context and returns a summarized result.",
    inputSchema: z.object({
      agent: z
        .enum(["explorer", "planner"])
        .describe("Which agent to spawn"),
      task: z
        .string()
        .describe(
          "Clear description of what the sub-agent should do"
        ),
      context: z
        .string()
        .optional()
        .describe(
          "Relevant context from the current conversation to pass to the sub-agent"
        ),
    }),
    execute: async ({ agent, task, context }) => {
      try {
        const model = registry.languageModel(modelId as `${string}:${string}`);
        const systemPrompt = buildSubAgentPrompt(agent, workspaceId);

        const userContent = context
          ? `## Context\n${context}\n\n## Task\n${task}`
          : task;

        const subTools = createSubAgentTools(workspaceId);

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
            steps: steps.length,
            tools: Array.from(toolsUsed),
            toolCallCount,
            estimatedTokens: {
              prompt: totalUsage.inputTokens || Math.ceil(userContent.length / 4),
              completion: totalUsage.outputTokens || Math.ceil(fullText.length / 4),
              total: totalUsage.totalTokens || Math.ceil((userContent.length + fullText.length) / 4),
            },
          };
        } catch {
          agentMeta = {
            agent,
            steps: 1,
            tools: [],
            toolCallCount: 0,
            estimatedTokens: {
              prompt: Math.ceil(userContent.length / 4),
              completion: Math.ceil(fullText.length / 4),
              total: Math.ceil((userContent.length + fullText.length) / 4),
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
        return (fullText || "(Sub-agent completed with no text output)") +
          "\n---AGENT_META---\n" + metaJson;
      } catch (err: unknown) {
        const error = err as { message?: string };
        return `Sub-agent error: ${error.message || "Unknown error"}`;
      }
    },
  });
}
