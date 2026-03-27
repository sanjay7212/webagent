type ApprovalResolver = {
  resolve: (approved: boolean) => void;
};

const pendingApprovals = new Map<string, ApprovalResolver>();

export function requestApproval(toolCallId: string): Promise<boolean> {
  return new Promise((resolve) => {
    pendingApprovals.set(toolCallId, { resolve });
    // Auto-deny after 60 seconds
    setTimeout(() => {
      if (pendingApprovals.has(toolCallId)) {
        pendingApprovals.delete(toolCallId);
        resolve(false);
      }
    }, 60000);
  });
}

export function resolveApproval(toolCallId: string, approved: boolean): boolean {
  const pending = pendingApprovals.get(toolCallId);
  if (pending) {
    pending.resolve(approved);
    pendingApprovals.delete(toolCallId);
    return true;
  }
  return false;
}

export function hasPendingApproval(toolCallId: string): boolean {
  return pendingApprovals.has(toolCallId);
}
