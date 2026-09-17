import os
import re

directory = 'client/src/pages/research'

for filename in os.listdir(directory):
    if not filename.endswith('.jsx'):
        continue

    filepath = os.path.join(directory, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Import ErrorState safely
    if 'import ErrorState' not in content:
        # Find the last import statement
        last_import_index = content.rfind('import ')
        if last_import_index != -1:
            end_of_line = content.find('\n', last_import_index)
            content = content[:end_of_line] + '\nimport ErrorState from "../../components/ErrorState";' + content[end_of_line:]

    # 2. Change setError(err.message || "...") to setError(err)
    content = re.sub(r'setError\(err\.message \|\| [^)]+\)', 'setError(err)', content)
    content = re.sub(r'setError\(err\.message\)', 'setError(err)', content)

    # 3. Change rendering of error states
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
    content = re.sub(
        r'<div className="error-state">([^<]+)</div>',
        r'<ErrorState error={{ { status: 404, message: "\1" } }} />',
        content
    )

    with open(filepath, 'w') as f:
        f.write(content)
