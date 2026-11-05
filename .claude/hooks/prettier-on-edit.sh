#!/usr/bin/env bash

set -euo pipefail

# Retrieve Claude Code hook input
INPUT=$(cat)

# Extract the edited file path
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip if no file path
[[ -z "$FILE" ]] && exit 0

# Skip if file does not exist
[[ ! -f "$FILE" ]] && exit 0

# Run local Prettier
npx prettier --write --ignore-unknown "$FILE"