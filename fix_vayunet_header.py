from pathlib import Path

path = Path("frontend-dashboard/src/App.jsx")
text = path.read_text(encoding="utf-8")

old = '<div><h1>VAYUNET <span>Environmental Intelligence</span></h1><p>Predictive Environmental Intelligence</p></div>'

new = '''<div className="brand-text">
  <h1>VAYUNET</h1>
  <p>Environmental Intelligence for India</p>
</div>'''

if old not in text:
    print("ERROR: Header JSX pattern not found.")
    print("No changes were made.")
    raise SystemExit(1)

text = text.replace(old, new, 1)

old_sidebar = '<div><b>VAYUNET</b><span>Environmental Intelligence</span></div>'
new_sidebar = '''<div>
  <b>VAYUNET</b>
  <span>Environmental Intelligence for India</span>
</div>'''

if old_sidebar in text:
    text = text.replace(old_sidebar, new_sidebar, 1)
    print("Updated sidebar branding.")
else:
    print("Sidebar branding pattern not found; leaving it unchanged.")

path.write_text(text, encoding="utf-8")

print("OK: VAYUNET header alignment updated.")