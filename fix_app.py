import re

with open('server/src/app.js', 'r') as f:
    content = f.read()

content = content.replace('import aiRoutes from "./routes/ai.routes.js";', '')
content = content.replace('import researchWorkspaceRoutes from "./routes/researchWorkspace.routes.js";', 'import researchWorkspaceRoutes from "./routes/researchWorkspace.routes.js";\nimport aiRoutes from "./routes/ai.routes.js";')

with open('server/src/app.js', 'w') as f:
    f.write(content)
