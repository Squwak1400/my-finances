# sketchy

A Claude Code skill for hand-drawn ("sketchy") redesigns and infographics on websites and apps. It's all built in code (HTML, CSS and SVG), so numbers stay live, things light up on hover, and nothing is sent to an image service.

> **Credit:** the 80+ prompt templates in `references/` come from **[gpt-image-2](https://github.com/ConardLi/garden-skills/tree/main/skills/gpt-image-2)** by **ConardLi**, part of **[garden-skills](https://github.com/ConardLi/garden-skills)**, under the MIT licence. The template style and structure are theirs. sketchy adds the part that turns those templates into working web design instead of AI images. See `ATTRIBUTION.md` for the details and the licence text, which must stay with the skill if you pass it on.

## Use it

Put the `sketchy` folder in a project's `.claude/skills/`, or in `~/.claude/skills/` to use it everywhere. Then ask Claude things like:

- "Use sketchy to make an infographic from the Debt plan page."
- "Use sketchy to redesign the Settings page."
- "Use sketchy to make a cover like the garden-skills covers for this app."

Each time, the skill:
1. picks the closest template for the request,
2. asks about colours (the site's own palette or a template palette),
3. saves the filled-in template as a brief in `sketchy-briefs/`,
4. builds it in code, then checks it in light and dark mode and at phone width.

## What's inside

| Path | What it is | From |
|---|---|---|
| `references/<category>/*.md`, `references/prompt-writing.md` | the prompt templates | gpt-image-2 by ConardLi (MIT), unchanged |
| `references/INDEX.md` | English index of the templates, with "In code" notes | sketchy |
| `SKILL.md` | the instructions Claude follows | sketchy |
| `code/translate.md` | template wording mapped to CSS and SVG | sketchy |
| `code/techniques.md` | code snippets, pitfalls and checks | sketchy |
| `examples/my-finances/` | the briefs behind the redesign this skill came from | sketchy |
| `ATTRIBUTION.md` | sources and the MIT licence text for the templates | — |
