import re

with open('client/src/pages/research/ExperimentDetail.jsx', 'r') as f:
    content = f.read()

if 'import AiInsightPanel' not in content:
    content = content.replace('import ErrorState from "../../components/ErrorState";', 'import ErrorState from "../../components/ErrorState";\nimport AiInsightPanel from "../../components/ai/AiInsightPanel";')
    
    insight_component = """
      <div style={{ marginTop: "2rem" }}>
        <AiInsightPanel role="RESEARCH_ASSISTANT" contextRefs={{ experimentId: id }} buttonLabel="Summarize Experiment" />
      </div>
"""
    content = content.replace('</section>', '</section>' + insight_component, 1)
    
    with open('client/src/pages/research/ExperimentDetail.jsx', 'w') as f:
        f.write(content)
