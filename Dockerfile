# Container image for self-hosting the resume site on the Pantry homelab
# cluster (see the Pantry repo: docs/how-to/expose-a-website.md). Published
# to GHCR by .github/workflows/container.yml and pulled by the Raspberry Pi
# workers, so it must be built for linux/arm64.
#
# This site is the landing page at the apex of alberghini.io — requests
# arrive as /... (no path prefix). Other apps (/frc-ss, /archive, ...) are
# claimed by more-specific tunnel rules and never reach this container.

# ---- Build stage: compile the Jekyll site --------------------------------
FROM ruby:3.3-alpine AS build

# build-base compiles the few gems without prebuilt musl binaries
# (eventmachine, http_parser.rb, ...).
RUN apk add --no-cache build-base

WORKDIR /site

# html-proofer (test group) is CI tooling, not needed to build the site.
ENV BUNDLE_WITHOUT=test \
    BUNDLE_FROZEN=true

COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .

ARG BASEURL=
RUN JEKYLL_ENV=production bundle exec jekyll build --baseurl "$BASEURL" --trace

# ---- Runtime stage: unprivileged nginx -----------------------------------
# Runs as uid 101 and listens on 8080 — satisfies the cluster's restricted
# policy set (non-root, no privilege escalation, read-only rootfs).
FROM nginxinc/nginx-unprivileged:1.27-alpine

LABEL org.opencontainers.image.source="https://github.com/gavinjalberghini/alberghini" \
      org.opencontainers.image.description="Gavin Alberghini resume site (landing page at /)"

COPY --from=build /site/_site /usr/share/nginx/html
