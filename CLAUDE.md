# Dor Games — Project Instructions

Hebrew educational game platform for Dor (דור), a 3-year-old. React 19 + Vite + Tailwind CSS + Framer Motion. 21 lazy-loaded games with Hebrew audio, RTL support, and Dor's personal photos as rewards.

## Git / GitHub

- Remote: `git@github.com:oz-saffar/dor-games.git` (branch: `main`)
- SSH key: `~/.ssh/github` (ed25519)
- Local repo config already sets `core.sshCommand = ssh -i ~/.ssh/github -o StrictHostKeyChecking=no`
- Push: `git push origin main`

## Production Server

- **Host:** `167.235.90.88` | **Port:** `22` | **User:** `dor_game1`
- **SSH key:** `~/.ssh/dor_games_deploy` (ed25519, already authorized on server)
- **Website root:** `/var/www/74ac68ad-ffcb-4ff8-a109-6be506b93664/public_html/`

Connect:
```bash
ssh -o StrictHostKeyChecking=no -i ~/.ssh/dor_games_deploy -p 22 dor_game1@167.235.90.88
```

## Deployment Rules (always follow)

1. **Verify server identity first** — run `pwd && ls` and show output before any changes
2. **Wait for explicit confirmation** before uploading anything
3. **Never delete files** unless user confirms
4. **Never touch `assets/dor_photos/`** — always exclude from rsync (photos live only on server)
5. **Only work inside `public_html/`**

## Standard Deploy Steps

1. `npm run build`
2. Copy `dist/` to `/tmp/deploy-staging/`
3. Show user what will be uploaded
4. Wait for "yes, proceed"
5. rsync excluding `dor_photos`:
```bash
rsync -avz -e "ssh -o StrictHostKeyChecking=no -i ~/.ssh/dor_games_deploy -p 22" \
  --exclude='assets/dor_photos' \
  /tmp/deploy-staging/ \
  dor_game1@167.235.90.88:public_html/
```
6. Verify with `find public_html -maxdepth 3 | sort`
