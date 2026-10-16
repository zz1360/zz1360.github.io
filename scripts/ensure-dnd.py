"""Build the standalone codex only when bootstrapping a fresh source checkout."""
from pathlib import Path
import subprocess, sys
root = Path(__file__).resolve().parent.parent
if not all((root/path).is_file() for path in ['public/dnd/index.html','public/dnd/works/yinhun/index.html','public/dnd/settings/eberron/index.html','public/dnd/settings/planescape/index.html']):
    subprocess.run([sys.executable,str(root/'scripts/update-dnd.py')],check=True)
