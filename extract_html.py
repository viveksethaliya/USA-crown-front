import json
import re

log_path = r'C:\Users\vivek\.gemini\antigravity\brain\d0270ac8-955f-4529-981c-685fd99888cd\.system_generated\logs\overview.txt'
with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in reversed(lines):
    if '"USER_EXPLICIT"' in line and '<USER_REQUEST>' in line:
        try:
            data = json.loads(line)
            content = data.get('content', '')
            with open('scratch_html.txt', 'w', encoding='utf-8') as out:
                out.write(content)
            print('Saved to scratch_html.txt, length:', len(content))
            break
        except Exception as e:
            print('Error parsing JSON:', e)
