# Team Board

Team Board es un portal de equipo con autenticación, dashboard de actividad, administración de usuarios y un tablero compartido de notas.

La aplicación puede ejecutarse completamente en local mediante Docker Compose y AWS SAM Local, sin depender de una cuenta AWS para la ejecución principal.

creada por: jose alejandro catacoli

## Stack

| Capa            | Tecnología                     |
| --------------- | ------------------------------ |
| Frontend        | React + TypeScript + Vite      |
| Backend         | Node.js + TypeScript + Express |
| Base de datos   | PostgreSQL                     |
| Contenedores    | Docker + Docker Compose        |
| Métricas        | AWS Lambda + AWS SAM           |
| Infraestructura | AWS SAM + CloudFormation       |

## Ejecución local

La aplicación completa puede ejecutarse localmente sin una cuenta AWS ni servicios AWS de pago.

Desde la raíz del proyecto:

```powershell
.\scripts\start.ps1
```

En caso de que PowerShell bloquee la ejecución de scripts por la política de ejecución, puede ejecutarse puntualmente con:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1
```

El script:

* levanta PostgreSQL, backend y frontend mediante Docker Compose;
* instala las dependencias del backend dentro del contenedor;
* inicia el servidor backend;
* deja disponibles los servicios locales.

Servicios disponibles:

| Servicio   | URL / puerto          |
| ---------- | --------------------- |
| Frontend   | http://localhost:5173 |
| Backend    | http://localhost:3000 |
| PostgreSQL | localhost:5432        |

El frontend utiliza el proxy de Vite `/api`, que reenvía las peticiones al backend Docker mediante el servicio `backend:3000` durante el desarrollo local.

### Carga de usuarios demo

El script de inicio no ejecuta automáticamente la carga de usuarios demo.

Después de levantar los servicios, ejecutar:

```powershell
docker compose exec backend sh -c "npm install && npm run seed"
```

El comando utiliza el script `seed` definido en `backend/package.json` y ejecuta `backend/src/seed.ts`.

## Lambda de métricas en local

La función de métricas se ejecuta localmente mediante AWS SAM, cumpliendo el requisito de que el cálculo del dashboard utilice una AWS Lambda y pueda ejecutarse sin desplegarla en AWS.

Con Docker Compose ejecutándose, iniciar SAM con:

```powershell
.\scripts\start-lambda.ps1
```

En caso de que PowerShell bloquee la ejecución del script por la política de ejecución, puede ejecutarse puntualmente con:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-lambda.ps1
```

El script:

1. construye la Lambda mediante `sam build --use-container`;
2. inicia SAM Local;
3. conecta SAM a la red Docker de Compose para permitir el acceso a PostgreSQL.

Endpoint local:

```text
http://127.0.0.1:3001/metrics
```

La Lambda consulta la tabla `notes` mediante una consulta agregada y devuelve el total de notas y su distribución por estado.

El flujo local es:

```text
Frontend
   |
   v
Backend /metrics
   |
   v
SAM Local /metrics
   |
   v
PostgreSQL
```

El backend autentica la petición al endpoint `/metrics` y delega el cálculo a la Lambda local. El frontend consume las métricas mediante `/api/metrics`.

> Nota: después de iniciar SAM Local, la primera carga de las métricas del dashboard puede tardar unos segundos mientras la Lambda se inicia. Esto es esperado durante el primer acceso.

## Acceso a la aplicación

Después de iniciar Docker Compose y SAM Local, abrir en el navegador:

```text
http://localhost:5173
```

Para comprobar el funcionamiento de la aplicación se pueden utilizar las cuentas demo.

### Administrador

```text
Email: admin@team-board.local
Password: Admin123!
```

Puede acceder al dashboard, al tablero y a la administración de usuarios.

### Usuario

```text
Email: user@team-board.local
Password: User123!
```

Puede acceder al dashboard y al tablero, pero no a la administración de usuarios.

Un administrador puede crear usuarios desde la aplicación. Los usuarios creados posteriormente pueden iniciar sesión utilizando el correo electrónico y la contraseña asignados durante su creación.

## Funcionalidades

### Autenticación

* Inicio de sesión.
* Cierre de sesión.
* JWT para las rutas autenticadas.
* Validación del estado activo en cada acceso protegido.
* Roles `admin` y `user`.
* Los usuarios inactivos no pueden iniciar sesión ni continuar utilizando el área autenticada.

### Administración de usuarios

Los administradores pueden:

* listar usuarios;
* crear usuarios;
* editar nombre y correo;
* cambiar el rol entre `admin` y `user`;
* activar usuarios;
* desactivar usuarios.

El backend impide desactivar al último administrador activo o quitarle el rol de administrador cuando eso dejaría al sistema sin administradores activos.

La interfaz también contempla la confirmación necesaria para las acciones sensibles relacionadas con la propia cuenta administrativa.

### Tablero

Existe un único tablero compartido presentado como un lienzo libre, sin columnas Kanban.

Todos los usuarios activos pueden trabajar con todas las notas.

Cada nota permite:

* crear;
* editar el título;
* editar el contenido;
* cambiar el estado;
* guardar los cambios;
* eliminar;
* mover mediante drag & drop.

Los estados disponibles son:

* Pendiente;
* En curso;
* Hecho.

La posición de cada nota se guarda automáticamente al terminar el movimiento y se recupera al volver a cargar el tablero.

### Dashboard

El dashboard muestra:

* total de notas;
* notas pendientes;
* notas en curso;
* notas hechas.

El cálculo utiliza `MetricsFunction`, que consulta PostgreSQL y devuelve las métricas agregadas al backend.

## Persistencia

PostgreSQL local utiliza un volumen Docker persistente:

```text
PostgreSQL
    |
    v
volumen Docker
    |
    v
postgres_data
```

Los datos permanecen al reiniciar contenedores o detener y volver a levantar Docker Compose mientras no se elimine el volumen.

### Comprobación de persistencia

Para comprobar la persistencia de los datos desde cero:

1. Iniciar la aplicación con `.\scripts\start.ps1` o con el comando alternativo de PowerShell indicado anteriormente.
2. Iniciar SAM Local.
3. Abrir `http://localhost:5173`.
4. Iniciar sesión como administrador.
5. Crear un usuario nuevo o una nota de prueba y comprobar que aparece correctamente.
6. Detener los servicios **sin eliminar el volumen**:

```powershell
docker compose down
```

7. Volver a iniciar la aplicación:

```powershell
.\scripts\start.ps1
```

En caso de que PowerShell bloquee la ejecución:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1
```

8. Abrir nuevamente:

```text
http://localhost:5173
```

9. Iniciar sesión con:

```text
Email: admin@team-board.local
Password: Admin123!
```

10. Comprobar que el usuario o la nota creados anteriormente continúan presentes y que los datos del tablero se han conservado.

La persistencia depende del volumen `postgres_data`, por lo que `docker compose down` conserva los datos, mientras que `docker compose down -v` los elimina.

Para eliminar también los datos persistentes:

```powershell
docker compose down -v
```

## Arquitectura local

```text
                       Navegador
                           |
                           v
                    Frontend :5173
                           |
                        /api/*
                           |
                           v
                    Backend :3000
                     /          \
                    /            \
                   v              v
          PostgreSQL :5432   SAM Local :3001
                                  |
                                  v
                           PostgreSQL :5432
```

El navegador utiliza el frontend Vite.

El proxy `/api` dirige las peticiones al backend Express.

El backend gestiona:

* autenticación;
* usuarios;
* notas;
* autorización por rol;
* exposición del endpoint `/metrics`.

Para las métricas, el backend delega el cálculo a la Lambda ejecutada mediante SAM Local.

Tanto el backend como la Lambda local acceden a PostgreSQL mediante la red de Docker Compose.

## Arquitectura AWS objetivo

El despliegue completo en AWS es opcional según el enunciado de la prueba.

La arquitectura objetivo definida para el proyecto es:

```text
                         Navegador
                         /       \
                        /         \
                       v           v
                CloudFront       EC2
                    |          Backend Docker
                    v              |
                    S3             |
                Frontend           |
                                   v
                                  RDS
                                   ^
                                   |
                                Lambda
```

En esta arquitectura:

* S3 almacenaría el frontend;
* CloudFront distribuiría el frontend;
* EC2 ejecutaría el backend dentro de Docker;
* RDS alojaría PostgreSQL;
* Lambda calcularía las métricas;
* el backend utilizaría Lambda para el cálculo de métricas.

## Estado de la implementación AWS

Durante el desarrollo se crearon y utilizaron recursos reales de AWS para validar parcialmente la arquitectura.

El estado final de cada componente es:

| Recurso                 | Estado                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| EC2                     | Creado y utilizado durante el desarrollo; backend Docker construido y ejecutado correctamente.  |
| RDS PostgreSQL          | Creado y utilizado durante el desarrollo para validar conectividad y preparar la base de datos. |
| Lambda                  | Preparada parcialmente mediante AWS SAM; validada localmente con SAM Local.                     |
| S3                      | No finalizado.                                                                                  |
| CloudFront              | No finalizado.                                                                                  |
| Despliegue AWS completo | No finalizado.                                                                                  |
| URL AWS pública         | No disponible en la entrega.                                                                    |

La instancia EC2 utilizada durante el desarrollo permitió construir la imagen de producción del backend y ejecutar el servicio.

El endpoint de salud del backend fue validado correctamente mediante:

```text
GET /health
```

La base de datos RDS también fue creada y utilizada durante las pruebas de infraestructura.

La integración final completa entre todos los componentes AWS no se terminó dentro del tiempo disponible, por lo que la entrega se centra en la ejecución local reproducible.

## Infraestructura como código

La plantilla SAM se encuentra en:

```text
infra/sam/template.yaml
```

La Lambda de métricas se encuentra en:

```text
lambda/metrics/
```

La plantilla declara:

* `MetricsFunction`;
* el evento HTTP `GET /metrics`;
* un Security Group para la Lambda;
* la configuración VPC de la Lambda;
* la regla de ingreso necesaria para permitir la conexión hacia PostgreSQL/RDS;
* las variables de entorno de conexión a PostgreSQL.

La plantilla utiliza referencias y parámetros para recursos de AWS existentes, por lo que no constituye una definición completa de toda la infraestructura del proyecto.

No crea directamente:

* EC2;
* RDS;
* S3;
* CloudFront.

Para construir la Lambda localmente:

```powershell
sam build --use-container --template-file infra/sam/template.yaml
```

El proyecto incluye además:

```text
scripts/start-lambda.ps1
```

para simplificar la ejecución de SAM Local.

La infraestructura AWS queda, por tanto, **parcialmente preparada mediante SAM y CloudFormation**, pero la creación y retirada completa de todos los recursos AWS todavía no está automatizada.

## Estructura del proyecto

```text
team-board/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── metrics/
│   │   ├── notes/
│   │   └── users/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
├── database/
│   └── init.sql
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── infra/
│   └── sam/
│       ├── README.md
│       └── template.yaml
├── lambda/
│   └── metrics/
│       ├── src/
│       ├── Makefile
│       ├── package.json
│       └── tsconfig.json
├── scripts/
│   ├── start.ps1
│   └── start-lambda.ps1
├── .gitignore
├── docker-compose.yml
├── PROJECT_CONTEXT.md
└── README.md
```

## Validaciones realizadas

Durante el desarrollo se validaron manualmente:

* compilación TypeScript del backend;
* compilación del frontend con Vite dentro de Docker;
* ejecución mediante Docker Compose;
* autenticación y cierre de sesión;
* diferencias entre roles;
* administración de usuarios;
* protección del último administrador activo;
* creación, edición, cambio de estado y eliminación de notas;
* drag & drop y persistencia de posiciones;
* persistencia de PostgreSQL mediante volumen Docker;
* dashboard y métricas;
* ejecución local de Lambda mediante SAM;
* conexión de la Lambda local con PostgreSQL mediante la red Docker;
* construcción de la imagen de producción del backend;
* ejecución del backend en un entorno EC2 durante las pruebas de AWS;
* preparación y conectividad de una instancia RDS PostgreSQL durante las pruebas de AWS.

Estas comprobaciones fueron manuales. El repositorio no incluye una suite de pruebas automatizadas.

## Estado final y limitaciones

La entrega prioriza la parte local, que es el escenario obligatorio y reproducible de la prueba.

La aplicación completa puede ejecutarse mediante:

```text
Docker Compose
+
SAM Local
```

sin depender de recursos AWS.

La parte AWS quedó parcialmente preparada y fue utilizada durante el desarrollo, pero no se completó el despliegue integral solicitado como arquitectura objetivo.

Pendientes de la parte AWS:

* finalizar el despliegue completo del frontend en S3;
* configurar CloudFront;
* completar la exposición del frontend y backend en AWS;
* terminar la integración productiva entre backend, Lambda y RDS;
* automatizar la creación y eliminación completa de infraestructura;
* publicar una URL AWS funcional.

No se proporciona una URL AWS funcional de entrega.

## Tiempo empleado

Tiempo empleado: Se empleo el tiempo maximo permitido 8 horas

## Versión entregada

Repositorio:

```text
https://github.com/Alejo-aki/team-board
```



