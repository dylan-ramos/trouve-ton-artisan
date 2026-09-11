#!/bin/sh
set -eu

# Pin the scanner and verify its archive against the publisher's checksums.
version=0.74.0
audit_tools=/tmp/trouve-ton-artisan-audit-tools
mkdir -p "$audit_tools" frontend/audit-results/images
archive="trivy_${version}_Linux-64bit.tar.gz"
release="https://github.com/aquasecurity/trivy/releases/download/v${version}"
if [ ! -x "$audit_tools/trivy" ]; then
    curl --fail --location --silent --show-error "$release/$archive" -o "$audit_tools/$archive"
    curl --fail --location --silent --show-error "$release/trivy_${version}_checksums.txt" -o "$audit_tools/checksums.txt"
    (cd "$audit_tools" && awk -v filename="$archive" '$2 == filename { print }' checksums.txt | sha256sum --check --status)
    tar -xzf "$audit_tools/$archive" -C "$audit_tools" trivy
fi
"$audit_tools/trivy" --version
for target in frontend backend database; do
    image="${AUDIT_PROJECT_NAME:-trouve-ton-artisan-audit}-$target:${APP_PROD_IMAGE_TAG:-production}"
    "$audit_tools/trivy" image --image-src docker --cache-dir "$audit_tools/cache" \
        --scanners vuln --no-progress --format json --output "frontend/audit-results/images/$target.json" "$image"
done
node --input-type=module <<'JS'
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const exception = JSON.parse(fs.readFileSync('docs/security/image-exceptions.json'));
const summary = [];
const databaseImage = `${process.env.AUDIT_PROJECT_NAME ?? 'trouve-ton-artisan-audit'}-database:${process.env.APP_PROD_IMAGE_TAG ?? 'production'}`;
const hash = execFileSync('docker', ['run', '--rm', '--network', 'none', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--user', '999', '--entrypoint', 'sha256sum', databaseImage, '/usr/local/bin/gosu'], { encoding: 'utf8' }).split(/\s/)[0];
for (const target of ['frontend', 'backend', 'database']) {
    const report = JSON.parse(fs.readFileSync(`frontend/audit-results/images/${target}.json`));
    const issues = (report.Results ?? []).flatMap((result) => result.Vulnerabilities ?? []);
    const counts = {};
    for (const issue of issues) counts[issue.Severity] = (counts[issue.Severity] ?? 0) + 1;
    console.log(`${target}: ${JSON.stringify(counts)}`);
    const severe = (report.Results ?? []).flatMap((result) =>
      (result.Vulnerabilities ?? []).filter((issue) => ['HIGH', 'CRITICAL'].includes(issue.Severity)).map((issue) => ({ target: result.Target, ...issue })),
    );
    const reviewed = severe.filter((issue) => target === 'database'
      && issue.target === exception.target && issue.PkgName === exception.package
      && issue.InstalledVersion === exception.installedVersion
      && exception.vulnerabilityIds.includes(issue.VulnerabilityID)
      && hash === exception.binarySha256 && new Date() < new Date(`${exception.expiresAt}T00:00:00Z`));
    const unreviewed = severe.filter((issue) => !reviewed.includes(issue));
    console.log(`${target}: ${reviewed.length} severe findings reviewed, ${unreviewed.length} unreviewed`);
    summary.push({ target, counts, reviewed: reviewed.map((issue) => issue.VulnerabilityID), unreviewed });
    if (unreviewed.length) process.exitCode = 1;
}
fs.writeFileSync('frontend/audit-results/images/summary.json', JSON.stringify({ date: new Date().toISOString(), summary }, null, 2));
JS
