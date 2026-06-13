# Estado del Proyecto — Sistema de Gestión Territorial

> Documento de seguimiento del equipo frontend. Se actualiza a medida que se completan casos de uso.
> Última actualización: 2026-06-12 — CU-03 (Ciudadanos) implementado por Adrián

---

## Resumen general

| Módulo | CU | Descripción | Estado | Responsable |
|---|---|---|---|---|
| Autenticación | CU-07 | Login OAuth (Google / GitHub) | ✅ Completado | Adrián |
| Autenticación | CU-08 | Logout | ✅ Completado | Adrián |
| Administración | CU-01 | Gestión de Entidades | ⬜ Pendiente | — |
| Administración | CU-02 | Gestión de Funcionarios | ⬜ Pendiente | — |
| Administración | CU-03 | Gestión de Ciudadanos | ✅ Completado | Adrián |
| Administración | CU-04 | Gestión de Categorías | ⬜ Pendiente | Adrián |
| Administración | CU-05 | Gestión de Comunas | ✅ Completado | Nico |
| Administración | CU-06 | Gestión de Barrios | ✅ Completado | Nico |
| Mapa | CU-09 | Demarcar polígono de barrio | ⬜ Pendiente | — |
| Mapa | CU-10 | Editar polígono | ⬜ Pendiente | — |
| Mapa | CU-11 | Tracking en tiempo real | ⬜ Pendiente | — |
| Anotaciones | CU-12 | Crear anotación | ⬜ Pendiente | — |
| Anotaciones | CU-13 | Calificar anotación | ⬜ Pendiente | — |
| Anotaciones | CU-14 | Visualizar por categoría | ⬜ Pendiente | — |
| Reportes | CU-15 | Reportes inteligentes (chat) | ⬜ Pendiente | — |

**Leyenda:** ✅ Completado · 🔄 En progreso · ⬜ Pendiente · ❌ Bloqueado

---

## Detalle por caso de uso

### ✅ CU-07 — Login OAuth
- Pantalla de login con botones Google y GitHub
- `SecurityService` conectado a Firebase Auth
- Roles almacenados en Firestore (primer login crea usuario con rol `ciudadano`)
- Guards `AuthenticatedGuard` y `NoAuthenticatedGuard` actualizados
- **Pendiente:** login con Facebook (requiere app aprobada en Meta Developer Console)
- **Pendiente:** login con correo y contraseña (requiere habilitar el proveedor Email/Password en Firebase Auth)

### ✅ CU-08 — Logout
- Botón "Logout" en el menú desplegable del header
- Llama a `SecurityService.logout()` y redirige a `/authentication/login`
- Foto de perfil real (Google/GitHub) con fallback a imagen por defecto
- Nombre del usuario visible en el header

---

### ✅ CU-05 — Gestión de Comunas _(Nico, 2026-06-12)_
- Modelo `Commune` con DTOs: `CommuneRequestDto`, `CommuneSearchRequestDto`, `CommunePaginatedResponseDto`
- `CommuneService` extiende `CrudService<Commune>`: métodos `createCommune`, `updateCommune`, `searchByFilter` (filtro por ciudad paginado)
- Página `CommunesComponent` con CRUD completo: tabla paginada, filtros por departamento/ciudad, modal de crear/editar, confirmación de eliminación con SweetAlert2
- Componentes reutilizables nuevos: `FilterBarComponent`, `GenericModalComponent`
- Ruta `/communes` registrada en `app.routes.ts` y entrada añadida al sidebar
- **Pendiente:** los selectores de departamento y ciudad usan mocks hardcodeados — deben reemplazarse con datos reales del backend cuando estén los servicios de ciudades/departamentos

### ✅ CU-06 — Gestión de Barrios _(Nico, 2026-06-12)_
- Modelo `Neighborhood` con DTOs análogos al de Comunas
- `NeighborhoodService` extiende `CrudService<Neighborhood>` con búsqueda filtrada por comuna
- Página `NeighborhoodComponent` con CRUD completo, misma estructura que Comunas
- Ruta `/neighborhoods` registrada y entrada añadida al sidebar
- **Pendiente:** mismo problema con mocks de filtros; relación con Comunas depende de que CU-05 tenga datos reales

### ✅ CU-03 — Gestión de Ciudadanos _(Adrián, 2026-06-12)_
- Modelo `Citizen` con DTOs: `CitizenRequestDto`, `CitizenSearchRequestDto`, `CitizenPaginatedResponseDto`, `CitizenResponseMessageDto`
- `CitizenService` extiende `CrudService<Citizen>`: métodos `createCitizen`, `updateCitizen`, `searchByFilter` (búsqueda por nombre vía `?q=`)
- Página `CitizenComponent` con CRUD completo: tabla paginada, búsqueda por texto, modal crear/editar, confirmación de eliminación con SweetAlert2
- Validaciones en todos los campos: `name` (letras/espacios, 3-100 chars), `email` (formato), `phone` (solo dígitos, 7-15 chars), `address` (máx 200 chars)
- Ruta `/citizens` registrada en `app.routes.ts` y entrada añadida al sidebar
- **Nota:** el parámetro de búsqueda del backend es `q` (no `search`) — confirmado con el equipo backend

---

### Infraestructura CRUD (base para CU-01 al CU-06)
- `CrudService<T>` abstracto en `src/app/services/crud.service.ts`
- `PagedResponse<T>` en `src/app/models/paged-response.ts`
- Endpoints backend confirmados: `entities`, `officials`, `citizens`, `categories`, `communes`, `neighborhoods`
- Repartición: Adrián → CU-03 y CU-04 · Compañeros → CU-01/02 y CU-05/06

---

## Infraestructura base

| Pieza | Estado | Notas |
|---|---|---|
| Firebase Auth (Google + GitHub) | ✅ | Microsoft bloqueado por restricciones de Azure en cuentas personales |
| Firestore (roles de usuario) | ✅ | Modo prueba |
| `SecurityService` con Firebase | ✅ | Reemplaza el mock anterior |
| `CrudService<T>` genérico | ✅ | `src/app/services/crud.service.ts` — base para CU-01 al CU-06 |
| `PagedResponse<T>` | ✅ | `src/app/models/paged-response.ts` |
| Endpoints backend confirmados | ✅ | entities, officials, citizens, categories, communes, neighborhoods |
| Modelos territoriales (`models/`) | 🔄 | `commune.ts`, `neighborhood.ts`, `citizen.ts` ✅ — categorías pendiente |
| Servicios por recurso | 🔄 | `CommuneService`, `NeighborhoodService`, `CitizenService` ✅ — resto pendiente |
| Sidebar actualizado con módulos | 🔄 | Comunas, Barrios y Ciudadanos ✅ — resto pendiente |
| Leaflet instalado (mapas) | ⬜ | Necesario para CU-09/10/11/12/14 |

---

## Notas del equipo

- El backend no tiene autenticación implementada — todos los endpoints son públicos. La auth es responsabilidad exclusiva del frontend (Firebase).
- Los roles se asignan manualmente desde la consola de Firebase Firestore (`users/{uid}.role`).
- Microsoft OAuth no disponible por restricciones de Azure en cuentas personales gratuitas.
