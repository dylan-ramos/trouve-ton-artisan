#!/bin/sh
set -eu
mkdir -p frontend/audit-results
set -- docker compose --env-file .env
if [ -f .env.local ]; then set -- "$@" --env-file .env.local; fi
"$@" --project-name "${AUDIT_PROJECT_NAME:-trouve-ton-artisan-audit}" -f compose.yaml -f compose.audit.yaml \
    cp database:/usr/local/bin/gosu frontend/audit-results/gosu
# Analyze the exact installed binary; only that public binary is mounted into the scanner.
docker run --rm --user "$(id -u):$(id -g)" --cap-drop ALL --security-opt no-new-privileges \
    --tmpfs /tmp:exec --env GOPATH=/tmp/go --env GOCACHE=/tmp/gocache --env GOBIN=/tmp/bin \
    --mount "type=bind,source=$(pwd)/frontend/audit-results/gosu,target=/gosu,readonly" \
    golang:1.27-alpine sh -ec 'go install golang.org/x/vuln/cmd/govulncheck@v1.1.4; /tmp/bin/govulncheck -mode=binary /gosu' \
    > frontend/audit-results/gosu-vulncheck.txt
cat frontend/audit-results/gosu-vulncheck.txt
