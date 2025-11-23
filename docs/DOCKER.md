# Docker Deployment Guide

This guide covers deploying the Crypto Index Dashboard with Docker while preserving your existing database.

## Prerequisites

- Docker and Docker Compose installed
- CoinMarketCap Pro API key
- (Optional) Existing database with historical data

## Quick Start (Fresh Deployment)

If you're starting fresh without existing data:

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env and add your CMC_API_KEY

# 2. Build and start
docker-compose up -d

# 3. Wait for container to be healthy
docker-compose ps

# 4. Seed the database
docker-compose exec crypto-dashboard npx prisma db seed

# 5. Collect initial prices
curl -X POST http://localhost:3000/api/collect

# 6. Verify
curl http://localhost:3000/api/collect | jq '.totalSnapshots'
```

## Deploying with Existing Database (Preserving Your Data)

**This is the recommended approach if you have existing historical data.**

Your current database is at `prisma/dev.db` (~5MB with 364 days of history). Here's how to preserve it:

### Step 1: Create the Docker Volume

```bash
cd /path/to/crypto-index-dashboard

# Create the named volume
docker volume create crypto-index-dashboard_crypto-data
```

### Step 2: Copy Your Database to the Volume

```bash
# This copies your existing dev.db into the Docker volume
docker run --rm \
  -v crypto-index-dashboard_crypto-data:/data \
  -v $(pwd)/prisma:/src \
  alpine cp /src/dev.db /data/crypto-index.db
```

### Step 3: Verify the Copy

```bash
# Check that the database was copied correctly
docker run --rm \
  -v crypto-index-dashboard_crypto-data:/data \
  alpine ls -la /data/
```

You should see `crypto-index.db` with the same size as your original `dev.db`.

### Step 4: Build and Start

```bash
# Build the container
docker-compose build

# Start the service
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Step 5: Verify Data Preservation

```bash
# Check that all your snapshots are there
curl http://localhost:3000/api/collect | jq '.totalSnapshots'
# Should show ~2912 (8 indexes × 364 days)

# Verify index values
curl http://localhost:3000/api/dashboard | jq '.indexes[0]'
```

## Database Backup

### Backup from Container

```bash
# Backup to current directory
docker run --rm \
  -v crypto-index-dashboard_crypto-data:/data \
  -v $(pwd):/backup \
  alpine cp /data/crypto-index.db /backup/crypto-index-backup-$(date +%Y%m%d).db
```

### Restore from Backup

```bash
# Stop the container first
docker-compose down

# Restore from backup
docker run --rm \
  -v crypto-index-dashboard_crypto-data:/data \
  -v $(pwd):/backup \
  alpine cp /backup/crypto-index-backup-YYYYMMDD.db /data/crypto-index.db

# Start the container
docker-compose up -d
```

## Common Operations

### View Logs

```bash
docker-compose logs -f
```

### Restart Container

```bash
docker-compose restart
```

### Rebuild After Code Changes

```bash
docker-compose up -d --build
```

### Stop Container

```bash
docker-compose down
```

### Remove Everything (CAUTION!)

```bash
# This DELETES your database!
docker-compose down -v
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CMC_API_KEY` | Yes | - | CoinMarketCap Pro API key |
| `DATABASE_URL` | No | `file:/app/data/crypto-index.db` | SQLite database path |
| `COLLECT_API_KEY` | No | - | Protect the /api/collect endpoint |

## Port Configuration

The container exposes port 3000. To use a different port:

```yaml
# In docker-compose.yml
ports:
  - "8080:3000"  # Access via localhost:8080
```

## Scheduled Price Collection

### Option 1: Host Cron Job

```bash
# Add to crontab (crontab -e)
0 12 * * * curl -X POST http://localhost:3000/api/collect
```

### Option 2: Docker Healthcheck with Collection

You can modify the healthcheck to also trigger collection (not recommended for production).

### Option 3: External Scheduler (n8n, etc.)

Configure your scheduler to call `POST http://your-server:3000/api/collect` daily.

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Common issues:
# - Missing CMC_API_KEY in .env
# - Port 3000 already in use
```

### Database Not Found

```bash
# Verify volume exists and has data
docker volume inspect crypto-index-dashboard_crypto-data
docker run --rm -v crypto-index-dashboard_crypto-data:/data alpine ls -la /data/
```

### API Returns Empty Data

```bash
# Check if database was seeded
docker-compose exec crypto-dashboard npx prisma db seed

# Collect prices
curl -X POST http://localhost:3000/api/collect
```

### Permission Denied Errors

The container runs as user `nextjs` (UID 1001). If you have permission issues with the volume:

```bash
# Fix permissions on the volume
docker run --rm -v crypto-index-dashboard_crypto-data:/data alpine chown -R 1001:1001 /data
```

## Production Considerations

### Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name crypto.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL with Let's Encrypt

Use Certbot with nginx or a reverse proxy like Traefik or Caddy.

### Automatic Restarts

The `restart: unless-stopped` policy ensures the container restarts automatically after host reboots.

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Database | `prisma/dev.db` | Volume-mounted |
| Port | 3005 | 3000 (or behind proxy) |
| Hot Reload | Yes | No |
| Debug Logs | Verbose | Minimal |
