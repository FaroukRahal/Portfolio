# Portfolio

Personal portfolio site. Plain HTML/CSS/JS, no build step, ready for GitHub Pages (`faroukrahal.github.io`).

## Preview locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Files

| File | What it holds |
|---|---|
| `index.html` | Page structure |
| `content.js` | All text (EN + FR) and projects |
| `main.js` | Language toggle and rendering |
| `main.css` | Styles |
| `Assets/projects/` | Screenshots and demo videos |

## Adding a screenshot or demo video

Put the file in `Assets/projects/`, then set `media` on the project in `content.js`:

```js
media: { type: "image", src: "Assets/projects/steam-recommender.png", alt: { en: "Recommender demo", fr: "Démo du système de recommandation" } },
// or
media: { type: "video", src: "Assets/projects/steam-recommender.mp4", poster: "Assets/projects/steam-recommender.png" },
```

## Credits

Layout and styling adapted from [Simple Portfolio](https://github.com/AdemBendjama/Portfolio) by Adem Bendjama, licensed under GPL-3.0 (see `LICENSE`).
