<div align="center">

# animation-styles-skill

<a href="README.md"><img src="https://img.shields.io/badge/English-0E0F0E?style=for-the-badge" alt="English"></a>
<a href="README.zh-CN.md"><img src="https://img.shields.io/badge/简体中文-DDF53D?style=for-the-badge" alt="简体中文"></a>

基于 Claude Opus 5.5 的手绘动画视频制作技能（Claude Code Skill）。

</div>

## 概述

本仓库中的技能能让 Claude Opus 5.5 独立完成手绘动画视频，涵盖分镜、动画、审查、歌词同步与最终编码。所有画面均由代码程序化生成，不依赖任何图像或视频生成模型。每一帧都由时间唯一确定，在无头 Chrome 中渲染，并由 ffmpeg 编码输出。

## 技能

### painted-animation

![painted-animation](skills/painted-animation/docs/xiaozhen-sheet.jpg)

用 p5.js 绘制每个镜头，可选七种风格：水彩（p5.brush，默认）、像素、剪纸、蜡笔、粉笔、霓虹、孔版印刷，场景代码不变、一行配置切换。角色依托一套表情库与动画原理进行表演，音乐视频按测得的节拍剪辑，歌词 MV 配有逐字卡拉 OK 字幕。示例为陶喆《小镇姑娘》的 31 秒歌词 MV。[说明文档](skills/painted-animation/README.zh-CN.md)。

## 环境要求

- Claude Code 及 Claude Opus 5.5
- Node.js、Google Chrome（或 Microsoft Edge）、ffmpeg
- Python 3 及 numpy（仅 painted-animation 的节拍检测需要）

## 安装

**以插件方式安装（推荐）。** 在 Claude Code 中执行：

```
/plugin marketplace add xsong13/animation-styles-skill
/plugin install painted-animation@animation-styles-skill
```

之后用 `/plugin update` 获取新版本。

**以个人技能方式安装。** 克隆仓库一次，再链接所需的技能：

```bash
git clone https://github.com/xsong13/animation-styles-skill ~/animation-styles-skill
ln -s ~/animation-styles-skill/skills/painted-animation ~/.claude/skills/painted-animation
```

之后在 `~/animation-styles-skill` 中执行 `git pull` 即可更新。

## 使用方法

在 Claude Code 中描述所需视频，系统会自动选用匹配的技能，也可以按名称直接调用：

> 制作一段 15 秒的动画：Clawd 试图抓住一只蝴蝶。

写分镜之前，Claude 会用一个问题询问使用七种风格中的哪一种；如果你已经说明了风格，就直接采用。可以一开始就指定：

> 制作一段 15 秒的剪纸风格动画：Clawd 试图抓住一只蝴蝶。

制作音乐 MV 时，请提供歌曲音频和 LRC 歌词文件；创作方向通过一个可留空的自然问题一次问完，不拆成五个问题或五项表单。用户只需回答一句话，也可以不填。技能会创建项目、提交分镜并逐个镜头审查。未经用户明确选择，禁止开始完整渲染；选择本地后禁止云端全量渲染，并提供准确的本地执行命令。

## 目录结构

| 路径 | 说明 |
|---|---|
| `.claude-plugin/marketplace.json` | 插件市场清单 |
| `skills/painted-animation/` | 动画技能：引擎、指南与示例 |
| `skills/painted-animation/template/src/styles/` | 七种风格，每种一个文件 |

## 新增风格

一种风格就是 `skills/painted-animation/template/src/styles/` 下的一个文件，决定 `paint()`、`inkLine()` 和 `glow()` 如何绘制，再把风格名加入 `studio.html` 的 `STYLES` 列表即可。2D 风格基于 `kit2d.js` 实现。每一帧仍须是时间的纯函数。详见 `template/ANIMATION_GUIDE.md` 的 "Styles" 一节。

## 致谢

本仓库 fork 自 tuzhechen2005 的 [opus-video-skills](https://github.com/tuzhechen2005/opus-video-skills)（经由 [Joker-chichi/claude-mv-skill](https://github.com/Joker-chichi/claude-mv-skill)），在此基础上增加了可插拔的风格层和六种新风格。

painted-animation 的动画引擎与指南改编自 John Heibel 的 [ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase)（MIT 协议），整体方法参照其 [PDoomVideo](https://github.com/JohnHeibel/PDoomVideo)。本项目使用了 p5.js、p5.brush、Puppeteer 与 ffmpeg。技能及示例由 Claude Opus 5.5 在 Claude Code 中完成。

## 许可协议

MIT，见 [LICENSE](LICENSE)。
