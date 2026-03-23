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

## 从 Notion 手动同步

这个仓库已经预留了手动同步工作流：`.github/workflows/sync-notion.yml`。

### 1. 在 Notion 创建集成

1. 打开 Notion 的集成管理页面
2. 创建一个 internal integration
3. 打开集成权限，确保至少有读取内容的能力
4. 复制它的密钥，后面作为 `NOTION_TOKEN`

### 2. 把 Blog Posts 数据库授权给集成

1. 打开你的 `MyBlog / Blog Posts`
2. 点击右上角 `...`
3. 找到 `Add connections`
4. 选择你刚创建的 integration

### 3. 获取 Database ID

打开 `Blog Posts` 页面，复制这个数据库页面的链接。

常见链接类似：

```text
https://www.notion.so/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

其中前面那段 32 位的 ID，就是 `NOTION_DATABASE_ID`。

如果你之后已经知道更精确的 `data source id`，也可以直接配置 `NOTION_DATA_SOURCE_ID`，脚本同样支持。

### 4. 在 GitHub 仓库里配置 Secrets

进入仓库：

`Settings -> Secrets and variables -> Actions`

新增两个 secret：

- `NOTION_TOKEN`
- `NOTION_DATABASE_ID`

### 5. 手动运行同步

进入仓库：

`Actions -> Sync Notion to Blog -> Run workflow`

运行后它会：

1. 从 Notion 拉取文章
2. 转成 Hugo Markdown
3. 写入 `content/posts/`
4. 自动提交到仓库
5. 触发现有的 Hugo Pages 部署

### 6. 当前字段约定

当前同步脚本默认读取这些字段名：

- `Title`
- `Slug`
- `Date`
- `Tags`
- `Status`：如果有这个字段，只有值为 `Published` 的文章才会发布；没有这个字段时，默认同步成草稿
- `Section`：默认可不填，不填就写入 `content/posts/`
- `Summary`：可选

建议你再补一个 `Status` 列，这样你可以在 Notion 里控制：

- `Published`：同步后公开发布
- 其它值或留空：同步后仍然是草稿

### 7. 正文写在哪里

数据库里的每一行点进去后，正文内容写在页面正文区域。同步脚本会把这部分正文拉成 Markdown。
