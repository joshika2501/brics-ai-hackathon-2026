from pathlib import Path

path = Path("src/App.jsx")
text = path.read_text(encoding="utf-8")

old = """      } catch (err) {
        setError(err);
      } finally {"""

new = """      } catch (err) {
        console.error("Industries intelligence error:", err);

        let message = "Unable to load source intelligence.";

        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === "string") {
          message = err;
        } else if (err && typeof err === "object") {
          message =
            err.message ||
            err.detail ||
            err.error ||
            err.prediction ||
            err.hotspots ||
            JSON.stringify(err);
        }

        setError(message);
      } finally {"""

if old not in text:
    print("ERROR: Target catch block was not found.")
    print("No changes were made.")
    raise SystemExit(1)

text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")

print("SUCCESS: Industries error handling patched.")