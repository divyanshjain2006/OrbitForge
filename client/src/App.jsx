import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import CreateMission from "./pages/CreateMission";
import Analysis from "./pages/Analysis";
import SimulationLab from "./pages/SimulationLab";
import MissionChallenges from "./pages/MissionChallenges";
import ChallengeDebrief from "./pages/ChallengeDebrief";
import Login from "./pages/Login";

// Research Lab Pages
import ResearchLayout from "./components/ResearchLayout";
import ResearchOverview from "./pages/research/Overview";
import ResearchSearch from "./pages/research/Search";
import Datasets from "./pages/research/Datasets";
import DatasetDetail from "./pages/research/DatasetDetail";
import DatasetVersionDetail from "./pages/research/DatasetVersionDetail";
import Projects from "./pages/research/Projects";
import ProjectDetail from "./pages/research/ProjectDetail";
import ExperimentDetail from "./pages/research/ExperimentDetail";
import RunDetail from "./pages/research/RunDetail";
import ResearchRecordDetail from "./pages/research/ResearchRecordDetail";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <BrowserRouter>
          <div className="app-shell">
            <Navigation />

            <main className="app-main">
              <Routes>
                <Route path="/login" element={<Login />} />

                {/* Protected Platform Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/missions/new" element={
                  <ProtectedRoute>
                    <CreateMission />
                  </ProtectedRoute>
                } />
                <Route path="/analysis/:missionId" element={
                  <ProtectedRoute>
                    <Analysis />
                  </ProtectedRoute>
                } />
                <Route path="/analysis" element={
                  <ProtectedRoute>
                    <Analysis />
                  </ProtectedRoute>
                } />
                <Route path="/simulation/:missionId" element={
                  <ProtectedRoute>
                    <SimulationLab />
                  </ProtectedRoute>
                } />
                <Route path="/challenges/:missionId" element={
                  <ProtectedRoute>
                    <MissionChallenges />
                  </ProtectedRoute>
                } />
                <Route path="/challenges/:missionId/:challengeId" element={
                  <ProtectedRoute>
                    <MissionChallenges />
                  </ProtectedRoute>
                } />
                <Route path="/challenges/:missionId/:challengeId/debrief" element={
                  <ProtectedRoute>
                    <ChallengeDebrief />
                  </ProtectedRoute>
                } />

                {/* Research Lab Routes */}
                <Route path="/research" element={
                  <ProtectedRoute>
                    <ResearchLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<ResearchOverview />} />
                  <Route path="search" element={<ResearchSearch />} />
                  
                  <Route path="datasets" element={<Datasets />} />
                  <Route path="datasets/:id" element={<DatasetDetail />} />
                  <Route path="datasets/:datasetId/versions/:versionId" element={<DatasetVersionDetail />} />
                  
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:projectId" element={<ProjectDetail />} />
                  
                  <Route path="experiments/:experimentId" element={<ExperimentDetail />} />
                  <Route path="runs/:runId" element={<RunDetail />} />
                  <Route path="records/:recordId" element={<ResearchRecordDetail />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;
