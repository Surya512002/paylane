#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG="$ROOT/.tools/pg"
PGDATA="$ROOT/.tools/pgdata"
export LD_LIBRARY_PATH="$PG/lib:${LD_LIBRARY_PATH:-}"
export PATH="$PG/bin:$PATH"

if [[ ! -x "$PG/bin/pg_ctl" ]]; then
  echo "Embedded Postgres not found. Run scripts/pg-bootstrap.sh first, or use docker compose."
  exit 1
fi

if [[ ! -d "$PGDATA" ]]; then
  initdb -D "$PGDATA" -U workpay --auth=trust --encoding=UTF8
fi

if ! pg_ctl -D "$PGDATA" status >/dev/null 2>&1; then
  pg_ctl -D "$PGDATA" -l "$ROOT/.tools/pg.log" -o "-p 5432 -k /tmp" start
  sleep 1
fi

node -e "
const {Client}=require('pg');
(async()=>{
  const c=new Client({host:'127.0.0.1',port:5432,user:'workpay',database:'template1'});
  await c.connect();
  const r=await c.query(\"SELECT 1 FROM pg_database WHERE datname='workpay'\");
  if(!r.rowCount) await c.query('CREATE DATABASE workpay');
  await c.end();
  console.log('Postgres ready on 127.0.0.1:5432 (user workpay, db workpay)');
})().catch(e=>{console.error(e);process.exit(1);});
" 2>/dev/null || echo "Postgres started. Create DB 'workpay' if needed. DATABASE_URL=postgresql://workpay@127.0.0.1:5432/workpay"
