import os
import re

directory = 'client/src/pages/research'

for filename in os.listdir(directory):
    if not filename.endswith('.jsx'):
        continue

    filepath = os.path.join(directory, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    if 'import ErrorState' not in content:
        last_import_index = content.rfind('import ')
        if last_import_index != -1:
            end_of_line = content.find('\n', last_import_index)
            content = content[:end_of_line] + '\nimport ErrorState from "../../components/ErrorState";' + content[end_of_line:]

    content = re.sub(r'setError\(err\.message \|\| [^)]+\)', 'setError(err)', content)
    content = re.sub(r'setError\(err\.message\)', 'setError(err)', content)

    # Only add onRetry if it is useCallback, meaning it's in scope of render
    fetch_funcs = re.findall(r'const (fetch[A-Za-z0-9_]+) = useCallback', content)
    retry_prop = f' onRetry={{{fetch_funcs[0]}}}' if fetch_funcs else ''

    content = re.sub(
        r'<div className="error-state">Error: \{error[^}]*\}</div>',
        f'<ErrorState error={{error}}{retry_prop} />',
        content
    )
    
    content = re.sub(
        r'<div className="error-state">([^<]+)</div>',
        r'<ErrorState error={{ status: 404, message: "\1" }} />',
        content
    )

    with open(filepath, 'w') as f:
        f.write(content)
