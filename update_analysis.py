import re

with open('client/src/pages/Analysis.jsx', 'r') as f:
    content = f.read()

if 'import AiInsightPanel' not in content:
    content = content.replace('import ScenarioSimulator', 'import AiInsightPanel from "../components/ai/AiInsightPanel";\nimport ScenarioSimulator')
    
    insight_component = """
          <section className="dashboard-card intelligence-card">
            <h2>Mission Intelligence</h2>
            <AiInsightPanel role="MISSION_ANALYST" contextRefs={{ missionId: id }} buttonLabel="Generate AI Mission Analysis" />
          </section>
"""
    content = content.replace('<section className="dashboard-card intelligence-card">', insight_component + '\n          <section className="dashboard-card intelligence-card">', 1)
    
    with open('client/src/pages/Analysis.jsx', 'w') as f:
        f.write(content)
