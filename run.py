from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
import shutil
import textwrap


ROOT = Path(__file__).resolve().parent

# Expose the Flask app for production servers (e.g., Render/Gunicorn).
# This allows: gunicorn run:app
from app import app  # noqa: E402


def _run(cmd: list[str], *, cwd: Path) -> None:
    subprocess.run(cmd, cwd=str(cwd), check=True)


def _truthy(v: str | None) -> bool:
    return (v or "").strip().lower() in {"1", "true", "yes", "y", "on"}


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
    """
    Dev/production runner.

    - Default: builds the frontend once, then serves the app.
    - Dev mode: set AUTO_RELOAD=1 to enable Flask auto-reload on backend changes.
      Optionally set UI_WATCH=1 to run a Vite build watcher for ui_dist updates.
    """

    frontend_dir = ROOT / "frontend"
    if not frontend_dir.is_dir():
        raise FileNotFoundError(f"Expected frontend directory at: {frontend_dir}")

    npm_cmd = _npm_command()

    auto_reload = _truthy(os.environ.get("AUTO_RELOAD"))
    ui_watch = _truthy(os.environ.get("UI_WATCH"))

    # Build the UI (output goes to ./ui_dist via frontend/vite.config.ts)
    if not ui_watch:
        _run([*npm_cmd, "--prefix", "frontend", "run", "build"], cwd=ROOT)

    # Start the server in a cross-platform way.
    # - On Render/Linux you should use Gunicorn (see render.yaml).
    # - On Windows, Gunicorn doesn't work; Waitress does.
    port = int(os.environ.get("PORT", "5000"))

    public_host = os.environ.get("HOST", "0.0.0.0")
    local_url = f"http://127.0.0.1:{port}/"
    print(
        textwrap.dedent(
            f"""
            Server starting
            - App: {local_url}
            - API: {local_url}api/
            """
        ).strip()
    )

    if auto_reload:
        # Flask's reloader runs main() twice; only start watchers in the reloader child.
        if ui_watch and os.environ.get("WERKZEUG_RUN_MAIN") == "true":
            subprocess.Popen(
                [*npm_cmd, "--prefix", "frontend", "run", "build", "--", "--watch"],
                cwd=str(ROOT),
            )
            print("UI watch enabled (Vite build --watch).")

        app.run(host=public_host, port=port, debug=True, use_reloader=True)
        return 0

    if sys.platform.startswith("win"):
        from waitress import serve  # type: ignore

        serve(app, host=public_host, port=port)
    else:
        app.run(host=public_host, port=port, debug=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

