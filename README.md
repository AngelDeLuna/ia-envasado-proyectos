# IA Envasado Proyectos

Portal web para consultar proyectos, organizarlos por etapa/creador y mantener el seguimiento semanal en MySQL.

## Flujo actual

- `index.html`: tablero de proyectos y botón **Registrar proyecto**.
- `nuevo-proyecto.html`: crea una plantilla completa con creador, etapa, avance, requerimientos, semanas y actividades.
- `proyecto.html`: muestra la plantilla y permite marcar cada actividad como realizada/no realizada, capturar el motivo y guardar el cambio en MySQL.
- `server.js`: API Express.
- `db/schema.sql`: tablas `projects`, `weeks`, `activities`.

## Arranque local

Con `.env` configurado y MySQL iniciado:

```powershell
npm.cmd start
```

Después abre `http://localhost:3000`.

Si es una instalación desde cero:

```powershell
npm.cmd install
npm.cmd run db:init
npm.cmd run db:seed
npm.cmd start
```

Si ya usabas la versión anterior y tu base ya existe, consulta `MIGRACION_V2.md` antes de ejecutar scripts de base de datos.
