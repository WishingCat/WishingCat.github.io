param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,

    [string]$Title,

    [string]$Slug,

    [string]$Section = "posts"
)

$ErrorActionPreference = "Stop"

function New-Slug {
    param([string]$Value)

    $slug = $Value.ToLowerInvariant()
    $slug = $slug -replace "[^a-z0-9\u4e00-\u9fa5\s-]", ""
    $slug = $slug -replace "\s+", "-"
    $slug = $slug -replace "-{2,}", "-"
    $slug = $slug.Trim("-")

    if ([string]::IsNullOrWhiteSpace($slug)) {
        throw "无法从文件名生成 slug，请手动传入 -Slug。"
    }

    return $slug
}

$resolvedSource = Resolve-Path $SourcePath
$extension = [System.IO.Path]::GetExtension($resolvedSource).ToLowerInvariant()

if ($extension -notin @(".md", ".markdown", ".txt")) {
    throw "当前脚本仅支持 .md / .markdown / .txt。Word 或 PDF 请先转成 Markdown 再导入。"
}

$raw = Get-Content $resolvedSource -Raw
$baseName = [System.IO.Path]::GetFileNameWithoutExtension($resolvedSource)

if ([string]::IsNullOrWhiteSpace($Title)) {
    $Title = $baseName
}

if ([string]::IsNullOrWhiteSpace($Slug)) {
    $Slug = New-Slug $baseName
}

$sectionDir = Join-Path "content" $Section
if (-not (Test-Path $sectionDir)) {
    New-Item -ItemType Directory -Path $sectionDir -Force | Out-Null
}

$destination = Join-Path $sectionDir "$Slug.md"

if ($raw.TrimStart().StartsWith("---")) {
    Set-Content -Path $destination -Value $raw -Encoding UTF8
    Write-Host "已导入现成 Markdown（保留原 front matter）：$destination"
    exit 0
}

$frontMatter = @"
---
title: "$Title"
date: $(Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
draft: true
slug: "$Slug"
description: ""
tags: []
categories: []
---

"@

$output = $frontMatter + $raw.TrimStart()
Set-Content -Path $destination -Value $output -Encoding UTF8

Write-Host "已导入到 $destination"
Write-Host "下一步：编辑文件并把 draft 改成 false，然后提交推送。"
