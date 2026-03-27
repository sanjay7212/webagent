export interface Conversation {
  id: string;
  title: string;
  model: string | null;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}
