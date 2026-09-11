#!/bin/sh
set -eu
# Validate final browser DOM, not the empty SPA shell.
validator=${VNU_BIN:-vnu}
output=frontend/audit-results/release
set --
for name in accueil catalogue fiche mentions 404 recherche vide donnees accessibilite cookies contact-invalide; do
    set -- "$@" "$output/$name.html"
done
"$validator" --format json "$@" 2> "$output/html-validation.json"
"$validator" --css --format json "$output"/styles-*.css 2> "$output/css-validation.json"
printf '%s\n' 'HTML final et CSS compilé : aucune erreur.'
