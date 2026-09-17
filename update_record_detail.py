import re

with open('client/src/pages/research/ResearchRecordDetail.jsx', 'r') as f:
    content = f.read()

if 'import AiInsightPanel' not in content:
    content = content.replace('import ErrorState from "../../components/ErrorState";', 'import ErrorState from "../../components/ErrorState";\nimport AiInsightPanel from "../../components/ai/AiInsightPanel";')
    
    insight_component = """
      <div style={{ marginTop: "2rem" }}>
        <AiInsightPanel role="SCIENTIFIC_EXPLAINER" contextRefs={{ researchRecordId: id }} buttonLabel="Explain Scientific Result" />
      </div>
"""
    content = content.replace('</section>', '</section>' + insight_component, 1)
    
    with open('client/src/pages/research/ResearchRecordDetail.jsx', 'w') as f:
        f.write(content)
