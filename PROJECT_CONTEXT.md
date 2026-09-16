# TEAM BOARD — PROJECT CONTEXT

## 1. Objetivo del proyecto

Team Board es una aplicación web para un equipo que permite:

* iniciar y cerrar sesión;
* consultar un dashboard;
* utilizar un tablero compartido de notas;
* administrar usuarios cuando el usuario autenticado tiene rol de administrador.

El proyecto debe poder ejecutarse y demostrarse completamente en local mediante Docker Compose.

El enunciado permite utilizar herramientas de inteligencia artificial libremente.

---

## 2. Reglas de negocio

### Autenticación

Existen dos roles:

* `admin`
* `user`

Los usuarios autenticados pueden acceder al área autenticada.

Los usuarios inactivos:

* no pueden iniciar sesión;
* no pueden continuar utilizando el área autenticada;
* aunque tengan un JWT emitido anteriormente, el backend debe volver a comprobar su estado activo.

Siempre debe existir al menos un administrador activo.

### Administración de usuarios

Solo un administrador puede administrar usuarios.

Un administrador puede:

* listar usuarios;
* crear usuarios;
* editar usuarios;
* asignar rol;
* activar usuarios;
* desactivar usuarios.

No se puede desactivar al último administrador activo.

No se puede quitar el rol de administrador al último administrador activo.

### Tablero

Existe un único tablero compartido.

NO existe aislamiento de notas por usuario.

Todos los usuarios activos pueden:

* consultar notas;
* crear notas;
* editar notas;
* mover notas;
* eliminar notas.

No implementar `user_id` en `notes` salvo que una nueva decisión explícita lo requiera.

### Notas

Cada nota contiene:

* `id`
* `title`
* `content`
* `status`
* `position_x`
* `position_y`
* `created_at`
* `updated_at`

Estados permitidos:

* `pending`
* `in_progress`
* `done`

En la interfaz los estados se mostrarán como:

* Pendiente
* En curso
* Hecho

El usuario debe poder editar directamente:

* título;
* contenido;
* estado.

Los cambios de contenido/estado se confirman mediante una acción `Guardar`.

La posición se modifica mediante drag & drop y se persiste automáticamente cuando termina el movimiento.

---

## 3. Backend actual

Stack:

* Node.js
* TypeScript
* Express
* PostgreSQL
* Docker
* Docker Compose
* JWT
* bcrypt

Puerto local de API:

`http://localhost:3000`

### Endpoints de autenticación

POST `/login`

GET `/me`

### Endpoints de notas

GET `/notes`

POST `/notes`

PATCH `/notes/:id`

PATCH `/notes/:id/position`

DELETE `/notes/:id`

### Endpoints de usuarios

GET `/users`

POST `/users`

PATCH `/users/:id`

PATCH `/users/:id/status`

### Endpoints auxiliares

GET `/health`

GET `/db-test`

---

## 4. Contratos importantes de la API

### Login

POST `/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

La respuesta proporciona un JWT.

Todas las rutas protegidas utilizan:

```http
Authorization: Bearer <token>
```

### Listar notas

GET `/notes`

Respuesta:

```json
{
  "notes": []
}
```

### Crear nota

POST `/notes`

Ejemplo:

```json
{
  "title": "Mi nota",
  "content": "Contenido",
  "status": "pending",
  "position_x": 100,
  "position_y": 100
}
```

### Editar nota

PATCH `/notes/:id`

Request:

```json
{
  "title": "Título actualizado",
  "content": "Contenido actualizado",
  "status": "in_progress"
}
```

### Mover nota

PATCH `/notes/:id/position`

Request:

```json
{
  "position_x": 500,
  "position_y": 350
}
```

### Eliminar nota

DELETE `/notes/:id`

Respuesta satisfactoria: HTTP 204.

---

## 5. Arquitectura frontend

El frontend será React + TypeScript.

La aplicación tendrá como mínimo:

```text
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── types/
│   ├── utils/
│   └── App.*
├── Dockerfile
└── package.json
```

La estructura exacta puede modificarse si existe una razón técnica clara, pero se debe mantener separación entre:

* presentación;
* lógica;
* acceso a API;
* autenticación;
* tipos.

---

## 6. Pantallas

### Login

Debe permitir:

* email;
* contraseña;
* iniciar sesión;
* mostrar errores;
* cerrar sesión posteriormente.

### Dashboard

Debe mostrar:

* total de notas;
* número de notas `pending`;
* número de notas `in_progress`;
* número de notas `done`.

Las métricas deben obtenerse mediante la funcionalidad backend correspondiente y finalmente deben utilizar AWS Lambda.

### Board

Debe mostrar un lienzo libre sin columnas.

Cada nota debe aparecer como tarjeta/post-it.

La nota debe permitir:

* edición del título;
* edición del contenido;
* selección del estado;
* guardar;
* eliminar;
* arrastrar y soltar.

Al terminar el drag debe persistirse automáticamente la nueva posición.

La recarga de la página debe recuperar las posiciones desde la API.

### Users

Solo debe ser accesible para administradores.

Debe permitir:

* listar usuarios;
* crear usuario;
* editar usuario;
* cambiar rol;
* activar/desactivar.

---

## 7. Autenticación frontend

El frontend debe:

1. iniciar sesión;
2. almacenar el token de forma coherente con la arquitectura elegida;
3. enviarlo en llamadas protegidas;
4. recuperar `/me`;
5. cerrar sesión;
6. impedir acceso a rutas protegidas si no existe autenticación;
7. reaccionar correctamente ante respuestas 401/403.

No duplicar lógica de autenticación en múltiples componentes.

Preferir un contexto/hook centralizado.

---

## 8. API client

El acceso a backend debe centralizarse.

No escribir llamadas `fetch` repetidas directamente por toda la interfaz.

Crear un servicio o cliente HTTP central.

Ese cliente será responsable de:

* base URL;
* headers;
* Authorization;
* parseo de respuestas;
* manejo de errores.

La URL del backend debe poder configurarse mediante variable de entorno.

Para desarrollo local:

`http://localhost:3000`

---

## 9. Board y drag & drop

El tablero es un lienzo libre.

No utilizar columnas tipo Kanban.

La posición se representa mediante:

```text
position_x
position_y
```

El movimiento debe funcionar así:

```text
drag
  ↓
actualización visual local
  ↓
drag end
  ↓
PATCH /notes/:id/position
```

NO hacer una petición por cada pixel de movimiento.

---

## 10. Persistencia

Debe mantenerse la información después de:

* recargar la página;
* reiniciar los contenedores Docker;
* detener y volver a levantar Docker Compose.

La base de datos utiliza almacenamiento persistente.

---

## 11. Dashboard y AWS Lambda

El dashboard necesita:

* total de notas;
* distribución por estado.

El cálculo y entrega de estas métricas debe utilizar al menos una AWS Lambda.

La implementación concreta puede decidirse durante la fase de infraestructura.

Lambda debe poder ejecutarse localmente mediante AWS SAM u otro mecanismo documentado.

La ejecución local no debe requerir una cuenta AWS ni un servicio AWS de pago.

---

## 12. Arquitectura AWS objetivo

El enunciado solicita:

### Frontend

S3 + CloudFront

### API

EC2 ejecutando el backend dentro de Docker

### Métricas

AWS Lambda

### Infraestructura

AWS SAM + CloudFormation

También deben existir:

* scripts para desplegar;
* scripts para eliminar recursos;
* documentación de parámetros;
* documentación de requisitos.

El despliegue real en AWS no es obligatorio.

La ejecución local completa sí es obligatoria.

---

## 13. Restricciones de alcance

NO implementar:

* múltiples tableros;
* columnas;
* asignación de notas;
* fechas de vencimiento;
* comentarios;
* adjuntos;
* notificaciones;
* historial;
* colaboración en tiempo real;
* aplicación móvil nativa.

No añadir funcionalidades innecesarias.

---

## 14. Reglas para la IA

La IA debe:

* respetar esta arquitectura;
* reutilizar la API existente;
* no inventar endpoints;
* no modificar reglas de negocio sin indicación explícita;
* no crear aislamiento por usuario en las notas;
* no añadir dependencias innecesarias;
* mantener TypeScript;
* mantener Docker;
* mantener Docker Compose;
* priorizar código sencillo y mantenible.

Antes de crear una abstracción nueva, comprobar si ya existe una equivalente.

No cambiar el backend existente salvo que sea necesario para cumplir un requisito identificado.

---

## 15. Criterios de aceptación frontend

El frontend se considera funcional cuando:

### Login

* un admin puede iniciar sesión;
* un usuario normal puede iniciar sesión;
* credenciales inválidas muestran error;
* cerrar sesión elimina el acceso autenticado.

### Dashboard

* muestra total;
* muestra distribución por estado;
* los números corresponden a las notas reales.

### Board

* carga notas;
* crea notas;
* edita notas;
* cambia estado;
* elimina notas;
* mueve notas;
* guarda automáticamente las posiciones;
* conserva información después de recargar.

### Usuarios

* solo admin puede acceder;
* lista usuarios;
* crea;
* edita;
* cambia rol;
* activa/desactiva.

### Seguridad

* áreas protegidas requieren autenticación;
* un usuario normal no puede acceder a administración;
* un usuario inactivo no puede continuar usando el área autenticada.

---

## 16. Estado actual

Backend funcional y probado.

Pruebas realizadas:

* health;
* conexión DB;
* login;
* `/me`;
* permisos admin;
* CRUD usuarios;
* protección del último admin;
* CRUD notas;
* estados;
* posiciones;
* persistencia;
* acceso sin token;
* acceso de usuario normal;
* desactivación de usuario;
* invalidación de acceso mediante usuario inactivo;
* reactivación;
* build TypeScript.

Siguiente fase:

1. preparar frontend;
2. dashboard;
3. board;
4. administración;
5. Lambda;
6. SAM / CloudFormation;
7. documentación;
8. pruebas finales;
9. video.
