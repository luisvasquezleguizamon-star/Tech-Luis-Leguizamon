# Catálogo de cuentas contables

Prueba técnica full-stack: gestión del **catálogo de cuentas** (la lista jerárquica de cuentas con la que una empresa clasifica sus registros contables).

- **Backend:** NestJS 12 con Clean Architecture
- **Frontend:** React 19 + Vite + TanStack Query
- **Persistencia:** en memoria, con datos de ejemplo del PUC colombiano
- **Pruebas:** Vitest

Todo vive en un solo repositorio: `api/` (backend) y `web/` (frontend).

---

## Cómo correr el proyecto

Requisitos: Node.js 20 o superior y npm.

```bash
npm install     # instala la raíz, api/ y web/
npm run dev     # levanta la API y la web a la vez
```

- API: http://localhost:3000 (el árbol está en http://localhost:3000/accounts/tree)
- Web: la dirección que muestra Vite en la terminal (normalmente http://localhost:5173)

### Nota para Windows

En mi equipo, el `postinstall` de la raíz (`npm install --prefix api && npm install --prefix web`) entró en un bucle infinito. Lo resolví instalando cada parte por separado:

```bash
npm install --ignore-scripts
cd api && npm install && cd ..
cd web && npm install && cd ..
npm run dev
```

### Pruebas

```bash
cd api
npm test
```

Cubren el dominio (código, nivel, padre, naturaleza), el repositorio en memoria y los casos de uso (crear, consultar árbol, renombrar y eliminar, incluidos los casos de error).

---

## Reglas de negocio implementadas

| Regla | Dónde vive |
|---|---|
| La longitud del código define el nivel: 1 = Clase, 2 = Grupo, 4 = Cuenta, 6 = Subcuenta | `AccountCode` (dominio) |
| El padre es el código del nivel anterior por prefijo (`115566` → `1155` → `11` → `1`) | `AccountCode.parentCode()` |
| No se puede crear una cuenta si su padre no existe | `CreateAccountUseCase` |
| El código es numérico y único en todo el catálogo | `AccountCode` + `CreateAccountUseCase` |
| Cada clase tiene naturaleza (débito o crédito) y sus descendientes la heredan | `Account.create()` |
| Solo las cuentas sin hijas admiten movimientos | Se calcula al armar el árbol (`acceptsMovements`) |
| No se puede eliminar una cuenta que tiene hijas | `DeleteAccountUseCase` |

Decisiones sobre las reglas:
- Solo las **clases** reciben `nature` al crearse. En las demás se ignora y se hereda del padre, así no puede existir una cuenta con una naturaleza distinta a la de su clase.
- **"Admite movimientos" no se guarda, se calcula** como "no tiene hijas". Si se guardara, habría que mantenerlo sincronizado cada vez que se crea o elimina una hija.
- Solo se puede **renombrar**, no cambiar el código, porque el código define la posición en el árbol. Cambiarlo rompería la relación con las hijas.

---

## Backend: Clean Architecture

### Cómo lo entiendo

Las reglas del negocio van en el centro y no dependen de nada externo. Las capas de afuera dependen de las de adentro, nunca al revés:

```
infrastructure  →  application  →  domain
(NestJS, HTTP,     (casos de uso)   (entidades, reglas,
 persistencia)                       interfaz del repositorio)
```

Así, si mañana cambio NestJS por otro framework, o la memoria por PostgreSQL, el dominio y los casos de uso no se tocan.

### Estructura

```
api/src/accounts/
  domain/                         ← TypeScript puro, no importa NestJS
    account.ts                    entidad: crea, valida nombre, hereda naturaleza, renombra
    account-code.ts               objeto de valor: valida el código, calcula nivel y padre
    nature.ts                     DEBITO | CREDITO
    account.repository.ts         INTERFAZ del repositorio (la define el dominio)
    errors.ts                     errores de negocio, con el campo afectado
  application/                    ← casos de uso, sin decoradores de NestJS
    create-account.use-case.ts
    get-catalog-tree.use-case.ts
    rename-account.use-case.ts
    delete-account.use-case.ts
  infrastructure/
    persistence/
      in-memory-account.repository.ts   implementa la interfaz del dominio
      seed-accounts.ts                  datos de ejemplo
    http/
      accounts.controller.ts      recibe HTTP y llama a los casos de uso
      domain-error.filter.ts      traduce errores de dominio a códigos HTTP
      account.presenter.ts        convierte la entidad en JSON
  accounts.module.ts              raíz de composición: conecta todo
```

### Puntos clave

- **El dominio no conoce NestJS ni la base de datos.** Sus archivos solo importan otros archivos del dominio.
- **La interfaz del repositorio la define el dominio** (`AccountRepository`). La infraestructura la implementa. Esto es la inversión de dependencias: el dominio dice *qué* necesita y la infraestructura decide *cómo*.
- **Los casos de uso no tienen `@Injectable()`.** Reciben el repositorio por el constructor y en los tests se crean con `new`. NestJS los arma en `accounts.module.ts` con `useFactory`.
- **`accounts.module.ts` es el único lugar donde se elige la persistencia.** Para cambiar a una base de datos real basta con crear otra clase que implemente `AccountRepository` y cambiar una línea.
- **Los errores se traducen a HTTP en un solo lugar** (`DomainErrorFilter`). El dominio lanza errores de negocio y no sabe nada de códigos HTTP.

### Endpoints

| Método | Ruta | Descripción | Errores |
|---|---|---|---|
| `GET` | `/accounts/tree?search=&from=&to=` | Catálogo como árbol anidado. `search` filtra por código (prefijo) o nombre (sin importar tildes ni mayúsculas). `from`/`to` filtran por fecha de creación (`YYYY-MM-DD`). Con filtro, se incluyen los ancestros de cada coincidencia y se marcan con `matched: true`. | 400 si la fecha es inválida |
| `POST` | `/accounts` | Crea una cuenta. Body: `{ code, name, nature? }` (`nature` solo para clases). | 400 código o nombre inválido · 409 ya existe · 422 el padre no existe |
| `PATCH` | `/accounts/:code` | Renombra. Body: `{ name }` | 400 nombre inválido · 404 no existe |
| `DELETE` | `/accounts/:code` | Elimina una cuenta. | 404 no existe · 409 tiene hijas |

Formato de error, pensado para que el frontend ponga el mensaje junto al campo correcto:

```json
{ "statusCode": 409, "error": "ACCOUNT_ALREADY_EXISTS", "message": "Ya existe una cuenta con el código 1105", "field": "code" }
```

---

## Persistencia: en memoria

**Por qué la elegí:**
- No hay que instalar ni configurar nada para correr el proyecto.
- El foco de la prueba son las reglas de negocio y la arquitectura, no el motor de base de datos.
- Gracias a la interfaz `AccountRepository`, cambiarla después no afecta al dominio ni a los casos de uso. Es justo la ventaja que busca Clean Architecture.

**Desventaja:** los datos se pierden al reiniciar la API. Por eso se cargan datos de ejemplo (basados en el PUC colombiano) cada vez que arranca. Los datos de ejemplo se crean con `Account.create()`, así que pasan por las mismas validaciones del dominio.

---

## Frontend

### Organización por funcionalidad

```
web/src/
  api.ts                     dirección base de la API (venía en el proyecto)
  shared/
    http.ts                  cliente HTTP único: arma la petición y convierte errores en ApiError
  features/
    accounts/
      types.ts               tipos de datos
      accounts.api.ts        llamadas a la API
      useAccounts.ts         hooks de TanStack Query (consultas y mutaciones)
      accounts.css
      components/
        AccountTree.tsx      árbol, estado de ramas abiertas, expandir/colapsar todo
        AccountTreeNode.tsx  fila: código, nombre, nivel, naturaleza, eliminar
```

**Por qué así:** todo lo de cuentas vive junto en `features/accounts`. Si aparece otra funcionalidad (por ejemplo, movimientos), sería otra carpeta al lado. `shared` guarda lo que usan todas. Además, los componentes no hacen `fetch` directamente: usan hooks, los hooks usan `accounts.api.ts` y este usa `shared/http.ts`. Si cambia la API, se toca un solo lugar.

### Librerías

- **TanStack Query:** maneja el estado del servidor. Guarda el árbol en caché, da los estados de carga y error, y después de crear, renombrar o eliminar **invalida la consulta del árbol** para que se vuelva a pedir sola, sin recargar a mano.
- **Sin librería de componentes:** la interfaz es sencilla y con CSS propio basta. Así no se agregan dependencias que no hacen falta.

### Manejo de estados y errores

- Mientras carga el árbol se muestra "Cargando catálogo…".
- Si la API falla o está apagada, se muestra el mensaje con un botón **Reintentar**. Nunca queda una pantalla en blanco ni un error que solo sale en la consola.
- Al eliminar, se pide confirmación en la misma fila. Si la API lo rechaza (por ejemplo, porque la cuenta tiene hijas), el error aparece debajo de esa fila.

---

## Estado de la entrega

- [x] API: crear, consultar árbol (con filtros por texto y fecha), renombrar y eliminar
- [x] Pruebas del dominio, repositorio y casos de uso
- [x] Árbol con expandir y colapsar
- [x] Nivel y naturaleza de cada cuenta en el árbol
- [x] Eliminar desde el árbol con confirmación y error visible si tiene hijas
- [x] Estado del servidor con caché e invalidación (TanStack Query)
- [ ] Formulario de creación con validación y errores de la API junto al campo
- [ ] Búsqueda por código o nombre abriendo las ramas con coincidencias
- [ ] Crear hija desde el nodo padre con el código prellenado
- [ ] Renombrar desde el árbol

## Qué mejoraría con más tiempo

- Persistencia real (por ejemplo, SQLite o PostgreSQL) implementando `AccountRepository`, sin tocar el dominio.
- Pruebas end-to-end de la API con Supertest y pruebas de componentes en el frontend.
- Paginación o carga perezosa del árbol para catálogos muy grandes.
- Registrar movimientos contables, validando que solo se hagan en cuentas sin hijas.
