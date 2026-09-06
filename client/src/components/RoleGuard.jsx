import { useWorkspace } from "../contexts/WorkspaceContext";

export function RoleGuard({ allowedRoles = [], fallback = null, children }) {
  const { activeRole } = useWorkspace();

  if (!activeRole) {
    return fallback;
  }

  // If the user's role is in the allowed array, or if they have a higher role in the hierarchy
  // Wait, let's just check if their role is exactly in the allowedRoles or do a hierarchy check
  // The prompt specifies permissions:
  // OWNER/ADMIN: membership management, mission deletion
  // OWNER/ADMIN/RESEARCHER: create missions, execute analysis, verify research
  // VIEWER: read-only access
  
  if (allowedRoles.includes(activeRole)) {
    return children;
  }

  return fallback;
}
