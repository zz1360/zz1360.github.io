#!/usr/bin/env python3
"""Build a standalone offline HTML, online assets, or both from the maintained source."""
from pathlib import Path
import argparse,subprocess,sys,tempfile
from export_online import export
root=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--offline',type=Path,help='输出完整离线 HTML 文件')
parser.add_argument('--online',type=Path,help='输出在线目录（index.html、manifest.json、assets）')
args=parser.parse_args()
if not args.offline and not args.online:parser.error('请指定 --offline 或 --online')
with tempfile.TemporaryDirectory(prefix='dnd-build-') as temp:
    path=args.offline or Path(temp)/'dnd.html'
    subprocess.run([sys.executable,str(root/'render.py'),'--output',str(path)],check=True)
    if args.online:export(path.read_text(),args.online)
