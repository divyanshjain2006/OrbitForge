import sys

files = [
    'client/src/components/Navigation.jsx',
    'client/src/components/trust/ResearchRecordPanel.jsx',
    'client/src/pages/research/Overview.jsx'
]

for filepath in files:
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    with open(filepath, 'w') as f:
        for line in lines:
            f.write(line.rstrip() + '\n')
