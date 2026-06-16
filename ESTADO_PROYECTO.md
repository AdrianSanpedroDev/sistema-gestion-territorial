# Estado del Proyecto — Sistema de Gestión Territorial

> Documento de seguimiento del equipo frontend. Se actualiza a medida que se completan casos de uso.
> Última actualización: 2026-06-16 — RBAC, dashboard, auto-fill ciudadano (Adrián)

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
| Mapa | CU-09 | Demarcar polígono de barrio | ✅ Completado | Nico |
| Mapa | CU-10 | Editar polígono | ✅ Completado | Nico |
| Mapa | CU-11 | Tracking en tiempo real | ✅ Completado | Nico |
| Anotaciones | CU-12 | Crear anotación | ✅ Completado | Adrián |
| Anotaciones | CU-13 | Calificar anotación | ✅ Completado | Adrián |
| Anotaciones | CU-14 | Visualizar por categoría | ✅ Completado | Adrián |
| Reportes | CU-15 | Reportes inteligentes (chat) | ✅ Completado | Adrián |

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

### ✅ CU-07 — Login OAuth + Email/Contraseña
- Pantalla de login con botones Google, GitHub y formulario email/contraseña
- `SecurityService` conectado a Firebase Auth: `loginWithGoogle()`, `loginWithGitHub()`, `loginWithEmail(email, password)`
- Roles almacenados en Firestore (primer login crea usuario con rol `ciudadano`)
- Guards `AuthenticatedGuard` y `NoAuthenticatedGuard` actualizados
- Diseño de login con branding GeoTerritorial (panel izquierdo con formulario, panel derecho con degradado azul)
- Usuario admin: `admin@gmail.com` / `admin123` (creado manualmente en Firebase Auth + Firestore con `role: "admin"`)

### ✅ CU-08 — Logout
- Botón "Logout" en el menú desplegable del header
- Llama a `SecurityService.logout()` y redirige a `/authentication/login`
- Foto de perfil real (Google/GitHub) con fallback a imagen por defecto
- Nombre del usuario visible en el header

### ✅ CU-09 — Demarcar polígono de barrio _(Nico, 2026-06-15)_
- Página `/demarcation` con layout de tres paneles: sidebar de barrios (izquierda), mapa Leaflet (centro), herramientas de demarcación (derecha)
- `MapService` (singleton `root`) gestiona el mapa Leaflet, los markers arrastrables y el polígono activo
- `DemarcationToolsComponent`: modos "Agregar puntos", "Editar puntos" (drag) y "Limpiar"; muestra tabla de coordenadas en tiempo real
- `NeighborhoodSidebarComponent`: lista de barrios con búsqueda; al seleccionar un barrio carga sus puntos desde `PointService.searchPoints({ id_neighborhood })`
- Al guardar: crea/actualiza los puntos vía `PointService.createPoint` / `updatePoint` / `deletePoint`; polígono persistido como lista de `Point` ordenados por `order`
- **Nota para CU-12:** el `MapService` de Nico es exclusivo de esta página (polígonos). CU-12 usa `MapPickerComponent` (punto único). No inyectar `MapService` en CU-12.

### ✅ CU-10 — Editar polígono _(Nico, 2026-06-15)_
- Integrado dentro de la misma página `/demarcation`
- Modo "Editar puntos": cada marker es arrastrable; al soltar llama a `PointService.updatePoint(id, newCoords)` en tiempo real
- Tabla de coordenadas actualiza coordenadas al arrastrar

### ✅ CU-11 — Tracking en tiempo real _(Nico, 2026-06-15)_
- Integrado en el mapa principal (página `/map`)
- `socket.io-client` conectado al backend Flask-SocketIO
- Escucha evento de posición de funcionarios; muestra markers actualizados en tiempo real sobre el mapa
- Funcionarios con `gps_active = true` emiten su posición; el mapa la refleja sin recargar la página

### ✅ CU-12 — Crear/Editar anotación _(Adrián, 2026-06-16)_
- Modelo `Annotation` + interfaces de sub-recursos (`AnnotationCategory`, `Evidence`, `InterestedParty`) y DTOs en `src/app/models/annotation.ts`
- `AnnotationService` extiende `CrudService<Annotation>`: métodos `createAnnotation`, `updateAnnotation`, `searchByFilter`; sub-recursos: `uploadEvidences` (FormData), `getEvidences`, `deleteEvidence`, `addCategory`, `removeCategory`, `getAnnotationCategories`, `addInterestedParty`, `removeInterestedParty`, `getInterestedParties`
- Lista (`AnnotationComponent`): tabla paginada, búsqueda; ciudadano y barrio resueltos localmente con `forkJoin` + `CitizenService.getAll()` + `NeighborhoodService.getAll()` (el endpoint de lista no devuelve los nombres enriquecidos)
- Formulario (`AnnotationFormComponent`): layout mapa izquierda + panel derecha; detecta modo crear/editar vía `ActivatedRoute`
- **Auto-detección de barrio:** al hacer clic en el mapa, el sistema carga todos los polígonos con `PointService.searchPoints({})`, los agrupa por barrio en un `Map<id, Coordinates[]>` y aplica ray-casting (`isPointInPolygon`) para detectar automáticamente el barrio — el usuario no selecciona el barrio manualmente (CU-12 paso 4)
- Flujo alternativo 4a: si el punto cae fuera de todos los barrios → SweetAlert2 warning + guarda sin barrio (`id_neighborhood = null`)
- Categorías: chips con toggle; modo crear acumula IDs localmente y los guarda con `forkJoin` tras crear la anotación; modo editar llama al servicio en tiempo real
- Entidades interesadas: mismo patrón que categorías
- Evidencias: upload múltiple vía FormData (máx. 5 fotos); visualización y eliminación en modo editar
- `MapPickerComponent` reutilizado (`app-map-picker`): centro por defecto en Manizales (`5.0703, -75.5138`); polígono del barrio detectado se muestra al hacer clic
- Rutas: `/annotations` (lista) · `/annotations/new` · `/annotations/:id/edit` — registradas con lazy loading
- **Auto-fill ciudadano:** `forkJoin(citizenService.getAll(), securityService.me())` → busca coincidencia por email; si hay match muestra nombre readonly; si no (admin sin registro), muestra selector como fallback

### ✅ CU-13 — Calificar anotación _(Adrián, 2026-06-15)_
- Modelo `Vote` + DTOs `VoteRequestDto` (POST) y `VoteUpdateDto` (PUT) en `src/app/models/vote.ts`
- `VoteService` extiende `CrudService<Vote>` (`resource = 'votes'`): `getByAnnotation` (promedio), `getByAnnotationAndCitizen` (¿ya votó?), `createVote`, `updateVote`
- Integrado en el panel de detalle de `AnnotationMapComponent` (CU-14): estrellas 1–5 interactivas + comentario (máx. 500)
- **Promedio y distribución por estrella** se calculan en frontend (el backend no los devuelve)
- **id_citizen del votante**: se resuelve por match de email (`SecurityService.getCurrentUser()` → `CitizenService.getAll()`); solo el rol `ciudadano` registrado puede calificar
- **Flujo alternativo 4a**: si el ciudadano ya votó (`existingVote`), se precargan estrellas/comentario y el guardado hace `PUT` en vez de `POST`
- Errores con SweetAlert2 (`err.error.message`)

### ✅ CU-14 — Visualizar anotaciones en el mapa por categoría _(Adrián, 2026-06-15)_
- **Página propia** `AnnotationMapComponent` en ruta `/annotations-map`, con Leaflet autocontenido (`@ViewChild` + `LayerGroup`) — NO usa el `MapService` de polígonos de Nico (CU-09); sidebar con entrada "Mapa de anotaciones" separada de "Demarcación"
- Carga con `forkJoin`: `getAll()` anotaciones + `getAllAnnotationCategories()` + categorías + barrios; normalización defensiva array/`{items}`
- **Árbol jerárquico** de categorías/subcategorías con **conteo por nodo** (incluye descendientes); marcadores coloreados por categoría raíz
- Filtros en tiempo real con checkboxes; **flujo 8a** (seleccionar padre incluye todas las subcategorías) vía `computeSelectedCategoryIds`; **7a** ("Sin subcategorías"); **F1** (limpiar); **F2** (filtro combinado por barrio); opción extra **"Sin categoría"**
- Detalle al hacer clic en marcador: descripción, **categoría padre derivada del árbol** + subcategoría, evidencias, calificación promedio + distribución y fecha; mensajes **2a** (sin anotaciones) y **6a** (filtro sin resultados)
- **Quirk del backend corregido** (centralizado en `AnnotationService.filterByAnnotation`): los endpoints sub-recurso (`evidences`, `annotation-categories`, `interested-parties`, `votes/search`) ignoran el filtro `?id_annotation` y devuelven todas las filas → se re-filtra en el cliente por `id_annotation`
- **Limpieza**: `territorial-management` y su `MapService` se devolvieron a demarcación pura (se removieron los métodos de anotaciones que el commit anterior les había añadido)

### ✅ CU-15 — Reportes inteligentes _(Adrián, 2026-06-15)_
- Modelos `ReportRequest`, `ChartSeries`, `ReportResponse` e interfaz `ChartRendererOptions` en `src/app/models/report.ts`
- `ChartRendererOptions` importa tipos de `ng-apexcharts` (ApexAxisChartSeries, ApexNonAxisChartSeries, ApexChart, ApexXAxis, ApexPlotOptions, ApexDataLabels, ApexTooltip, ApexGrid, ApexLegend) — campos opcionales con `?` expresan que no todos los tipos de gráfica usan todos los campos
- `ReportsService` en `src/app/services/reports.service.ts`: `generateReport(query)` → `POST /reports` con body `{ query }`
- `ReportChatComponent` (`app-report-chat`): textarea + botón "Generar Reporte"; emite `querySubmit` con el texto al padre; input `[loading]` deshabilita el botón mientras se procesa
- `ChartRendererComponent` (`app-chart-renderer`): recibe `@Input() reportData: ReportResponse | null`; usa `ngOnChanges` (no `ngOnInit`) porque el input cambia múltiples veces; ramifica por `reportData.type` en métodos privados `buildBar()`, `buildLine()`, `buildPie()`; detecta arrays vacíos y muestra "Sin datos"; bandera `isEmpty` separada de `chartOptions` porque son estados semánticamente distintos
- Tipos soportados: `'bar'` → ApexChart horizontal con `ApexAxisChartSeries`; `'line'` / `'series'` (alias del backend) → ApexChart de línea; `'pie'` → ApexChart con `ApexNonAxisChartSeries` (number[]) y `labels`
- Template usa `$any()` para campos opcionales del `Partial<ChartRendererOptions>` que `apx-chart` no acepta como `undefined` bajo strict templates
- `ReportsComponent` (página `/reports`): coordina `ReportChatComponent` + `ChartRendererComponent`; errores manejados con SweetAlert2 mostrando `err.error.message`
- **Quirk del backend:** el endpoint real es `POST /reports` (sin prefijo `/api` — el blueprint no tiene `url_prefix`); corregido con `reportsUrl: 'http://127.0.0.1:5000/reports'` en `environment.ts` (separado de `apiUrl`)
- El tipo de gráfica lo decide Gemini en el backend según semántica de la pregunta: "porcentaje/proporción" → pie, "cuántos/compara" → bar, "evolución/tendencia" → line

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
| Modelos territoriales (`models/`) | ✅ | `entity.ts`, `official.ts`, `commune.ts`, `neighborhood.ts`, `citizen.ts`, `category.ts`, `annotation.ts`, `point.ts`, `coordinates.ts` |
| Servicios por recurso | ✅ | `EntityService`, `OfficialService`, `CommuneService`, `NeighborhoodService`, `CitizenService`, `CategoryService`, `AnnotationService`, `PointService` |
| Sidebar actualizado con módulos | ✅ | Todos los módulos registrados |
| `DynamicTableComponent` extendido | ✅ | Soporta `rowClassFn` para estilos por fila y columnas tipo `image` |
| Leaflet instalado (mapas) | ✅ | CSS en `angular.json`; `MapPickerComponent` reutilizable listo (`app-map-picker`) |

---

## Extras implementados (fuera del enunciado de CUs)

| Pieza | Descripción |
|---|---|
| **RBAC — RoleGuard** | Guard funcional (`CanActivateFn`) que lee `route.data['roles']` y redirige a `/dashboard` si el rol no está permitido. Rutas de admin y admin+funcionario protegidas. |
| **Sidebar filtrado por rol** | `FullComponent` filtra `navItems` en `ngOnInit` según el rol del usuario autenticado; los ítems sin `roles` son visibles para todos. |
| **Dashboard descriptivo** | `StarterComponent` reemplazado por bienvenida con nombre del usuario (via `SecurityService.me()`) y 3 tarjetas informativas sobre las capacidades del sistema. |
| **Branding GeoTerritorial** | Sidebar con logo + tipografía `Geo`/`Territorial`; login con panel degradado azul; header muestra nombre + etiqueta de rol. |

---

## Notas del equipo

- El backend no tiene autenticación implementada — todos los endpoints son públicos. La auth es responsabilidad exclusiva del frontend (Firebase).
- Los roles se asignan desde la consola de Firebase Firestore (`users/{uid}.role`). El admin se creó manualmente; nuevos usuarios inician con `ciudadano`.
- Microsoft OAuth no disponible por restricciones de Azure en cuentas personales gratuitas.
