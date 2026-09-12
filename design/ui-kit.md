---
role: design
owner: Mahima Hiteshkumar Shah
email: a1991246@adelaide.edu.au
date: 2026-09-12
---

# UI kit

Interactive kit: [`ui-kit.html`](ui-kit.html). Tokens: [`wireframes/css/tokens.css`](wireframes/css/tokens.css). Sampled from [adelaide.edu.au](https://www.adelaide.edu.au/) CSS on 12 Sep 2026.

| Token | Hex | Use on adelaide.edu.au | Use here |
|---|---|---|---|
| Dark Blue | `#140F50` | Body text, logo | Header, footer, headings |
| Bright Blue | `#1448FF` | Primary buttons | Primary buttons, links |
| Bright Blue hover | `#0C2B99` | Button hover | Button hover |
| North Terrace Purple | `#836BFF` | Hero geometry | Hero shard, recommend rail |
| Limestone | `#F9F2E6` | Warm panels | Demo banner, review notes |
| Paper | `#FAFAFB` | Page | Page |
| Danger | `#D32362` | Site error/accent | Delete only |

Type: Barlow Condensed (stand-in for National 2 Condensed) + Roboto Serif (live site body).

Layout CSS is split and flexbox-only for tool import: see [`wireframes/README.md`](wireframes/README.md).

M5: map these variables into Tailwind. Do not bring back the old navy/red kit (`#0C2340` / `#C8102E`).
