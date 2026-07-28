# QA Checklist

**Version:** 1.0.0 · **Last updated:** 2026-07-28

## Freelance
- [ ] 1 Accept → worker paid
- [ ] 2 Silence → auto-release
- [ ] 3 Two revisions then accept
- [ ] 4 Third revision blocked
- [ ] 5 Dispute freezes auto-release
- [ ] 6 Admin refund/release/split
- [ ] 7 Missed deadline refund
- [ ] 8 Worker cancel refund
- [ ] 9 Cancel before hire refund
- [ ] 10 Unfunded job cannot start
- [ ] 11 Wrong wallet cannot act
- [ ] 12 Double-accept no double-pay
- [ ] 13 Dispute after auto-release rejected
- [ ] 14 Invalid upload blocked
- [ ] 15 Wrong network/token blocked

## API / Agent
- [ ] 16 Unpaid → 402
- [ ] 17 Valid payment returns resource once
- [ ] 18 Invalid/replay rejected
- [ ] 19 Seller 5xx → credit policy
- [ ] 20 Spend cap blocks overspend
- [ ] 21 Disabled endpoint rejects
- [ ] 22 Receipt per successful paid call

## Docs
- [ ] 23 All required docs in-app
- [ ] 24 Officials page integrations + diagrams

## Automated
- [x] Foundry money-path tests (20)
- [x] Web API payment verification happy path (vitest + live demo)
- [x] Seed demo runs
- [x] Mode A accept path (API demo)
- [x] Mode A auto-release crank (API demo)
- [x] Mode B agent buyer 402 → pay → replay rejected
