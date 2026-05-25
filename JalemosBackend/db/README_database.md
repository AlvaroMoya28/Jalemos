# Jalemos — Base de Datos

Guía para la configuración de la Base de Datos PostgreSQL para Jalemos.  

---

## Tabla de contenidos

- [Tecnologías](#tecnologías)
- [Requisitos previos](#requisitos-previos)
- [Configuración con pgAdmin 4 (interfaz gráfica)](#configuración-con-pgadmin-4-interfaz-gráfica)
- [Configurar conexión del backend](#configurar-conexión-del-backend)

---

## Tecnologías

| Componente | Tecnología |
|---|---|
| Motor de base de datos | PostgreSQL 16 |
| Interfaz gráfica | pgAdmin 4 |

---

## Requisitos previos

- [PostgreSQL 16](https://www.postgresql.org/download/) instalado y corriendo en el puerto `5432`
- pgAdmin 4 (incluido en el instalador de PostgreSQL para Windows)
- El archivo `jalemos_schema.sql` disponible en esta carpeta

---

## Configuración con pgAdmin 4 (interfaz gráfica)

### Paso 1 — Conectar el servidor local

1. Abrí pgAdmin 4
2. En el panel izquierdo, clic derecho sobre **Servers**
3. Clic en **Register → Server...**
4. En la pestaña **General**, escribí un nombre: `Local`
5. En la pestaña **Connection**, completá con estos valores:

| Campo | Valor |
|---|---|
| Host name/address | `localhost` |
| Port | `5432` |
| Maintenance database | `postgres` |
| Username | `postgres` |
| Password | la que elegiste al instalar PostgreSQL |

6. Marcá **Save password** y clic en **Save**

> Si el servidor aparece en el panel izquierdo con una flecha para expandir, la conexión funcionó correctamente.

---

### Paso 2 — Crear la base de datos

1. En el panel izquierdo, expandí **Servers → Local → Databases**
2. Clic derecho sobre **Databases**
3. Clic en **Create → Database...**
4. Completá el campo **Database** con: `jalemos`
5. Dejá **Owner** como `postgres`
6. Clic en **Save**

---

### Paso 3 — Ejecutar el script SQL

1. Clic izquierdo sobre la base de datos **jalemos** para seleccionarla (se pone en negrita)
2. En la barra superior: **Tools → Query Tool**
3. En el Query Tool, clic en el ícono de carpeta **Open File**
4. Buscá y abrí el archivo `jalemos_schema.sql`
5. Presioná **F5** o el botón ▶ **Execute** para ejecutarlo

Si todo salió bien, el panel inferior muestra:

```
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
...
CREATE TRIGGER
Query returned successfully
```

---

### Paso 4 — Verificar las tablas

En el panel izquierdo, expandí:

```
Servers → Local → Databases → jalemos
  → Schemas → public → Tables
```

> Si las tablas no aparecen, clic derecho sobre **Tables** y elegí **Refresh**.

Deberías ver las 8 tablas:

- `bookings`
- `favorite_places`
- `notifications`
- `payment_methods`
- `ratings`
- `trips`
- `users`
- `vehicles`

Para confirmar que los datos de prueba quedaron, abrí el **Query Tool** y ejecutá la consulta que aparece al final del script:

```sql
SELECT name, email FROM users;
```

Deberías ver 3 usuarios de prueba en los resultados.

---

## Configurar conexión del backend

Editá el archivo `appsettings.json` del proyecto backend (ruta: `JalemosBackend/JalemosBackend/appsettings.json`) y añade o actualizá la sección `ConnectionStrings` con la connection string hacia tu servidor local. Ejemplo mínimo:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=jalemos;Username=postgres;Password=TU_PASSWORD"
  }
}
```

Notas:
- Reemplazá `TU_PASSWORD` por la contraseña del usuario `postgres` (o por la del usuario que creaste, p. ej. `jalemos_user`).

---

## Probar la API (verificar conexión desde el backend)

1. Compilar y ejecutar el backend desde la carpeta que contiene `JalemosBackend.csproj`:

```bash
cd JalemosBackend/JalemosBackend
dotnet restore
dotnet build
dotnet run
```

2. Abrir el endpoint (en terminal o en Postman) de salud para comprobar la conexión a la base de datos (ajusta puerto según Kestrel):

```bash
curl -k https://localhost:56345/health
```

Respuesta esperada: `{"database":true,"users":3}`

3. Probar endpoint de usuarios (en terminal o en Postman):

```bash
curl -k https://localhost:56345/api/users
```

Si la respuesta devuelve una lista de usuarios, la integración backend↔DB está funcionando.

---

### Decisiones de diseño relevantes

**UUIDs como identificadores** — todos los IDs son `UUID` generados automáticamente con `gen_random_uuid()`. Esto evita IDs predecibles y facilita la integración con el backend.

**Tipos ENUM** — campos como `state` en `trips` y `bookings`, y `type` en `notifications` usan tipos `ENUM`. PostgreSQL rechaza automáticamente cualquier valor fuera de los definidos.

**Triggers automáticos** — la base de datos mantiene tres invariantes sin necesitar lógica en el backend:
- `updated_at` se actualiza solo al modificar `users` o `bookings`
- `available_seats` en `trips` sube o baja al confirmar o cancelar una `booking`
- `mean_rating` en `users` se recalcula al insertar una nueva `rating`

---