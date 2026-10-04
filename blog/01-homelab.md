---
slug: homelab
title: Docker compose Homelab
authors: [rllop]
tags: [DevOps, Homelab, Docker, Caddy, Immich, Adguard, Jellyfin]
---

# Homelab

This article is about a self-hosted homelab running on a dedicated mini PC in a home network, managed entirely with Docker Compose. The setup provides photo management, media streaming, network-level ad blocking, automatic TLS reverse proxying, and dynamic DNS — all accessible from anywhere via a public domain or locally via `.local` hostnames.

## Network architecture

A router forwards only ports **80** and **443** to the mini PC. All public and local traffic enters through **Caddy**, which terminates TLS and routes requests to the appropriate service. Internal services communicate over a shared Docker bridge network (`homelab`) and are never directly reachable from outside.

```
Internet
    │
    │  :80 / :443
    ▼
 Router (port forward)
    │
    ▼
 Mini PC
    ├── Caddy (reverse proxy, TLS)
    │     ├── immich.homelab.example.com  ──► Immich
    │     ├── immich.local  (LAN only)   ──► Immich
    │     ├── jellyfin.local  (LAN only) ──► Jellyfin
    │     └── adguard.local  (LAN only)  ──► AdGuard Home
    │
    ├── Immich        (photo library)
    ├── Jellyfin      (media server)
    ├── AdGuard Home  (DNS + ad blocking)
    └── DDNS Updater  (keeps DNS record pointing to home IP)
```

Local-only services (anything under a `.local` hostname) reject connections from outside `192.168.0.0/24` at the Caddy level.

## Project structure

```
.
├── 00_homelab-network.sh           # Creates the shared Docker network (run once)
├── 01_docker-compose-up-all.sh     # Starts all services
│
├── caddy-reverse-proxy/
│   ├── Caddyfile                   # Route definitions and local-only access rules
│   └── docker-compose.yml
│
├── immich/
│   ├── docker-compose.yml          # Immich server, ML, Redis, PostgreSQL
│   ├── example.env                 # Template — copy to .env and fill in secrets
│   ├── backup-borg-setup.sh        # One-time Borg repository initialisation
│   └── backup-borg-script-v2.sh   # Incremental backup + prune (run via cron)
│
├── jellifyn/
│   └── docker-compose.yml          # Jellyfin with AMD GPU passthrough
│
├── adguardhome/
│   └── docker-compose.yml          # AdGuard Home on host network
│
└── namecheap-ddns-updater/
    ├── Dockerfile                  # Minimal Alpine + bash + curl image
    ├── entrypoint.sh               # Polling loop that calls Namecheap DDNS API
    ├── docker-compose.yml
    └── example.env                 # Template — copy to .env and fill in secrets
```

## Services

### Caddy — reverse proxy & TLS

[Caddy](https://caddyserver.com) is the single entry point for all traffic. It automatically obtains and renews TLS certificates via Let's Encrypt for public domains, and issues its own local CA certificate for `.local` hostnames. The `Caddyfile` defines a reusable `local_only` snippet that aborts any connection not originating from the home LAN subnet, applied to every `.local` site block.

### Immich — photo library

[Immich](https://immich.app) is a self-hosted Google Photos alternative with automatic mobile backup, facial recognition, object detection, and an albums/timeline UI. The stack consists of four containers:

| Container | Role |
|---|---|
| `immich-server` | Main API and web UI |
| `immich-machine-learning` | Face and object recognition inference |
| `redis` (Valkey) | Job queue and caching |
| `database` (PostgreSQL + pgvecto-rs) | Persistent storage with vector search for smart albums |

Configuration is done via a `.env` file (see `example.env`). The most important variables are `UPLOAD_LOCATION` (where photos are stored on disk) and `DB_DATA_LOCATION` (PostgreSQL data directory).

#### Backup

Immich photos and database are backed up with [Borg](https://borgbackup.readthedocs.io):

1. **One-time setup** — initialise the Borg repository:
   ```bash
   ./immich/backup-borg-setup.sh
   ```
2. **Incremental backup** — dump the database and archive the library:
   ```bash
   ./immich/backup-borg-script-v2.sh
   ```
   Schedule this with cron. Thumbnails and transcoded video are excluded (they are regenerable). Archives are pruned to keep the last 4 weekly and 3 monthly snapshots.

For restore instructions see the [Immich backup guide](https://immich.app/docs/guides/template-backup-script/#restoring).

### Jellyfin — media server

[Jellyfin](https://jellyfin.org) is a self-hosted media system for movies, TV shows, and music. The container is configured with AMD GPU passthrough (`/dev/dri`) and the `radeonsi` VAAPI driver for hardware-accelerated video transcoding. Media files are read from `/mnt/disk1/r-gmk/jellyfinmedia` on the host.

### AdGuard Home — DNS & ad blocking

[AdGuard Home](https://github.com/AdguardTeam/AdGuardHome) acts as the network's DNS resolver. All LAN devices point to the mini PC as their DNS server. AdGuard Home blocks ad and tracker domains before they ever reach the browser, and also resolves the `.local` hostnames to the mini PC's LAN IP so that local Caddy routes work on any device without manual `/etc/hosts` entries.

It runs with `network_mode: host` so it can bind to port 53 on the LAN interface. The web UI is on port 81, accessible via `adguard.local` through Caddy.

### Namecheap DDNS updater

A lightweight custom service (Alpine + bash + curl) that keeps a Namecheap DNS record updated when the home IP changes. Every 10 minutes it fetches the current public IP from `checkip.amazonaws.com` and calls the Namecheap DDNS API for each configured hostname.

Configure via `.env` (see `example.env`):

| Variable | Description |
|---|---|
| `DDNS_PASSWORD` | Namecheap DDNS password (found in the domain's DNS management page) |
| `DOMAIN_NAME` | Root domain, e.g. `example.com` |
| `HOSTNAME_ENTRIES` | Comma-separated subdomains to update, e.g. `@,immich,vpn` |

## Getting started

### Prerequisites

- Docker and Docker Compose installed on the host
- Borg installed on the host (for Immich backups)
- A Namecheap domain with DDNS enabled
- Router port forwarding: **80** and **443** → mini PC

### First-time setup

```bash
# 1. Create the shared Docker network
./00_homelab-network.sh

# 2. Configure Immich
cp immich/example.env immich/.env
# Edit immich/.env: set DB_PASSWORD, UPLOAD_LOCATION, DB_DATA_LOCATION

# 3. Configure DDNS updater
cp namecheap-ddns-updater/example.env namecheap-ddns-updater/.env
# Edit namecheap-ddns-updater/.env: set DDNS_PASSWORD, DOMAIN_NAME, HOSTNAME_ENTRIES

# 4. Initialise Borg backup repository
./immich/backup-borg-setup.sh

# 5. Start all services
./01_docker-compose-up-all.sh
```

### Starting / stopping individual services

```bash
cd <service-dir>
docker compose up -d       # start
docker compose down        # stop
docker compose logs -f     # follow logs
```
