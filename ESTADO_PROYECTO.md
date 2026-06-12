# Estado del Proyecto — Sistema de Gestión Territorial

> Documento de seguimiento del equipo frontend. Se actualiza a medida que se completan casos de uso.
> Última actualización: 2026-06-11 — CU-08 completado

---

## Resumen general

| Módulo | CU | Descripción | Estado | Responsable |
|---|---|---|---|---|
| Autenticación | CU-07 | Login OAuth (Google / GitHub) | ✅ Completado | Adrián |
| Autenticación | CU-08 | Logout | ✅ Completado | Adrián |
| Administración | CU-01 | Gestión de Entidades | ⬜ Pendiente | — |
| Administración | CU-02 | Gestión de Funcionarios | ⬜ Pendiente | — |
| Administración | CU-03 | Gestión de Ciudadanos | ⬜ Pendiente | — |
| Administración | CU-04 | Gestión de Categorías | ⬜ Pendiente | — |
| Administración | CU-05 | Gestión de Comunas | ⬜ Pendiente | — |
| Administración | CU-06 | Gestión de Barrios | ⬜ Pendiente | — |
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

### ✅ CU-08 — Logout
- Botón "Logout" en el menú desplegable del header
- Llama a `SecurityService.logout()` y redirige a `/authentication/login`
- Foto de perfil real (Google/GitHub) con fallback a imagen por defecto
- Nombre del usuario visible en el header

---

## Infraestructura base

| Pieza | Estado | Notas |
|---|---|---|
| Firebase Auth (Google + GitHub) | ✅ | Microsoft bloqueado por restricciones de Azure en cuentas personales |
| Firestore (roles de usuario) | ✅ | Modo prueba |
| `SecurityService` con Firebase | ✅ | Reemplaza el mock anterior |
| `CrudService<T>` genérico | ⬜ | Pendiente — base para todos los CRUD admin |
| Modelos territoriales (`models/territorial/`) | ⬜ | Pendiente |
| Servicios por recurso | ⬜ | Pendiente |
| Sidebar actualizado con módulos | ⬜ | Pendiente |
| Leaflet instalado (mapas) | ⬜ | Necesario para CU-09/10/11/12/14 |

---

## Notas del equipo

- El backend no tiene autenticación implementada — todos los endpoints son públicos. La auth es responsabilidad exclusiva del frontend (Firebase).
- Los roles se asignan manualmente desde la consola de Firebase Firestore (`users/{uid}.role`).
- Microsoft OAuth no disponible por restricciones de Azure en cuentas personales gratuitas.
