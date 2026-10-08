from pathlib import Path
import subprocess, sys
root = Path(__file__).resolve().parent.parent
subprocess.run([sys.executable, str(root/'dnd-source/build.py'), '--online', str(root/'public/dnd')], check=True)
