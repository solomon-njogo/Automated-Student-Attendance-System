from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parent

# Expose the Flask app for production servers (e.g., Render/Gunicorn).
# This allows: gunicorn run:app
from app import app  # noqa: E402


def _run(cmd: list[str], *, cwd: Path) -> None:
    subprocess.run(cmd, cwd=str(cwd), check=True)

def _npm_command() -> list[str]:
    """
    Resolve an npm invocation across Windows shells.

    - Prefer an actual npm executable on PATH (npm / npm.cmd)
    - Fall back to: node <npm_cli_js> if npm_execpath is provided
    """

    npm_exe = shutil.which("npm") or shutil.which("npm.cmd") or shutil.which("npm.exe")
    if npm_exe:
        return [npm_exe]

    npm_execpath = os.environ.get("npm_execpath")
    if npm_execpath:
        node_exe = shutil.which("node") or shutil.which("node.exe")
        if not node_exe:
            raise FileNotFoundError(
                "Could not find 'npm' on PATH and could not find 'node' to run npm via npm_execpath."
            )
        return [node_exe, npm_execpath]

    raise FileNotFoundError(
        "Could not find 'npm' on PATH. Install Node.js (includes npm) or ensure npm is available in this shell."
    )


def main() -> int:
    frontend_dir = ROOT / "frontend"
    if not frontend_dir.is_dir():
        raise FileNotFoundError(f"Expected frontend directory at: {frontend_dir}")

    # Build the UI (output goes to ./ui_dist via frontend/vite.config.ts)
    npm_cmd = _npm_command()
    _run([*npm_cmd, "--prefix", "frontend", "run", "build"], cwd=ROOT)

    # Start the server in a cross-platform way.
    # - On Render/Linux you should use Gunicorn (see render.yaml).
    # - On Windows, Gunicorn doesn't work; Waitress does.
    port = int(os.environ.get("PORT", "5000"))
    if sys.platform.startswith("win"):
        from waitress import serve  # type: ignore

        serve(app, host="0.0.0.0", port=port)
    else:
        app.run(host="0.0.0.0", port=port, debug=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

