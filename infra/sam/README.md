# Metrics Lambda

Esta carpeta contiene la plantilla SAM de la unica Lambda de esta fase: `MetricsFunction`.

## Estructura

- `template.yaml`: define `MetricsFunction`, su evento HTTP `GET /metrics` y el build TypeScript con esbuild.
- `../../lambda/metrics/`: codigo TypeScript y dependencia `pg`.

## Variables de PostgreSQL

La funcion usa estas variables de entorno:

- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`

Los valores locales por defecto son `postgres`, `5432`, `team_board`, `team_board` y `team_board_dev`. La contrasena se declara como parametro `NoEcho` en la plantilla y no esta hardcodeada en el codigo de la Lambda.

## Build

Desde la raiz del repositorio:

```powershell
sam build --template-file infra/sam/template.yaml
```

## Ejecucion local

Primero debe estar disponible PostgreSQL mediante Docker Compose. La Lambda de SAM se ejecuta en un contenedor independiente: dentro de ese contenedor `localhost` no apunta al servicio PostgreSQL.

El servicio de Compose se llama `postgres`, por lo que SAM debe compartir la red Docker de Compose:

```powershell
docker network ls
sam local start-api --template-file infra/sam/template.yaml --docker-network team-board_default
```

El nombre `team-board_default` puede variar si Compose se ejecuto con otro nombre de proyecto. Usar el nombre que aparezca en `docker network ls` y que corresponda a la red donde esta conectado el contenedor `team-board-db`.

La URL local es:

```text
http://127.0.0.1:3000/metrics
```

La prueba puede hacerse con:

```powershell
Invoke-WebRequest http://127.0.0.1:3000/metrics
```

Si SAM no puede unirse a la red de Docker Compose o el nombre DNS `postgres` no resuelve, detener la prueba y corregir primero la configuracion de red. No sustituir `postgres` por `localhost` dentro de la Lambda.
