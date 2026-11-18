<div align="center">

# animation-styles-skill

<a href="README.md"><img src="https://img.shields.io/badge/English-0E0F0E?style=for-the-badge" alt="English"></a>
<a href="README.zh-CN.md"><img src="https://img.shields.io/badge/简体中文-DDF53D?style=for-the-badge" alt="简体中文"></a>

**Seven visual styles for Claude's hand-painted animation skill.**
Write the scenes once, then pick watercolour, pixel, paper cutout, crayon, chalk, neon or risograph.

</div>

![The same scene in all seven styles](skills/painted-animation/template/docs/styles.jpg)

## What This Fork Adds

This repository builds on [opus-video-skills](https://github.com/tuzhechen2005/opus-video-skills) by tuzhechen2005 (via [Joker-chichi/claude-mv-skill](https://github.com/Joker-chichi/claude-mv-skill)). The original skill draws everything in **watercolour only**. This fork adds:

- **Six new styles** alongside the original watercolour (table below).
- **A style choice in the workflow.** Before the storyboard, Claude asks which style to use in a single question. If you already named a style, it skips the question.
- **A pluggable style layer.** Scene code is unchanged; the style is one line in `src/config.js`, or `--style=` on the renderer to preview another style without editing anything.
- **Much faster renders for the new styles.** They draw on a plain 2D canvas at roughly 2–250 ms per frame, compared with 0.3–9 s per frame for watercolour, and they need no GPU.
- **Microsoft Edge support.** On Windows, Edge is found automatically when Chrome is not installed.

| style | look | speed |
|---|---|---|
| `watercolor` | watercolour washes and boiling ink on paper (original, default) | slow, GPU |
| `pixel` 🆕 | retro game art: low-res grid, limited palette, ordered dither | very fast |
| `cutout` 🆕 | paper cutout / shadow puppets: card, cut edges, cast shadows | fast |
| `crayon` 🆕 | a child's crayon drawing: waxy streaks, paper tooth | fast |
| `chalk` 🆕 | chalk on a green blackboard | fast |
| `neon` 🆕 | glowing neon tubes in a dark world, scanlines | medium |
| `riso` 🆕 | risograph: four spot inks as halftones, off-register | fast |

If you only want watercolour, the original repository does the same job.

## Overview

The skill teaches Claude Opus 5.5 to produce a complete animated video, covering storyboarding, animation, review, lyric synchronisation and final encoding. All imagery is generated procedurally in code; no image or video generation model is involved. Every frame is a pure function of time, rendered in headless Chrome or Edge and encoded with ffmpeg.

### painted-animation

![painted-animation](skills/painted-animation/docs/xiaozhen-sheet.jpg)

Characters act through a library of expressions and motion principles. Music videos are cut to the measured beat, and lyric videos carry word-by-word karaoke subtitles. Example: a 31-second lyric video for 陶喆《小镇姑娘》 (shown in watercolour). [Documentation](skills/painted-animation/README.md).

## Requirements

- Claude Code with Claude Opus 5.5
- Node.js, Google Chrome (or Microsoft Edge), ffmpeg
- Python 3 with numpy (painted-animation tempo detection only)

## Installation

**As plugins (recommended).** In Claude Code:

```
/plugin marketplace add xsong13/animation-styles-skill
/plugin install painted-animation@animation-styles-skill
```

`/plugin update` fetches new versions.

**As personal skills.** Clone the repository once and link the skills you want:

```bash
git clone https://github.com/xsong13/animation-styles-skill ~/animation-styles-skill
ln -s ~/animation-styles-skill/skills/painted-animation ~/.claude/skills/painted-animation
```

Updating is then a `git pull` in `~/animation-styles-skill`.

## Usage

Describe the video in Claude Code. The matching skill is selected automatically, or it can be invoked by name:

> Make a 15-second video of Clawd trying to catch a butterfly.

Before the storyboard, Claude asks which of the seven styles to use (one question; a style you already named is used as is). Name one up front to skip it:

> Make a 15-second paper-cutout video of Clawd trying to catch a butterfly.

For a music video, provide the song audio and an LRC lyric file, then optionally answer one combined question about the desired story and feeling, recurring imagery and anything to avoid. The question is never split into five fields and may be left blank. The skill scaffolds a project, presents a storyboard, and reviews every shot. It never starts the complete final render without asking for an explicit local-or-cloud choice; choosing local prohibits cloud full rendering and returns exact local commands.

## Repository Structure

| Path | Description |
|---|---|
| `.claude-plugin/marketplace.json` | Plugin marketplace manifest |
| `skills/painted-animation/` | The animation skill: engine, guides, examples |
| `skills/painted-animation/template/src/styles/` | The seven styles, one file each |

## Adding a Style

A style is one file in `skills/painted-animation/template/src/styles/` that decides how `paint()`, `inkLine()` and `glow()` are drawn, plus its name in the `STYLES` list in `studio.html`. The 2D styles build on `kit2d.js`. Frames must stay pure functions of time. See "Styles" in `template/ANIMATION_GUIDE.md`.

## Acknowledgements

The base skill, the watercolour engine and the 小镇姑娘 example come from [opus-video-skills](https://github.com/tuzhechen2005/opus-video-skills) by tuzhechen2005. The style layer and the six new styles were added in this repository.

The painted-animation engine and guide are adapted from [ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) by John Heibel (MIT License), and the method follows his [PDoomVideo](https://github.com/JohnHeibel/PDoomVideo). The project uses p5.js, p5.brush, Puppeteer and ffmpeg. The skill and examples were produced with Claude Opus 5.5 in Claude Code.

## License

MIT. See [LICENSE](LICENSE).
