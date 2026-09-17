import os
import re

directory = 'src/pages/research'

for filename in os.listdir(directory):
    if not filename.endswith('.jsx'):
        continue

    filepath = os.path.join(directory, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    # The issue was something like `import { RoleGuard } from "../../components/RoleGuard";import ErrorState from "../../components/ErrorState";`
    content = content.replace(';import ErrorState', ';\nimport ErrorState')
    content = content.replace('"import ErrorState', '"\nimport ErrorState')
    content = content.replace("'import ErrorState", "'\nimport ErrorState")
    
    with open(filepath, 'w') as f:
        f.write(content)
