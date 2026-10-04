---
slug: homelab
title: Homelab con Docker Compose
authors: [rllop]
tags: [DevOps, Homelab, Docker, Caddy, Immich, Adguard, Jellyfin]
---

# Homelab

Este artículo trata sobre un homelab autoalojado que corre en un mini PC dedicado en una red doméstica, gestionado íntegramente con Docker Compose. La configuración proporciona gestión de fotos, streaming de medios, bloqueo de anuncios a nivel de red, proxy inverso con TLS automático y DNS dinámico — todo accesible desde cualquier lugar mediante un dominio público, o localmente mediante hostnames `.local`.

## Arquitectura de red

El router solo redirige los puertos **80** y **443** hacia el mini PC. Todo el tráfico público y local entra a través de **Caddy**, que termina TLS y enruta las peticiones al servicio correspondiente. Los servicios internos se comunican a través de una red bridge Docker compartida (`homelab`) y nunca son directamente accesibles desde el exterior.

```
Internet
    │
    │  :80 / :443
    ▼
 Router (reenvío de puertos)
    │
    ▼
 Mini PC
    ├── Caddy (proxy inverso, TLS)
    │     ├── immich.homelab.example.com  ──► Immich
    │     ├── immich.local  (solo LAN)   ──► Immich
    │     ├── jellyfin.local  (solo LAN) ──► Jellyfin
    │     └── adguard.local  (solo LAN)  ──► AdGuard Home
    │
    ├── Immich        (biblioteca de fotos)
    ├── Jellyfin      (servidor multimedia)
    ├── AdGuard Home  (DNS + bloqueo de anuncios)
    └── DDNS Updater  (mantiene el registro DNS apuntando a la IP del hogar)
```

Los servicios de solo uso local (cualquier hostname bajo `.local`) rechazan conexiones fuera de `192.168.0.0/24` a nivel de Caddy.

## Estructura del proyecto

```
.
├── 00_homelab-network.sh           # Crea la red Docker compartida (ejecutar una vez)
├── 01_docker-compose-up-all.sh     # Inicia todos los servicios
│
├── caddy-reverse-proxy/
│   ├── Caddyfile                   # Definiciones de rutas y reglas de acceso local
│   └── docker-compose.yml
│
├── immich/
│   ├── docker-compose.yml          # Immich server, ML, Redis, PostgreSQL
│   ├── example.env                 # Plantilla — copiar a .env y rellenar secretos
│   ├── backup-borg-setup.sh        # Inicialización única del repositorio Borg
│   └── backup-borg-script-v2.sh   # Backup incremental + purga (ejecutar con cron)
│
├── jellifyn/
│   └── docker-compose.yml          # Jellyfin con passthrough de GPU AMD
│
├── adguardhome/
│   └── docker-compose.yml          # AdGuard Home en red host
│
└── namecheap-ddns-updater/
    ├── Dockerfile                  # Imagen mínima Alpine + bash + curl
    ├── entrypoint.sh               # Bucle de polling que llama a la API DDNS de Namecheap
    ├── docker-compose.yml
    └── example.env                 # Plantilla — copiar a .env y rellenar secretos
```

## Servicios

### Caddy — proxy inverso y TLS

[Caddy](https://caddyserver.com) es el único punto de entrada para todo el tráfico. Obtiene y renueva automáticamente certificados TLS mediante Let's Encrypt para dominios públicos, y emite su propio certificado de CA local para hostnames `.local`. El `Caddyfile` define un snippet reutilizable `local_only` que cancela cualquier conexión que no provenga de la subred doméstica, aplicado a cada bloque `.local`.

### Immich — biblioteca de fotos

[Immich](https://immich.app) es una alternativa autoalojada a Google Fotos con backup automático desde el móvil, reconocimiento facial, detección de objetos y una interfaz de álbumes/línea de tiempo. La stack consta de cuatro contenedores:

| Contenedor | Función |
|---|---|
| `immich-server` | API principal e interfaz web |
| `immich-machine-learning` | Inferencia de reconocimiento facial y de objetos |
| `redis` (Valkey) | Cola de trabajos y caché |
| `database` (PostgreSQL + pgvecto-rs) | Almacenamiento persistente con búsqueda vectorial para álbumes inteligentes |

La configuración se realiza mediante un archivo `.env` (ver `example.env`). Las variables más importantes son `UPLOAD_LOCATION` (donde se almacenan las fotos en disco) y `DB_DATA_LOCATION` (directorio de datos de PostgreSQL).

#### Backup

Las fotos y la base de datos de Immich se respaldan con [Borg](https://borgbackup.readthedocs.io):

1. **Configuración inicial** — inicializar el repositorio Borg:
   ```bash
   ./immich/backup-borg-setup.sh
   ```
2. **Backup incremental** — volcar la base de datos y archivar la biblioteca:
   ```bash
   ./immich/backup-borg-script-v2.sh
   ```
   Programar con cron. Las miniaturas y el vídeo transcodificado están excluidos (se pueden regenerar). Los archivos se purgan para conservar las últimas 4 semanas y 3 instantáneas mensuales.

Para instrucciones de restauración, ver la [guía de backup de Immich](https://immich.app/docs/guides/template-backup-script/#restoring).

### Jellyfin — servidor multimedia

[Jellyfin](https://jellyfin.org) es un sistema multimedia autoalojado para películas, series y música. El contenedor está configurado con passthrough de GPU AMD (`/dev/dri`) y el driver `radeonsi` VAAPI para transcodificación de vídeo acelerada por hardware. Los archivos de medios se leen desde `/mnt/disk1/r-gmk/jellyfinmedia` del host.

### AdGuard Home — DNS y bloqueo de anuncios

[AdGuard Home](https://github.com/AdguardTeam/AdGuardHome) actúa como resolvedor DNS de la red. Todos los dispositivos de la LAN apuntan al mini PC como servidor DNS. AdGuard Home bloquea dominios de anuncios y rastreadores antes de que lleguen al navegador, y también resuelve los hostnames `.local` a la IP LAN del mini PC para que las rutas locales de Caddy funcionen en cualquier dispositivo sin entradas manuales en `/etc/hosts`.

Se ejecuta con `network_mode: host` para poder escuchar en el puerto 53 de la interfaz LAN. La interfaz web está en el puerto 81, accesible mediante `adguard.local` a través de Caddy.

### Actualizador DDNS de Namecheap

Un servicio personalizado ligero (Alpine + bash + curl) que mantiene un registro DNS de Namecheap actualizado cuando cambia la IP del hogar. Cada 10 minutos obtiene la IP pública actual desde `checkip.amazonaws.com` y llama a la API DDNS de Namecheap para cada hostname configurado.

Configurar mediante `.env` (ver `example.env`):

| Variable | Descripción |
|---|---|
| `DDNS_PASSWORD` | Contraseña DDNS de Namecheap (encontrada en la página de gestión DNS del dominio) |
| `DOMAIN_NAME` | Dominio raíz, p. ej. `example.com` |
| `HOSTNAME_ENTRIES` | Subdominios separados por comas a actualizar, p. ej. `@,immich,vpn` |

## Primeros pasos

### Requisitos previos

- Docker y Docker Compose instalados en el host
- Borg instalado en el host (para los backups de Immich)
- Un dominio de Namecheap con DDNS habilitado
- Reenvío de puertos del router: **80** y **443** → mini PC

### Configuración inicial

```bash
# 1. Crear la red Docker compartida
./00_homelab-network.sh

# 2. Configurar Immich
cp immich/example.env immich/.env
# Editar immich/.env: establecer DB_PASSWORD, UPLOAD_LOCATION, DB_DATA_LOCATION

# 3. Configurar el actualizador DDNS
cp namecheap-ddns-updater/example.env namecheap-ddns-updater/.env
# Editar namecheap-ddns-updater/.env: establecer DDNS_PASSWORD, DOMAIN_NAME, HOSTNAME_ENTRIES

# 4. Inicializar el repositorio de backup Borg
./immich/backup-borg-setup.sh

# 5. Iniciar todos los servicios
./01_docker-compose-up-all.sh
```

### Iniciar / detener servicios individuales

```bash
cd <service-dir>
docker compose up -d       # iniciar
docker compose down        # detener
docker compose logs -f     # seguir logs
```
