import re

with open('client/src/pages/research/Projects.jsx', 'r') as f:
    content = f.read()
content = content.replace("<h3>No Projects Found</h3>", "<h3>No Research Projects</h3>")
content = content.replace("<p style={{ color: \"var(--text-secondary)\" }}>Create a project to start running experiments.</p>", "<p style={{ color: \"var(--text-secondary)\" }}>No research projects exist in this workspace yet. Create a project to start running experiments.</p>")
with open('client/src/pages/research/Projects.jsx', 'w') as f:
    f.write(content)


with open('client/src/pages/research/ProjectDetail.jsx', 'r') as f:
    content = f.read()
content = content.replace("No experiments designed yet.", "This project has no experiments yet. Design a new experiment to begin.")
with open('client/src/pages/research/ProjectDetail.jsx', 'w') as f:
    f.write(content)


with open('client/src/pages/research/ExperimentDetail.jsx', 'r') as f:
    content = f.read()
content = content.replace("No runs executed yet.", "No experiment runs are available yet.")
with open('client/src/pages/research/ExperimentDetail.jsx', 'w') as f:
    f.write(content)


with open('client/src/pages/research/Overview.jsx', 'r') as f:
    content = f.read()

overview_empty = """
          {counts.projects === 0 && counts.datasets === 0 && (
            <div style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "4px", marginBottom: "1.5rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              This workspace currently contains no research records. Create a project or ingest a dataset to begin.
            </div>
          )}
"""
if "This workspace currently contains no research records" not in content:
    content = content.replace('<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>', overview_empty + '          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>')

with open('client/src/pages/research/Overview.jsx', 'w') as f:
    f.write(content)
