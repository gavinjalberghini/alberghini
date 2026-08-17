# Container image for self-hosting the resume site on the Pantry homelab
# cluster (see the Pantry repo: docs/how-to/expose-a-website.md). Published
# to GHCR by .github/workflows/container.yml and pulled by the Raspberry Pi
# workers, so it must be built for linux/arm64.
#
# The Cloudflare Tunnel forwards paths unchanged (<domain>/me/x arrives
# as /me/x), so the site is built with that baseurl AND nested under the
# same directory in the nginx web root.

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

# Path prefix the site is served under. Baked into all generated links.
ARG BASEURL=/me
RUN JEKYLL_ENV=production bundle exec jekyll build --baseurl "$BASEURL" --trace

# ---- Runtime stage: unprivileged nginx -----------------------------------
# Runs as uid 101 and listens on 8080 — satisfies the cluster's restricted
# policy set (non-root, no privilege escalation, read-only rootfs).
FROM nginxinc/nginx-unprivileged:1.27-alpine

LABEL org.opencontainers.image.source="https://github.com/gavinjalberghini/alberghini" \
      org.opencontainers.image.description="Gavin Alberghini resume site (served under /me)"

ARG BASEURL=/me
# Nest the output under the prefix: /me/index.html must exist at that
# literal path because the tunnel does not strip it.
COPY --from=build /site/_site /usr/share/nginx/html${BASEURL}
