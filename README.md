# [robboyett.github.io](http://robboyett.github.io)

Personal site and experiment sandbox for [robboyett.github.io](https://robboyett.github.io).

Static HTML/CSS/JS — no build step.

## Local development

From the repo root, start a simple HTTP server:

```bash
python3 -m http.server 8123
```

Then open [http://localhost:8123](http://localhost:8123) in your browser.

Stop the server with `Ctrl+C`.

### Alternatives

Any static file server works. Examples:

```bash
# Node (if you have npx)
npx serve -l 8123

# PHP
php -S localhost:8123
```

## Project layout


| Path                          | What                       |
| ----------------------------- | -------------------------- |
| `index.html`                  | Homepage                   |
| `journal/`                    | Writing / essays           |
| `experiments/`                | Prototypes and experiments |
| `crime-wave/`, `bingo/`, etc. | Standalone projects        |


