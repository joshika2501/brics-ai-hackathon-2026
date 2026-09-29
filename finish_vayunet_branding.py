from pathlib import Path

p = Path(r"frontend-dashboard\src\App.jsx")
s = p.read_text(encoding="utf-8-sig")

replacements = {
    'alt="BRICS India 2026"': 'alt="VAYUNET — Environmental Intelligence for India"',
    "BRICS <span>EcoSphere</span>": "VAYUNET <span>Environmental Intelligence</span>",
    'network:"BRICS ': 'network:"India ',
}

for old, new in replacements.items():
    count = s.count(old)
    if count:
        s = s.replace(old, new)
        print(f"Replaced {count}x: {old}")

p.write_text(s, encoding="utf-8")
print("OK: remaining visible VAYUNET branding updated")