source "https://rubygems.org"

# Modern Jekyll 4.x. We deploy via GitHub Actions (.github/workflows/pages.yml)
# instead of GitHub Pages' built-in build, which is frozen on an EOL Jekyll 3.9
# that no longer runs on current Ruby.
gem "jekyll", "~> 4.4"

# Plugins used by this site.
group :jekyll_plugins do
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
end

# Standard-library gems that were dropped from Ruby's defaults (Ruby 3.4+ / 4.x)
# but are still required by Jekyll and its dependencies.
gem "base64"
gem "bigdecimal"
gem "csv"
gem "logger"
gem "webrick", "~> 1.8"

# Local-only tooling for testing the built site (not needed to build/deploy).
group :test do
  gem "html-proofer", "~> 5.0"
end

# Timezone data for Windows / JRuby builds.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
