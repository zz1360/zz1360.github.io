"""Build the standalone codex only when bootstrapping a fresh source checkout."""
from pathlib import Path
import subprocess, sys
root = Path(__file__).resolve().parent.parent
if not (root/'public/dnd/index.html').is_file() or not (root/'public/dnd/works/yinhun/index.html').is_file():
    subprocess.run([sys.executable,str(root/'scripts/update-dnd.py')],check=True)
