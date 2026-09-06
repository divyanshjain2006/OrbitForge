/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { getWorkspaces } from "../services/api";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    return localStorage.getItem("activeWorkspaceId") || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorkspaces = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getWorkspaces();
      if (data.success && data.workspaces) {
        setWorkspaces(data.workspaces);
        
        // If there's no active workspace, or the active one doesn't exist anymore, pick the first one
        if (data.workspaces.length > 0) {
          const workspaceExists = data.workspaces.find(w => w.id === activeWorkspaceId);
          if (!activeWorkspaceId || !workspaceExists) {
            setActiveWorkspaceId(data.workspaces[0].id);
          }
        } else {
          setActiveWorkspaceId(null);
        }
      } else {
        throw new Error(data.message || "Failed to fetch workspaces");
      }
    } catch (err) {
      console.error("Workspace fetch failed:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, activeWorkspaceId]); // Re-fetch on workspace change

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Persist active workspace to local storage
  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem("activeWorkspaceId", activeWorkspaceId);
    } else {
      localStorage.removeItem("activeWorkspaceId");
    }
  }, [activeWorkspaceId]);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || null;
  const activeRole = activeWorkspace ? activeWorkspace.role : null;

  const setWorkspace = (workspaceId) => {
    setActiveWorkspaceId(workspaceId);
  };

  const value = {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    activeRole,
    isLoading,
    error,
    setWorkspace,
    refreshWorkspaces: fetchWorkspaces
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
