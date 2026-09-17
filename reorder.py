import re

with open("client/src/pages/Analysis.jsx", "r") as f:
    content = f.read()

# Define the markers
markers = [
    "PAGE HERO",
    "INTELLIGENCE HERO",
    "DECISION SNAPSHOT",
    "ORBITAL CONFIGURATION",
    "ORBIT VISUALIZATION",
    "ORBITAL MECHANICS",
    "RISK FACTORS",
    "RECOMMENDED ACTIONS",
    "SPACE ENVIRONMENT",
    "SCENARIO SIMULATOR",
    "ASSESSMENT HISTORY",
    "DECISION CENTER",
    "METHODOLOGY"
]

blocks = {}

for i, marker in enumerate(markers):
    start_str = f"{{/* =====================================================\n          {marker}\n          ===================================================== */}}"
    
    if i < len(markers) - 1:
        next_marker = markers[i+1]
        end_str = f"{{/* =====================================================\n          {next_marker}\n          ===================================================== */}}"
        
        idx_start = content.find(start_str)
        idx_end = content.find(end_str)
        
        if idx_start != -1 and idx_end != -1:
            blocks[marker] = content[idx_start:idx_end]
        else:
            print(f"FAILED TO FIND {marker}")
    else:
        idx_start = content.find(start_str)
        if idx_start != -1:
            idx_end = content.find("</main>", idx_start)
            blocks[marker] = content[idx_start:idx_end]
        else:
            print(f"FAILED TO FIND {marker}")

if not all(m in blocks for m in markers):
    print("Missing some blocks, exiting")
    exit(1)

# Modify Content

config = blocks["ORBITAL CONFIGURATION"]
config = config.replace('ORBITAL CONFIGURATION\n            </span>', 'MISSION CONFIGURATION (INPUT)\n            </span>')
config = config.replace('<h2>\n              Mission Parameters\n            </h2>', '<h2>\n              Mission Configuration\n            </h2>')
config = config.replace('Current configuration used by the', 'User-defined parameters used by the')

mechanics = blocks["ORBITAL MECHANICS"]
mechanics = mechanics.replace('ORBITAL MECHANICS\n            </span>', 'ORBITAL ANALYSIS (MODEL)\n            </span>')
mechanics = mechanics.replace('<h2>\n              Orbital Characteristics\n            </h2>', '<h2>\n              Orbital Characteristics\n            </h2>\n            <p className="muted" style={{ marginTop: "0.5rem" }}>Methodology: Deterministic circular two-body estimate.</p>')

env = blocks["SPACE ENVIRONMENT"]
env = env.replace('SPACE ENVIRONMENT\n            </span>', 'ENVIRONMENTAL ASSESSMENT (OUTPUT)\n            </span>')

risk_factors = blocks["RISK FACTORS"]
risk_factors = risk_factors.replace('RISK ASSESSMENT\n            </span>', 'RISK ASSESSMENT (HEURISTIC)\n            </span>')

actions = blocks["RECOMMENDED ACTIONS"]

intel = blocks["INTELLIGENCE HERO"]
intel = intel.replace('DECISION-SUPPORT ASSESSMENT\n            </span>', 'MISSION INTELLIGENCE (AI EXPLANATION)\n            </span>')

decision_snapshot = blocks["DECISION SNAPSHOT"]
decision_snapshot = decision_snapshot.replace('DECISION SNAPSHOT', 'DECISION SUPPORT (USER ACTION)')


new_order = [
    "PAGE HERO",
    "ORBITAL CONFIGURATION",
    "ORBITAL MECHANICS",
    "ORBIT VISUALIZATION",
    "SPACE ENVIRONMENT",
    "RISK FACTORS",
    "RECOMMENDED ACTIONS",
    "INTELLIGENCE HERO",
    "DECISION SNAPSHOT",
    "SCENARIO SIMULATOR",
    "ASSESSMENT HISTORY",
    "DECISION CENTER",
    "METHODOLOGY"
]

final_inner = ""
for m in new_order:
    if m == "ORBITAL CONFIGURATION":
        final_inner += config
    elif m == "ORBITAL MECHANICS":
        final_inner += mechanics
    elif m == "SPACE ENVIRONMENT":
        final_inner += env
    elif m == "RISK FACTORS":
        final_inner += risk_factors
    elif m == "RECOMMENDED ACTIONS":
        final_inner += actions
    elif m == "INTELLIGENCE HERO":
        final_inner += intel
    elif m == "DECISION SNAPSHOT":
        final_inner += decision_snapshot
    else:
        final_inner += blocks[m]

start_first = content.find(f"{{/* =====================================================\n          {markers[0]}\n          ===================================================== */}}")
end_last = content.find("</main>", start_first)

final_content = content[:start_first] + final_inner + content[end_last:]

with open("client/src/pages/Analysis.jsx", "w") as f:
    f.write(final_content)

print("SUCCESS")
