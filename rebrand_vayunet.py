from pathlib import Path

p = Path(r"frontend-dashboard\src\App.jsx")
s = p.read_text(encoding="utf-8-sig")

replacements = {
    "BRICS EcoSphere": "VAYUNET",
    "BRICS 2026 • ENVIRONMENTAL INTELLIGENCE": "ENVIRONMENTAL INTELLIGENCE FOR INDIA",
    "BRICS Environmental Intelligence": "VAYUNET Environmental Intelligence",
    "BRICS Network": "India Environmental Network",
    "BRICS Regulatory Context": "India Regulatory Context",
    "BRICS AI Assistant": "VAYUNET AI Assistant",
    "BRICS Environmental Intelligence Assistant": "VAYUNET AI Environmental Assistant",
    "/brics-logo.svg": "/vayunet-logo.png",
    "/assets/brics-india-2026.svg": "/vayunet-logo.png",
}

changed = 0

for old, new in replacements.items():
    count = s.count(old)
    if count:
        s = s.replace(old, new)
        changed += count
        print(f"Replaced {count}x: {old} -> {new}")

p.write_text(s, encoding="utf-8")

print(f"OK: {changed} visible branding replacements made")