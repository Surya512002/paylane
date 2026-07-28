#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="$ROOT/.tools"
mkdir -p "$TOOLS"
cd "$TOOLS"
if [[ ! -f pg.jar ]]; then
  curl -fsSL "https://repo1.maven.org/maven2/io/zonky/test/postgres/embedded-postgres-binaries-linux-amd64/16.4.0/embedded-postgres-binaries-linux-amd64-16.4.0.jar" -o pg.jar
fi
python3 - <<'PY'
import zipfile, os, tarfile, lzma, io
os.makedirs('pg-extract', exist_ok=True)
with zipfile.ZipFile('pg.jar') as z:
    z.extractall('pg-extract')
txz = 'pg-extract/postgres-linux-x86_64.txz'
with lzma.open(txz) as xz:
    with tarfile.open(fileobj=xz) as tar:
        tar.extractall('pg')
print('Embedded Postgres extracted to .tools/pg')
PY
echo "Run: ./scripts/pg-start.sh"
