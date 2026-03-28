import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("New conversation"),
  model: text("model"),
  workspaceId: text("workspace_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "tool"] }).notNull(),
  content: text("content").notNull(),
  toolCallId: text("tool_call_id"),
  toolName: text("tool_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const toolPolicies = sqliteTable("tool_policies", {
  toolName: text("tool_name").primaryKey(),
  policy: text("policy", {
    enum: ["auto_approve", "always_ask", "conditional"],
  })
    .notNull()
    .default("auto_approve"),
  conditions: text("conditions"), // JSON string of condition rules
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
