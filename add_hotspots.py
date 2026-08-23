from pathlib import Path

p = Path("backend/services/prediction.py")
s = p.read_text(encoding="utf-8")

import_line = "from backend.services.hotspots import generate_hotspots"

if import_line not in s:
    s = import_line + "\n" + s

hotspot_block = '''    # ---------------------------------------------------------
    # Hyperlocal hotspot intelligence
    # ---------------------------------------------------------

    hotspots = generate_hotspots(
        city=city,
        current_pm25=current_pm25,
        predicted_pm25=prediction,
        risk_level=risk["risk_level"],
        trend_direction=risk["trend"]["direction"],
        drivers=top_evidence,
    )

'''

marker = '''    # ---------------------------------------------------------
    # Deterministic intelligence result
    # ---------------------------------------------------------

    result = {'''

if "hotspots = generate_hotspots(" not in s:
    if marker not in s:
        raise RuntimeError("Could not find result insertion point.")
    s = s.replace(marker, hotspot_block + marker, 1)

result_marker = '''        "evidence": top_evidence,

        "decision": decision,'''

result_replacement = '''        "evidence": top_evidence,

        "hotspots": hotspots,

        "decision": decision,'''

if '"hotspots": hotspots' not in s:
    if result_marker not in s:
        raise RuntimeError("Could not find result dictionary insertion point.")
    s = s.replace(result_marker, result_replacement, 1)

p.write_text(s, encoding="utf-8")

print("SUCCESS: hotspot integration added.")
