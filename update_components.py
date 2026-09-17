import os
import re

directory = 'client/src/pages/research'

for filename in os.listdir(directory):
    if not filename.endswith('.jsx'):
        continue

    filepath = os.path.join(directory, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Import ErrorState
    if 'import ErrorState' not in content:
        # insert after last import
        imports = re.findall(r'^import .*?;?', content, re.MULTILINE)
        if imports:
            last_import = imports[-1]
            content = content.replace(last_import, last_import + '\nimport ErrorState from "../../components/ErrorState";')

    # 2. Change setError(err.message || "...") to setError(err)
    content = re.sub(r'setError\(err\.message \|\| [^)]+\)', 'setError(err)', content)
    # Also handle setError(err.message) if any
    content = re.sub(r'setError\(err\.message\)', 'setError(err)', content)

    # 3. Change rendering of error states
    # Let's find fetch function names to pass to onRetry
    fetch_funcs = re.findall(r'const (fetch[A-Za-z0-9_]+) = useCallback', content)
    if not fetch_funcs:
        fetch_funcs = re.findall(r'async function (fetch[A-Za-z0-9_]+)\(', content)
    
    retry_prop = f' onRetry={{{fetch_funcs[0]}}}' if fetch_funcs else ''

    content = re.sub(
        r'<div className="error-state">Error: \{error[^}]*\}</div>',
        f'<ErrorState error={{error}}{retry_prop} />',
        content
    )
    
    # 4. Change not found states
    # e.g., if (!projectData || !projectData.project) return <div className="error-state">Project not found</div>;
    content = re.sub(
        r'<div className="error-state">([^<]+)</div>',
        r'<ErrorState error={{ { status: 404, message: "\1" } }} />',
        content
    )

    with open(filepath, 'w') as f:
        f.write(content)
