# K-HA$H

My cybersecurity blog: writeups, cheat sheets and certifications, themed after a chalk "most wanted" list on a concrete wall. Built with Jekyll and hosted on GitHub Pages.

## Run it locally

```bash
bundle install
python scripts/make_cards.py      # optional: share cards (pip install pillow pyyaml)
bundle exec jekyll serve
```

Then open http://localhost:4000. Pushing to `master` builds and deploys automatically (see `.github/workflows/jekyll.yml`).

## Add a writeup

Create `_posts/YYYY-MM-DD-name.md`:

```yaml
---
title: "HTB: Example"
categories: [HackTheBox]     # decides the district on the map: Reverse, HackTheBox, Web, Certifications
tags: [kerberoasting, adcs]  # shown as "infractions"
rank: 9                      # its line on the list (crossed out). Leave out to keep it off the list.
list_name: Example           # chalk text on the list: "Example . retired box"
list_note: retired box
heat: 4                      # difficulty, 1 to 5
map: [72, 34]                # optional: exact pin position (x, y in %), otherwise placed automatically
---
```

The post appears on the list, on the map, in its district page, in the Pursuit log and in the RSS feed, and gets its own share card.

**Only publish writeups for retired HackTheBox machines, and never exam content.**

## Writing tips

Callout, rendered as a paper note pinned to the wall:

```liquid
{% raw %}{% include callout.html title="note to self" text="Any **Markdown** here." %}{% endraw %}
```

Code block with a filename and a highlighted line (the `{: ...}` line goes right after the closing fence):

````markdown
```python
import requests
r = requests.get(url)
```
{: file="exploit.py" highlight="2" }
````

Terminal block. The prompt and output are styled differently and the Copy button only copies the commands:

````markdown
```console
kali@k-hash:~$ nmap -sCV 10.10.10.10
Starting Nmap 7.94 ...
```
````

## Switch parts of the site off

In `_config.yml`, set any feature to `false`:

```yaml
features:
  cheatsheets: false   # gone from the menu, the map and all links
  contact: true
  city_map: true
  pink_slips: true
  pursuit_log: true
```

The section disappears from the menu, the city map and every button that links to it. Its pages show a "closed for now" notice and are hidden from search engines, so nothing breaks while it's off. Set it back to `true` and push to bring it back.

To tie your own menu link to a switch, add `feature: <name>` to it under `nav`, then add that name to `features`.

## Everything else

| What | Where |
|------|-------|
| Name, tagline, photo, socials | `_config.yml` → `author` |
| Handwriting font | `_config.yml` → `hand_font` |
| Unbeaten lines on the list | `_data/targets.yml` |
| Certifications (pink slips) | `_data/certs.yml` |
| Districts and their pin slots | `_data/districts.yml` (add one for a new category) |
| Page markers on the map | `_data/map_pages.yml` |
| Rap sheet text and facts | `about.md` |
| Cheat sheets | `_cheatsheets/*.md` (front matter `title`, `stage`, `summary`, `updated`; commands in a Markdown table, in backticks) |
| CV | put the file at `assets/cv.pdf` (buttons appear once it exists) and set `cv.updated` in `_config.yml` |
| Contact form | create a free form at formspree.io and paste its id into `contact.formspree_id`. Without it the form opens the visitor's email app. |
| Navigation | `_config.yml` → `nav` |

## Share cards

`scripts/make_cards.py` draws a 1200×630 card for every post into `assets/cards/` (git-ignored; the workflow regenerates them on each deploy). Fonts live in `scripts/fonts/` under the SIL Open Font License. If you change `hand_font`, add that font's `.ttf` there too.

## Credits

Fonts: Covered By Your Grace and Barlow (SIL OFL). Fan-made theme, no affiliation with any game or publisher.
