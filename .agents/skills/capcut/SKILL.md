---
name: capcut
description: >-
  Automate and manage CapCut video projects, timelines, tracks, subtitles, text,
  and media drafts locally on Windows.
---

# CapCut Integration for Antigravity

This skill allows Antigravity to interact directly with your local CapCut desktop installation, projects, and drafts.

## CapCut Local Path
- **Drafts Folder**: `C:\Users\Admin\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft`
- **MCP Server**: Registered in `C:\Users\Admin\.gemini\config\mcp_config.json` under `"capcut"`.

## Available MCP Tools / CLI Capabilities

### 1. Project Management
- **List Projects**: Inspect all existing CapCut drafts (`capcut_list_projects` or `npx capcut-cli projects --names`).
- **Create Project**: Initialize a new project draft (`capcut_create_project` or `npx capcut-cli init <name> --ratio 16:9`).
- **Inspect Timeline**: View track/segment layout (`capcut_inspect_timeline` or `npx capcut-cli timeline <project>`).

### 2. Timeline & Media Editing
- **Add Video**: Insert a video clip onto the timeline (`capcut_add_video`).
- **Add Audio / Music**: Insert audio/sound tracks (`capcut_add_audio`).
- **Add Text / Titles**: Add text overlays with timestamps (`capcut_add_text`).
- **Import Subtitles**: Import `.srt` or `.ass` subtitle cues (`capcut_import_srt`).
- **Quickstart**: Create a project and attach media in a single command (`capcut_quickstart`).

### 3. Workflow Example
1. Ask Antigravity: *"Create a new 16:9 CapCut project called MyVideo and add video clip C:/videos/clip.mp4"*
2. Antigravity creates the draft in your local CapCut folder.
3. Open **CapCut Desktop** — your project is ready to view, refine, and export.
