## 1. Análisis: atributos y reglas de negocio a confirmar antes de construir

| Tema | Detalle | Impacto en backend |
| --- | --- | --- |
| Amoblado, orientación, ascensor, calentador, gas, zonas comunes, depósito, balcón, tipo de cocina | No estaban explícitos en el acta original | Se modelan como catálogo `caracteristicas` (sin migración futura) o columnas propias donde aplique (ver sección 2) |
| Roles múltiples (`admin` / `asesor`) | El acta habla de "un asesor" en singular; falta definir si hay varios usuarios con permisos distintos | Define el diseño de `usuarios`, middlewares de autorización y alcance de `leads.asignado_a` |
| Trazabilidad y asignación de leads | RF-003 exige capturar origen, pero no estado/asignación | Tabla `leads` con `estado` y `asignado_a` |
| Historial de precio/estado | No obligatorio para MVP | Tabla opcional `inmueble_historial`, incluida en el modelo para no rediseñar (RNF-010) |
| Matrícula inmobiliaria y meta título/descripción | Exigidos en RNF-063 / RNF-050 pero sin campo explícito | Agregados como columnas en `inmuebles` |

**Decisión pendiente con el patrocinador:** confirmar si roles múltiples y CRM de leads entran en fase 1 o fase 2 (afecta el modelo de `usuarios`/`leads` desde el día 1).

