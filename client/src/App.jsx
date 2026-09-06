import { BrowserRouter, Route, Routes } from "react-router-dom";

import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import CreateMission from "./pages/CreateMission";
import Analysis from "./pages/Analysis";
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

                {/* Legacy / Unprotected Routes */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/missions/new" element={<CreateMission />} />
                <Route path="/analysis/:missionId" element={<Analysis />} />
                <Route path="/analysis" element={<Analysis />} />

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
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;
