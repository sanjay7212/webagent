import {
  streamText,
  generateText,
  convertToModelMessages,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { registry } from "@/lib/providers/registry";
import { createTools } from "@/lib/tools";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { getDefaultModel } from "@/lib/providers/models";

export const maxDuration = 120;

export async function POST(req: Request) {
  const body = await req.json();
  const {
    conversationId,
    messages: clientMessages,
    model: modelId,
  } = body;

  // Load conversation
  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });

  if (!conv) {
    return new Response("Conversation not found", { status: 404 });
  }

  const resolvedModel = modelId || conv.model || getDefaultModel();
  const model = registry.languageModel(resolvedModel);
  const tools = createTools(conv.workspaceId, resolvedModel);
  const modelMessages = await convertToModelMessages(clientMessages);
  const isGoogle = resolvedModel.startsWith("google:");

  // Google Gemini via Vocareum gateway doesn't support SSE streaming,
  // so we use generateText and simulate a stream response for the UI
  if (isGoogle) {
    const systemPrompt = buildSystemPrompt(conv.workspaceId);

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        try {
          const result = await generateText({
            model,
            system: systemPrompt,
            messages: modelMessages,
            tools,
            maxSteps: 10,
            // Gemini 2.5 Pro requires thinking mode - no budget restriction
          });

          // Write text as a single delta chunk
          if (result.text) {
            writer.write({ type: "text-delta", textDelta: result.text });
          }

          // Update conversation timestamp
          await db
            .update(conversations)
            .set({ updatedAt: new Date() })
            .where(eq(conversations.id, conversationId));
        } catch (error) {
          console.error(`[chat] Google generateText error:`, error);
          writer.write({
            type: "text-delta",
            textDelta: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          });
        }
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  // For Anthropic and OpenAI, use normal streaming
  const result = streamText({
    model,
    system: buildSystemPrompt(conv.workspaceId),
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(10),
    onError: (error) => {
      console.error(`[chat] Stream error for ${resolvedModel}:`, error);
    },
    onFinish: async () => {
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    },
  });

  return result.toUIMessageStreamResponse();
}
