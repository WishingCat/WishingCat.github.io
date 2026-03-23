# CalicoCatto Blog

一个基于 Hugo 和 GitHub Pages 的个人博客。

## 本地预览

```powershell
.\.tools\hugo\hugo.exe server -D
```

访问 `http://localhost:1313/` 即可查看。

## 新建文章

```powershell
.\.tools\hugo\hugo.exe new content posts/my-post.md
```

写完后把 front matter 里的 `draft` 改成 `false`，提交并推送到 `main` 分支，GitHub Actions 会自动部署。

## 导入已有文档

### 方式 1：直接导入 Markdown 或 TXT

把已有 `.md` 或 `.txt` 文件导入为博客文章：

```powershell
.\scripts\import-markdown.ps1 -SourcePath "D:\Docs\my-note.md"
```

如果你想指定标题或文章链接名：

```powershell
.\scripts\import-markdown.ps1 `
  -SourcePath "D:\Docs\my-note.md" `
  -Title "我的新文章" `
  -Slug "my-new-post"
```

导入后文件会出现在 `content/posts/` 下，默认是 `draft: true`，发布前改成 `false`。

### 方式 2：Word 或 PDF 文档

Hugo 最适合接收 Markdown，所以建议先把 Word/PDF 转成 Markdown，再导入。

常见流程：

1. 用 Typora、Obsidian、Pandoc 或其它工具把 `.docx` / `.pdf` 转成 `.md`
2. 运行上面的导入脚本
3. 检查标题、图片、代码块和换行
4. 把 `draft` 改成 `false`
5. `git add . && git commit -m "Add post" && git push`

### 文章存放位置

- 普通文章：`content/posts/`
- 关于页：`content/about/index.md`
- 首页文案：`content/_index.md`
