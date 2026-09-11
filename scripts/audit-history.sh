#!/bin/sh
set -eu
# Install the reviewed Gitleaks binary outside the repository.
audit_tools=/tmp/trouve-ton-artisan-audit-tools
mkdir -p "$audit_tools" frontend/audit-results/release
archive="$audit_tools/gitleaks_8.30.1_linux_x64.tar.gz"
if [ ! -x "$audit_tools/gitleaks" ]; then
    curl --fail --location --silent --show-error https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz -o "$archive"
    printf '%s  %s\n' 551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb "$archive" | sha256sum --check --status
    tar -xzf "$archive" -C "$audit_tools" gitleaks
fi
"$audit_tools/gitleaks" git --redact --log-opts=--all --report-format json --report-path frontend/audit-results/release/history-secrets.json
