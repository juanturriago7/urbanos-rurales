# Spec 05 — Home: resaltar la sección de inmuebles

**Requerimiento original:** "La sección de inmuebles, darle un poco más de resalte,
porque se pierde un poco más."

**Depende de:** nada. **Migración propia:** ninguna. Sin cambios de backend.

## Diagnóstico

La sección de propiedades en el home (`PublicacionesDestacadas.tsx`) existe y está
completa, pero hoy está **comentada por completo** en `HomePage.tsx`:

```tsx
{/* ═══════ PUBLICACIONES DESTACADAS
    Requiere backend corriendo en localhost:5095.
    Re-habilitar descomentando el import y este bloque. ═══════ */}
{/* <PublicacionesDestacadas /> */}
```

Es decir: hoy no es que "se pierda visualmente" entre las demás secciones — **no se
renderiza en absoluto**. Antes de pensar en un rediseño de prominencia, el primer
paso literal es reactivarla. Nótese también que el componente muestra "las 6 más
recientes" (`usePublicaciones({ pageSize: 6 })`), no filtra por `destacado: true`
— el título en pantalla ya dice "Propiedades disponibles", no "Destacadas", así que
no hace falta backend nuevo para esto (el filtro por `destacado` no existe hoy en
`InmueblesFiltro` — fuera de alcance de esta spec agregarlo, salvo que se decida
que sí se quiere mostrar únicamente los marcados como destacados, ver "Preguntas
abiertas").

Un segundo factor real de "se pierde": `PublicacionesDestacadas.tsx` usa un sistema
de diseño editorial propio (tipografía serif, paleta `#8b6f4e`/`#1c1917`) que no
coincide con el resto de `HomePage.tsx` (Tailwind `Outfit`, paleta azul
`#004b98`/`#00b5c5`) — la sección puede sentirse "pegada" en vez de integrada,
además de estar apagada en jerarquía visual frente al hero.

## Alcance

1. **Reactivar** el import y el bloque comentado en `HomePage.tsx`.
2. **Verificar contra el backend real** (`Backend/` corriendo en `:5095`, proxy de
   Vite activo) que la sección carga datos, maneja el estado vacío (ya lo hace: si
   no hay inmuebles publicados, el componente retorna `null`) y el estado de error.
3. **Pase de diseño** para subir la prominencia y unificar el lenguaje visual con el
   resto de la página — usar la skill `frontend-design`/`design-taste-frontend` al
   implementar en vez de improvisar valores. Como mínimo:
   - Encabezado de sección más grande/con más peso que el resto (hoy es igual de
     discreto que "Nuestros Clientes" o "Certificaciones", pero es contenido
     transaccional, no solo institucional — debería leerse con más jerarquía).
   - Evaluar si conviene adoptar la paleta azul del resto del home (`#004b98`/
     `#00b5c5`) en vez de la paleta serif/tostado (`#8b6f4e`), para que no se sienta
     como un componente ajeno insertado a la fuerza.
   - Confirmar la posición actual (segunda sección, justo después del hero) sigue
     siendo la correcta — es razonable que sí, dado que es contenido transaccional
     y el hero es puramente de marca.

## Archivos

**Modificar:**
- `FrontEndUrbanos/src/features/public/properties/pages/HomePage.tsx` — descomentar
  el import y el `<PublicacionesDestacadas />`.
- `FrontEndUrbanos/src/features/public/properties/components/PublicacionesDestacadas.tsx`
  — ajustes de diseño (tipografía, tamaños, paleta, spacing) según el pase de
  diseño del punto 3.

Ningún otro archivo de esta spec se comparte con el resto del lote — cero riesgo de
conflicto con las demás specs.

## Criterios de aceptación

- [ ] Con el backend corriendo y al menos un inmueble publicado, la sección aparece
      en el home entre el hero y "Quiénes somos", con datos reales.
- [ ] Sin inmuebles publicados, la sección no deja un hueco vacío ni un error visual
      (ya es el comportamiento actual del componente — solo confirmar que se
      mantiene).
- [ ] La sección se distingue claramente del resto de la página en una revisión
      visual (no requiere métricas, es un juicio de diseño al probar en navegador).

## Preguntas abiertas

- ¿La sección debe mostrar específicamente los inmuebles marcados `destacado: true`
  (columna que ya existe en la base de datos y en el DTO, pero que el filtro
  público `InmueblesFiltro` no expone hoy), en vez de "los 6 más recientes"? Si la
  respuesta es sí, esta spec crece: hay que agregar `Destacado: bool?` a
  `InmueblesFiltro` y al `BuscarInmueblesQueryHandler`/repositorio — cambio de
  backend pequeño y aislado (no toca `inmuebles` como tabla, es un filtro de
  lectura), se puede sumar a esta misma spec sin abrir una nueva.
