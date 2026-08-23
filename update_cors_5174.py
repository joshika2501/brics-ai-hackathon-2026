from pathlib import Path

p = Path("backend/app.py")
s = p.read_text(encoding="utf-8")

origin = '        "http://localhost:5174",'

if origin not in s:
    marker = '        "http://localhost:5173",'
    if marker not in s:
        raise RuntimeError("CORS insertion point not found.")

    s = s.replace(
        marker,
        marker + "\n" + origin,
        1,
    )

p.write_text(s, encoding="utf-8")

print("SUCCESS: localhost:5174 added to CORS.")
