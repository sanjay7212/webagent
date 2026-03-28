import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "webagent.db");

export function runMigrations() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'New conversation',
      model TEXT,
      workspace_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'tool')),
      content TEXT NOT NULL,
      tool_call_id TEXT,
      tool_name TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

    CREATE TABLE IF NOT EXISTS tool_policies (
      tool_name TEXT PRIMARY KEY,
      policy TEXT NOT NULL DEFAULT 'auto_approve' CHECK(policy IN ('auto_approve', 'always_ask', 'conditional')),
      conditions TEXT,
      updated_at INTEGER NOT NULL
    );
  `);

  sqlite.close();
}

// Run once on first import
let _migrated = false;
export function ensureMigrated() {
  if (_migrated) return;
  _migrated = true;
  runMigrations();
}
