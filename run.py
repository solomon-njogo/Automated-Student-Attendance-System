from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parent


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

    # Start Flask (app.py binds to $PORT if provided, else 5000)
    _run([sys.executable, str(ROOT / "app.py")], cwd=ROOT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

