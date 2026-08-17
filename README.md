# alberghini

Personal resume site for [Gavin Alberghini](https://github.com/gavinjalberghini).
A static Jekyll build, served at
**[alberghini.io/me](https://alberghini.io/me)** from the
[Pantry](https://github.com/gavinjalberghini/Pantry) homelab cluster.

Content lives in `_data/profile.yml` (bio, work, research, projects) and
`index.html` (layout). Edit the YAML to update the page.

## Project structure

```text
.
├── _data/profile.yml      # All written content
├── index.html             # Single-page layout
├── _layouts/              # default layout
├── _includes/             # head, header, footer
├── _sass/main.scss        # Site styles
├── assets/                # CSS entry, self-hosted fonts, favicon
├── .github/workflows/     # GHCR image publish
├── _config.yml            # Site settings
├── Taskfile.yml           # Local lint / build / test / docker tasks
├── Dockerfile             # Container image for Pantry (GHCR, arm64)
├── Gemfile                # Ruby deps (Jekyll + html-proofer)
└── package.json           # Node deps (markdownlint, stylelint, prettier)
```

## Local development

Day-to-day work is driven by [go-task](https://taskfile.dev). Run `task`
with no arguments to list everything.

### Prerequisites

- **Ruby 3.1+** — builds and serves the Jekyll site.
- **Node.js + npm** — linters/formatter.
- **go-task** — `brew install go-task` (or see [taskfile.dev](https://taskfile.dev/installation/)).

```bash
task install   # Node tools + Ruby gems into ./vendor/bundle
task serve     # http://localhost:4000/me/
```

| Command             | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `task serve`        | Serve locally with live reload                    |
| `task build`        | Build the site into `_site/`                      |
| `task lint`         | Lint Markdown, SCSS, and formatting               |
| `task format`       | Auto-fix formatting                               |
| `task test`         | Build, then validate HTML and internal links      |
| `task check`        | `lint` + `build` + `test`                         |
| `task docker:build` | Build the image for your local architecture       |
| `task docker:serve` | Run it at <http://localhost:8080/me/>             |
| `task docker:push`  | Manual arm64 build + push to GHCR                 |

## Self-hosting (Pantry homelab)

This repo's only job in that pipeline is to publish a container image;
everything cluster-side (manifests, tunnel routing) lives in Pantry — see
its `docs/how-to/expose-a-website.md` runbook.

How the image works (`Dockerfile`):

- A multi-stage build compiles the site with Ruby 3.3 and hands `_site/`
  to **unprivileged nginx** (uid 101, port 8080).
- The tunnel forwards paths **unchanged** — a request for
  `alberghini.io/me/x` reaches the container as `/me/x` — so the image
  bakes in `baseurl: /me` and nests the files under `/me` in the web root.
- Built for **`linux/arm64`** because the cluster's workers are Raspberry
  Pis.

Publishing is automatic: on every push to `main`,
`.github/workflows/container.yml` builds the image on a native arm64
runner and pushes `ghcr.io/gavinjalberghini/alberghini:latest` (plus a
commit-sha tag).

One-time setup after the first publish:

1. On GitHub, go to the package → **Package settings** → change
   **Visibility** to **Public**, so the cluster can pull it anonymously.
   New GHCR packages default to private.

Rolling out an update to the cluster (from the Pantry repo, after CI has
pushed the new image):

```bash
kubectl -n web rollout restart deploy/alberghini
```
