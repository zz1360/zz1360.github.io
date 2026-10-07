## 阅读与维护

[线上百科](https://blog.luckydogs.top/dnd/) · 非官方知识导览。

本目录包含可独立构建的源码、知识数据和全部 57 幅 WebP 原图。GitHub 仓库的 `dnd-source` 分支维护源码，`main` 分支用于 GitHub Pages 发布静态网页。源码也保存在博客的 `.vuepress/dnd-source/`，以它作为日常编辑入口。

## 构建

需要 Python 3。生成在线图片尺寸还需要 `cwebp`（macOS 可使用 `brew install webp`）。无需 npm 安装即可单独构建百科：

```sh
python3 .vuepress/dnd-source/build.py \
  --offline '/绝对路径/DND世界百科（插图版）.html' \
  --online '/绝对路径/dnd'
```

在线文件默认以 `/dnd/` 为网址前缀；部署到其他路径时需修改 `export_online.py` 中的资源前缀和 canonical。离线 HTML 内嵌全部文字、插图与脚本，可独立打开。外部资料链接需要联网。

在本机博客目录执行 `npm run update:dnd` 可生成 `.vuepress/public/dnd/`。`npm run build` 的 prebuild 会自动更新百科，再由 VuePress 复制到输出目录。

## 编辑位置

| 文件 | 用途 |
| --- | --- |
| `data.json` | 78 个条目的内容、年代、身份、英文名与来源 |
| `relations.json` | 双向阅读关联：两端 ID、关系标签、适用范围和来源键 |
| `history-flow.json` | 13 个历史节点的前因、事件、后果及来源 |
| `render.py`、`enhancements.py` | 页面模板、地图示意与功能面板 |
| `app.js`、`explore.js`、`cosmos.js` | 原有交互、链接与收藏、三维位面图 |
| `style.css`、`explore.css` | 阅读排版与探索工具样式 |
| `art-manifest.json`、`gallery-manifest.json` | 原画、女性系列画廊及艺术演绎说明 |
| `assets/` | 30 幅原画与 27 幅画廊图；不覆盖原图 |
| `build.py`、`export_online.py` | 离线构建、在线导出与响应式图片 |

每条新关联都应给出来源与范围。主题关联和年表先后不能写成直接因果；不同世界和版本的年代也不能合并成统一世界史。地图只作为方向导航，不提供比例、距离或准确坐标。插画不作为官方人物外貌、服饰或已发生事件的证据。

在线版保留完整原图，并生成 320px 缩略图和 640/960px 阅读尺寸。文件名包含原图校验值与编码参数，更新原图会更换资源名。`manifest.json` 保存全部原图与派生图片的 SHA-256 校验值。收藏与最近阅读只保存在浏览器本地，未增加登录或云端存储。

## 源码与发布

在 `dnd-source` 分支提交本目录的更新；在 `main` 分支仅提交生成的 `dnd/` 目录。博客发布脚本从当前远程 main 获取发布基线后覆盖构建内容，保留独立的隐私与支持页面。百科单独更新时不需要重新提交整个博客构建结果。

本轮交互更新：2026-10-08。既有知识资料核对时间仍为 2026-10-02，不代表已重新核对全部最新出版物；官方地图入口单独标注核对时间。
