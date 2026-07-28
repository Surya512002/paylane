# Cron service

Preferred entry in MVP: `apps/web` scripts / API:

```bash
cd apps/web
npm run cron:auto-release
# or
curl -X POST http://localhost:3000/api/cron/auto-release -H "x-cron-secret: $CRON_SECRET"
```

Jobs:
- Auto-release after review window
- Deadline expire refunds (extend similarly)
- Dispute evidence deadline warnings
- Gateway/DB reconciliation alerts (admin)
