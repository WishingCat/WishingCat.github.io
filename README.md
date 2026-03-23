# CalicoCatto Blog

一个基于 Hugo 和 GitHub Pages 的个人博客。

## 本地预览

```powershell
hugo server -D
```

访问 `http://localhost:1313/` 即可查看。

## 新建文章

```powershell
hugo new content posts/my-post.md
```

写完后把 front matter 里的 `draft` 改成 `false`，提交并推送到 `main` 分支，GitHub Actions 会自动部署。
