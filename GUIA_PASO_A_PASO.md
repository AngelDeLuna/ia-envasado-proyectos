# Guía paso a paso: pasar IA Envasado Proyectos de HTML local a MySQL + Internet

## 1. Qué cambió y por qué

Antes tu página era solamente HTML/CSS/JavaScript y leía `proyectos.xlsx`. Eso funciona para una computadora local, pero no es una buena base para que varias personas escriban datos al mismo tiempo.

Ahora la arquitectura es:

```text
Navegador de tu colega
        ↓ HTTPS
Página HTML + JavaScript
        ↓ /api/...
Node.js + Express
        ↓ conexión privada/segura
MySQL
```

La regla importante es: **el navegador nunca debe tener la contraseña de MySQL**. Solamente el servidor (`server.js`) conoce las credenciales.

---

# PARTE A — Probar todo en tu computadora

## 2. Instalar Node.js

Instala una versión LTS moderna de Node.js (20 o superior).

Después abre PowerShell o CMD y revisa:

```bash
node -v
npm -v
```

Debes ver dos números de versión.

## 3. Instalar MySQL

En Windows la opción más sencilla para empezar es MySQL Community Server + MySQL Workbench.

Durante la instalación:

1. Deja MySQL en el puerto `3306` si no tienes otro servicio ocupándolo.
2. Define una contraseña para el usuario `root` y guárdala.
3. Instala MySQL Workbench; te servirá para ver las tablas gráficamente.

No necesitas crear las tablas a mano: el proyecto trae un script que lo hace.

## 4. Configurar el archivo `.env`

En la carpeta del proyecto copia:

```text
.env.example
```

y renómbralo:

```text
.env
```

Ejemplo local:

```env
PORT=3000
MYSQLHOST=127.0.0.1
MYSQLPORT=3306
MYSQLUSER=root
MYSQLPASSWORD=TU_PASSWORD_REAL
MYSQLDATABASE=ia_envasado
MYSQL_SSL=false
FORM_SECRET=una-clave-que-solo-sepa-el-equipo
```

Nunca subas `.env` a GitHub. Ya está incluido en `.gitignore`.

## 5. Instalar las dependencias

Abre una terminal dentro de la carpeta donde está `package.json` y ejecuta:

```bash
npm install
```

## 6. Crear la base de datos y las tablas

Ejecuta:

```bash
npm run db:init
```

Este comando crea, si hace falta:

- la base `ia_envasado`;
- tabla `projects`;
- tabla `weeks`;
- tabla `activities`.

## 7. Cargar los datos iniciales

Preparé `db/seed.sql` con los dos proyectos que venían en tu Excel original y sus actividades semanales.

Ejecuta una sola vez:

```bash
npm run db:seed
```

Si luego quieres vaciar los datos de ejemplo, puedes hacerlo desde MySQL Workbench.

## 8. Encender la página

Ejecuta:

```bash
npm start
```

Abre:

```text
http://localhost:3000
```

Ya no uses `py -m http.server`. Ahora necesitas Node.js porque la página tiene backend y conexión a MySQL.

## 9. Qué debes probar

En `index.html`:

- Deben aparecer los proyectos.
- `Ordenar por progreso` debe alternar la agrupación.
- `Ordenar por creador` debe pasar por: sin orden → A-Z → Z-A.
- `Recargar` vuelve a consultar MySQL.

En un proyecto:

- Selecciona una semana.
- Cada actividad debe mostrar checkbox.
- Si está realizada, el checkbox aparece marcado.
- Si no está realizada, aparece el recuadro `Motivo / explicación`.

En `Registrar actividad`:

1. Escoge proyecto.
2. Escoge semana.
3. Escribe actividad.
4. Escribe quién la registró.
5. Marca o desmarca `La actividad sí se realizó`.
6. Si no se realizó, el motivo es obligatorio.
7. Escribe la clave configurada en `FORM_SECRET`.
8. Guarda.
9. Regresa al proyecto y verifica que apareció.

---

# PARTE B — Entender MySQL sin complicarte

## 10. Cómo están organizados los datos

### `projects`
Una fila por proyecto:

- nombre;
- creador;
- avance 0-100;
- etapa;
- requerimientos;
- URL de imagen (para una fase posterior).

### `weeks`
Cada proyecto tiene varias semanas. Por ejemplo:

```text
Proyecto 1
 ├─ Semana 1
 ├─ Semana 2
 └─ Semana 3
```

### `activities`
Cada semana contiene varias actividades:

```text
Semana 2
 ├─ Mejorar interfaz   [realizada]
 ├─ Crear menú         [no realizada] -> motivo
 └─ Probar Quest       [realizada]
```

Esto reemplaza la idea anterior de agregar una nueva columna al Excel cada semana.

## 11. Ver los datos desde MySQL Workbench

Abre Workbench y entra a tu conexión local.

A la izquierda busca:

```text
Schemas
  ia_envasado
    Tables
      projects
      weeks
      activities
```

También puedes ejecutar:

```sql
USE ia_envasado;
SELECT * FROM projects;
SELECT * FROM weeks;
SELECT * FROM activities;
```

---

# PARTE C — Subir el código a GitHub

## 12. Crear un repositorio

Crea un repositorio privado en GitHub, por ejemplo:

```text
ia-envasado-proyectos
```

En la terminal del proyecto:

```bash
git init
git add .
git commit -m "Migrar portal a Node.js y MySQL"
git branch -M main
git remote add origin TU_URL_DE_GITHUB
git push -u origin main
```

Comprueba en GitHub que **NO exista `.env`**.

Sí deben existir:

- `.env.example`;
- `server.js`;
- `package.json`;
- `db/schema.sql`;
- frontend.

---

# PARTE D — Publicarlo en Railway (ruta recomendada para esta primera versión)

## 13. Crear el proyecto

1. Entra a Railway y crea un nuevo proyecto.
2. Conecta tu repositorio de GitHub.
3. Railway detectará `package.json` y ejecutará la aplicación Node.js.

Todavía faltará la base de datos.

## 14. Agregar MySQL

Dentro del mismo proyecto de Railway:

1. Pulsa `+ New`.
2. Selecciona `Database` / `MySQL`.
3. Espera a que se cree el servicio MySQL.

Railway genera datos como:

```text
MYSQLHOST
MYSQLPORT
MYSQLUSER
MYSQLPASSWORD
MYSQLDATABASE
MYSQL_URL
```

## 15. Conectar tu aplicación con el MySQL de Railway

En el servicio de tu aplicación abre `Variables`.

Crea una variable:

```text
MYSQL_URL
```

como referencia a:

```text
${{MySQL.MYSQL_URL}}
```

Si tu servicio de base de datos tiene otro nombre, usa ese nombre en vez de `MySQL`.

Agrega además:

```text
MYSQL_SSL=false
FORM_SECRET=TU_CLAVE_REAL_PARA_EL_EQUIPO
```

No pongas la clave directamente en el código ni en GitHub.

## 16. Crear las tablas en Railway

La primera vez necesitas ejecutar contra la base de Railway:

```bash
npm run db:init
npm run db:seed
```

Dos formas comunes:

### Forma 1 — Railway CLI

Con Railway CLI instalado y el proyecto enlazado:

```bash
railway link
railway run npm run db:init
railway run npm run db:seed
```

### Forma 2 — variables de Railway en tu terminal

Usa `railway run` para que Railway inyecte las variables del servicio al comando local.

`db:seed` solo es necesario la primera vez o cuando conscientemente quieras volver a cargar esos datos iniciales.

## 17. Darle una URL pública

En el servicio de la aplicación:

1. Abre `Settings`.
2. Busca `Networking`.
3. Pulsa `Generate Domain`.

Obtendrás una dirección similar a:

```text
https://algo.up.railway.app
```

Esa es la URL que puedes compartir con tus colegas.

---

# PARTE E — Flujo normal una vez publicado

## 18. Qué hará un colega

Un colega ya no toca Excel ni MySQL Workbench.

Solamente:

1. abre la URL;
2. pulsa `Registrar actividad`;
3. escoge proyecto y semana;
4. captura la actividad;
5. indica si se hizo;
6. si no se hizo, explica por qué;
7. escribe la clave del equipo;
8. guarda.

La actividad se almacena en MySQL y todos ven el mismo dato.

## 19. Qué haces tú como administrador

Al principio puedes administrar proyectos y semanas desde MySQL Workbench.

Después conviene agregar dentro de la misma web:

- formulario `Nuevo proyecto`;
- formulario `Nueva semana`;
- edición de avance y etapa;
- edición/eliminación de actividades;
- login individual por usuario.

---

# PARTE F — Imágenes (siguiente fase)

## 20. Qué NO hacer

No guardes archivos grandes de imagen directamente dentro de MySQL si no lo necesitas.

Tampoco conviene guardar imágenes dentro de la carpeta del servidor esperando que siempre persistan: muchos hosts reconstruyen el sistema de archivos al desplegar.

## 21. Qué conviene hacer

Una opción típica es:

```text
Usuario sube imagen
      ↓
Cloudinary / S3 / almacenamiento de objetos
      ↓ devuelve URL
MySQL guarda solo la URL
      ↓
La página usa <img src="URL">
```

La columna `projects.image_url` ya está preparada para ese enfoque.

Cuando quieras implementar esta parte, se puede agregar un formulario de proyecto con subida de imagen sin cambiar las tablas principales.

---

# PARTE G — Seguridad mínima

## 22. La clave del equipo es temporal

`FORM_SECRET` sirve para una primera versión y evita que cualquier visitante pueda mandar un POST sin conocer la clave.

Pero todos los compañeros usan la misma clave. Para una aplicación empresarial más seria conviene posteriormente:

- cuentas individuales;
- contraseñas hasheadas;
- roles (`admin`, `editor`, `lector`);
- registro de quién modificó qué;
- cerrar formularios a usuarios no autenticados.

## 23. Nunca hagas esto

Nunca pongas en `js/*.js`:

```text
MYSQLPASSWORD=...
MYSQL_URL=...
```

El JavaScript del navegador es visible para cualquier usuario. Las credenciales viven únicamente en variables de entorno del servidor.

---

# PARTE H — Problemas comunes

## `ECONNREFUSED 127.0.0.1:3306`

MySQL no está encendido o el puerto es incorrecto.

## `Access denied for user`

Usuario/contraseña de `.env` incorrectos.

## `Unknown database ia_envasado`

Ejecuta:

```bash
npm run db:init
```

## La página abre pero dice que no conecta con MySQL

Prueba:

```text
http://localhost:3000/api/health
```

Si todo está correcto devuelve:

```json
{"ok":true}
```

## En Railway abre la web pero no aparecen proyectos

Comprueba:

1. `MYSQL_URL` está referenciada al servicio MySQL;
2. ejecutaste `db:init`;
3. ejecutaste `db:seed` si quieres los datos iniciales;
4. revisa los logs del servicio Node.

## El formulario responde `Clave de equipo incorrecta`

La clave introducida debe ser exactamente la misma que `FORM_SECRET` del servidor.

---

# 24. Orden recomendado para ti

No intentes hacer todo a la vez. Hazlo exactamente así:

1. Ejecutar localmente Node + MySQL.
2. Confirmar `/api/health`.
3. Ver los dos proyectos actuales.
4. Registrar una actividad de prueba.
5. Confirmar en Workbench que apareció.
6. Subir a GitHub.
7. Crear app + MySQL en Railway.
8. Configurar `MYSQL_URL` y `FORM_SECRET`.
9. Inicializar tablas.
10. Crear URL pública.
11. Probar desde otro dispositivo.
12. Después agregar administración de proyectos/semanas.
13. Después agregar imágenes.
14. Finalmente agregar login por usuario si el portal se vuelve de uso habitual.
