from pathlib import Path

path = Path("frontend-dashboard/src/App.jsx")
text = path.read_text(encoding="utf-8")

old = '''<div>
  <b>VAYUNET</b>
  <span>Environmental Intelligence for India</span>
</div>'''

new = '''<div>
  <b>VAYUNET</b>
  <span>Environmental Intelligence</span>
</div>'''

if old not in text:
    print("ERROR: Sidebar branding pattern not found.")
    raise SystemExit(1)

text = text.replace(old, new, 1)
path.write_text(text, encoding="utf-8")

print("OK: Sidebar branding compacted.")