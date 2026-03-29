import fs from "fs";
import path from "path";

const PROJECT_ROOT = process.cwd();

interface ParsedDefinition {
  frontmatter: Record<string, string>;
  body: string;
}

function parseMarkdownWithFrontmatter(content: string): ParsedDefinition {
  const frontmatter: Record<string, string> = {};
  let body = content;

  if (content.startsWith("---")) {
    const endIdx = content.indexOf("---", 3);
    if (endIdx !== -1) {
      const fmBlock = content.slice(3, endIdx).trim();
      for (const line of fmBlock.split("\n")) {
        const colonIdx = line.indexOf(":");
        if (colonIdx !== -1) {
          const key = line.slice(0, colonIdx).trim();
          const value = line.slice(colonIdx + 1).trim();
          frontmatter[key] = value;
        }
      }
      body = content.slice(endIdx + 3).trim();
    }
  }

  return { frontmatter, body };
}

function loadMarkdownFiles(dirPath: string): ParsedDefinition[] {
  const results: ParsedDefinition[] = [];
  try {
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(dirPath, file), "utf-8");
      results.push(parseMarkdownWithFrontmatter(content));
    }
  } catch {
    // Directory may not exist yet
  }
  return results;
}

function loadBasePrompt(): string {
  const filePath = path.join(PROJECT_ROOT, "webagent.md");
  try {
    return fs.readFileSync(filePath, "utf-8").trim();
  } catch {
    return "You are WebAgent, an AI coding assistant.";
  }
}

function loadSkills(): string {
  const skillsDir = path.join(PROJECT_ROOT, "skills");
  const skills = loadMarkdownFiles(skillsDir);

  if (skills.length === 0) return "";

  const entries = skills
    .map((s) => {
      const name = s.frontmatter.name || "unnamed";
      const description = s.frontmatter.description || "";
      const trigger = s.frontmatter.trigger || "";
      return `### Skill: ${name}\n- **Description**: ${description}\n- **Trigger**: ${trigger}\n\n${s.body}`;
    })
    .join("\n\n");

  return `\n\n## Available Skills\n\nThe following skills are loaded. When a user's request matches a skill's trigger, follow that skill's instructions.\n\n${entries}`;
}

function loadAgents(): string {
  const agentsDir = path.join(PROJECT_ROOT, "agents");
  const agents = loadMarkdownFiles(agentsDir);

  if (agents.length === 0) return "";

  const entries = agents
    .map((a) => {
      const name = a.frontmatter.name || "unnamed";
      const description = a.frontmatter.description || "";
      return `### Agent: ${name}\n- **Description**: ${description}\n\n${a.body}`;
    })
    .join("\n\n");

  return `\n\n## Agent Definitions\n\nThe following agent personas are available. Adopt the appropriate agent's behavior when relevant.\n\n${entries}`;
}

export function buildSystemPrompt(workspaceId: string): string {
  const date = new Date().toISOString().split("T")[0];

  const basePrompt = loadBasePrompt();
  const skills = loadSkills();
  const agents = loadAgents();

  return `${basePrompt}

## Environment
- Working directory: /workspace (sandboxed to session workspace "${workspaceId}")
- Date: ${date}
- You have access to tools for reading, writing, and editing files, executing shell commands, and searching files.

## Available Tools
- **fileRead**: Read file contents with optional line offset/limit
- **fileWrite**: Write content to a file (creates directories as needed)
- **fileEdit**: Replace a specific string in a file (old_string must be unique)
- **bash**: Execute shell commands in the workspace
- **glob**: Search for files matching a pattern
- **grep**: Search for content patterns across files
- **spawnAgent**: Delegate a focused task to a sub-agent ('explorer', 'planner', 'default', 'marketing', or 'finance'). The sub-agent runs independently with its own context, can use tools, and can delegate further (up to depth 3). Returns a summarized result.
- **memoryRead**: Read the persistent workspace memory file
- **memoryWrite**: Write or append to the persistent workspace memory file

## Sub-Agent Usage
When a task benefits from exploration or planning, use the spawnAgent tool:
- Use agent="explorer" to search the workspace, find files, understand patterns
- Use agent="planner" to design an implementation plan for complex changes
- Use agent="default" to execute a focused sub-task (writing files, running commands)
- Use agent="marketing" for content creation, campaigns, brand messaging, and marketing strategy
- Use agent="finance" for budgeting, ROI analysis, financial modeling, and reporting
- Provide a clear task description and relevant context from the conversation
- The sub-agent runs with its own focused context (not the full conversation)
- The sub-agent's result is returned to you as a tool result
- Sub-agents can write to memory, so check memoryRead for their findings

## Memory
Use memoryRead/memoryWrite to persist important information across messages:
- Exploration findings, architectural decisions, project context
- Memory is stored as a markdown file in the workspace
- Both you and sub-agents share the same memory${skills}${agents}`;
}

export function buildSubAgentPrompt(agentName: string, workspaceId: string): string {
  const date = new Date().toISOString().split("T")[0];

  // Load just this specific agent's definition
  const agentsDir = path.join(PROJECT_ROOT, "agents");
  const agentFile = path.join(agentsDir, `${agentName}.md`);
  let agentInstructions = "";
  try {
    const content = fs.readFileSync(agentFile, "utf-8");
    const parsed = parseMarkdownWithFrontmatter(content);
    agentInstructions = parsed.body;
  } catch {
    agentInstructions = `You are the ${agentName} agent.`;
  }

  // Determine tool descriptions based on agent type
  const isExecutor = agentName === "default";
  const writeToolDocs = isExecutor
    ? `- **fileWrite**: Create or overwrite files
- **fileEdit**: Replace text in existing files
- **memoryWrite**: Write to persistent workspace memory`
    : `- **memoryWrite**: Write to persistent workspace memory`;

  const delegationDocs = `- **spawnAgent**: Delegate a focused sub-task to another agent ('explorer', 'planner', 'default', 'marketing', or 'finance'). Use this when your task would benefit from specialized help. There is a depth limit to prevent infinite recursion.`;

  return `${agentInstructions}

## Environment
- Working directory: /workspace (sandboxed to session workspace "${workspaceId}")
- Date: ${date}
- You are running as a sub-agent. Complete your task thoroughly and report your findings clearly.
- Your response text will be returned to the parent agent as a tool result.

## Available Tools
- **fileRead**: Read file contents
- **bash**: Execute shell commands${isExecutor ? "" : " (prefer read-only operations like ls, cat, find, wc)"}
- **glob**: Search for files by pattern
- **grep**: Search file contents
- **memoryRead**: Read persistent workspace memory
${writeToolDocs}
${delegationDocs}

## Delegation Guidelines
- You CAN delegate to other sub-agents using spawnAgent when it makes sense:
  - Use 'explorer' to research something you need before acting
  - Use 'planner' to design an approach for a complex sub-task
  - Use 'default' to execute a specific action (write files, run commands)
  - Use 'marketing' for content creation, campaigns, and brand messaging
  - Use 'finance' for budgets, ROI analysis, and financial reporting
- Don't delegate trivially — only when the sub-task is genuinely independent
- There is a maximum depth limit; if you hit it, handle the task directly

## Instructions
- Focus exclusively on the task given to you.
- Be thorough but concise in your final response.
- Write important findings to memory using memoryWrite so they persist.
- Do NOT ask clarifying questions — work with what you have.`;
}
