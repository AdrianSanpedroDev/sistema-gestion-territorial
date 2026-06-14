# Estado del Proyecto — Sistema de Gestión Territorial

> Documento de seguimiento del equipo frontend. Se actualiza a medida que se completan casos de uso.
> Última actualización: 2026-06-14 — CU-03 completado con MapPickerComponent + layout de página completa + fix CSS Leaflet

---

## Resumen general

| Módulo | CU | Descripción | Estado | Responsable |
|---|---|---|---|---|
| Administración | CU-01 | Gestión de Entidades | ✅ Completado | Danny / Adrián |
| Administración | CU-02 | Gestión de Funcionarios | ✅ Completado | Danny / Adrián |
| Administración | CU-03 | Gestión de Ciudadanos | ✅ Completado | Adrián |
| Administración | CU-04 | Gestión de Categorías | ✅ Completado | Adrián |
| Administración | CU-05 | Gestión de Comunas | ✅ Completado | Nico |
| Administración | CU-06 | Gestión de Barrios | ✅ Completado | Nico |
| Autenticación | CU-07 | Login OAuth (Google / GitHub) | ✅ Completado | Adrián |
| Autenticación | CU-08 | Logout | ✅ Completado | Adrián |
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

### ✅ CU-01 — Gestión de Entidades _(Danny, corregido por Adrián, 2026-06-13)_
- Modelo `Entity` con DTOs: `EntityRequestDto`, `EntitySearchRequestDto`, `EntityPaginatedResponseDto`, `EntityResponseMessageDto`
- `EntityService` extiende `CrudService<Entity>`: métodos `createEntity`/`updateEntity` vía `FormData` (multipart, el backend detecta `Content-Type`), `searchByFilter` (búsqueda vía `?q=`)
- Página `EntityComponent` con CRUD completo: tabla paginada, búsqueda, modal crear/editar (`GenericModal`), confirmación de eliminación con SweetAlert2
- Upload de logo desde PC en la misma petición POST/PUT (campo `file`); el backend guarda el archivo y rellena `logo_url`
- Validaciones por campo: `name` (3-100 chars), `nit` (dígitos/guiones), `email` (formato), `phone` (7-15 dígitos), `address` (máx 200)
- Ruta `/entities` registrada y entrada añadida al sidebar (icono `solar:buildings-line-duotone`)
- **Importante:** el modelo del backend NO tiene los campos `description` ni `type` (se eliminaron del frontend); `name` y `email` son UNIQUE — reusarlos devuelve 400. Los errores muestran el mensaje real del backend (`err.error.message`).

### ✅ CU-02 — Gestión de Funcionarios _(Danny, corregido por Adrián, 2026-06-13)_
- Modelo `Official` con DTOs: `OfficialRequestDto`, `OfficialSearchRequestDto`, `OfficialPaginatedResponseDto`, `OfficialResponseMessageDto`
- `OfficialService` extiende `CrudService<Official>`: métodos `createOfficial`/`updateOfficial` (usan `OfficialRequestDto`), `searchByFilter` (búsqueda vía `?q=`)
- Página `OfficialComponent` con CRUD completo: tabla paginada, búsqueda, modal crear/editar, confirmación con SweetAlert2
- Relación con Entidades: el select de entidad carga desde `EntityService.getAll()`; la tabla resuelve `entityName` mapeando `id_entity`
- Validaciones por campo: `name`, `email`, `phone` (7-15 dígitos), `role`, más selección de entidad obligatoria; checkbox `gps_active`
- Ruta `/officials` registrada y entrada añadida al sidebar (icono `solar:user-circle-line-duotone`)

### ✅ CU-03 — Gestión de Ciudadanos _(Adrián, 2026-06-14)_
- Modelo `Citizen` con DTOs: `CitizenRequestDto`, `CitizenSearchRequestDto`, `CitizenPaginatedResponseDto`, `CitizenResponseMessageDto`
- Campos `latitude?` / `longitude?` añadidos a `Citizen` y `CitizenRequestDto`
- `CitizenService` extiende `CrudService<Citizen>`: métodos `createCitizen`, `updateCitizen`, `searchByFilter` (búsqueda por nombre vía `?q=`)
- Lista (`CitizenComponent`): tabla paginada con columna "Fecha de registro", búsqueda por texto, confirmación de eliminación con SweetAlert2
- **Layout página completa** (no modal): rutas `/citizens/new` y `/citizens/:id/edit` → `CitizenFormComponent`; formulario a la izquierda, mapa a la derecha
- `CitizenFormComponent`: detecta modo crear/editar vía `ActivatedRoute`; carga datos del ciudadano al editar y pre-posiciona el mapa con `patchValue`
- `MapPickerComponent` reutilizable (`app-map-picker`, en `components/ui/`): Leaflet standalone, `@Input() initialLatitude/Longitude` para pin inicial, `@Input() polygon?` para polígono de fondo (CU-12), `@Output() locationSelected` emite `Coordinates`; `ngOnChanges` para actualizar el mapa cuando los datos llegan asíncronos
- `interface Coordinates` en `models/coordinates.ts`
- `PagedResponse<T>` corregido: campo `data` → `items` (contrato real del backend)
- CSS de Leaflet añadido a `angular.json` → fix de tiles desalineados (aplica también al mapa de Nico en CU-09)
- **Nota:** el parámetro de búsqueda del backend es `q` (no `search`) — confirmado con el equipo backend

### ✅ CU-04 — Gestión de Categorías _(Adrián, 2026-06-13)_
- Modelo `Category` con DTOs: `CategoryRequestDto`, `CategorySearchRequestDto`, `CategoryPaginatedResponseDto`, `CategoryResponseMessageDto`
- `CategoryService` extiende `CrudService<Category>`: métodos `createCategory`, `updateCategory`, `searchByFilter` (búsqueda vía `?q=`)
- Página `CategoryComponent` con CRUD completo: tabla paginada, búsqueda, modal crear/editar, confirmación con SweetAlert2
- Soporte de jerarquía: `id_parent_category` opcional — el select de padre carga desde `getAll()` y excluye la categoría actual al editar
- Tabla ordenada jerárquicamente: categoría padre → sus hijos → siguiente padre. Columna "Tipo" (Categoría / Subcategoría) y borde lateral azul para identificar padres visualmente
- Protección de eliminación: si una categoría tiene subcategorías asociadas se muestra alerta "Acción requerida" en vez del confirm normal
- Upload de imagen desde PC vía `FormData` (campo `file`) — mismo endpoint POST/PUT, backend detecta `multipart/form-data`
- `DynamicTableComponent` extendido con `rowClassFn` (input opcional) y soporte de columnas tipo `image` — sin impacto en otras tablas del proyecto
- Ruta `/categories` registrada en `app.routes.ts` y entrada añadida al sidebar

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
| Modelos territoriales (`models/`) | 🔄 | `entity.ts`, `official.ts`, `commune.ts`, `neighborhood.ts`, `citizen.ts`, `category.ts` ✅ — resto pendiente |
| Servicios por recurso | 🔄 | `EntityService`, `OfficialService`, `CommuneService`, `NeighborhoodService`, `CitizenService`, `CategoryService` ✅ — resto pendiente |
| Sidebar actualizado con módulos | 🔄 | Entidades, Funcionarios, Comunas, Barrios, Ciudadanos y Categorías ✅ — resto pendiente |
| `DynamicTableComponent` extendido | ✅ | Soporta `rowClassFn` para estilos por fila y columnas tipo `image` |
| Leaflet instalado (mapas) | ✅ | CSS en `angular.json`; `MapPickerComponent` reutilizable listo (`app-map-picker`) |

---

## Notas del equipo

- El backend no tiene autenticación implementada — todos los endpoints son públicos. La auth es responsabilidad exclusiva del frontend (Firebase).
- Los roles se asignan manualmente desde la consola de Firebase Firestore (`users/{uid}.role`).
- Microsoft OAuth no disponible por restricciones de Azure en cuentas personales gratuitas.
