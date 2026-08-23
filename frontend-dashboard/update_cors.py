from pathlib import Path

p = Path("backend/app.py")
s = p.read_text(encoding="utf-8")

origin = '        "https://brics-hackathon-2026.web.app",'

if origin not in s:
    marker = '        "http://127.0.0.1:3000",'
    if marker not in s:
        raise RuntimeError("CORS insertion point not found.")
    s = s.replace(marker, marker + "\n" + origin, 1)

# Add temporary local port for testing.
local_origin = '        "http://localhost:6380",'
if local_origin not in s:
    marker = '        "http://localhost:3000",'
    s = s.replace(marker, marker + "\n" + local_origin, 1)

p.write_text(s, encoding="utf-8")
print("CORS updated successfully.")
