# Spec 08 — Sección de certificaciones (template)

**Requerimiento original:** "En la SPA, una sección que hable de la certificación
(dejar template)."

**Depende de:** nada. **Migración propia:** ninguna. Sin cambios de backend.

## Diagnóstico — esto probablemente ya existe

`HomePage.tsx` ya tiene una sección "CERTIFICACIONES" (banda oscura, después de
"Trayectoria" y antes de "Contacto"): ícono de certificación, título "Certificación
en Calidad y Gestión Ambiental", párrafo sobre ISO 9001/ISO 14001, y tres badges
(`ISO 9001 — Gestión de Calidad`, `ISO 14001 — Gestión Ambiental`, `ITICOL
Certificado`).

Es decir, el requerimiento probablemente ya está resuelto por esa sección — lo que
falta aclarar es si el cliente:

(a) no sabía que ya existe y solo pedía confirmarla/formalizarla, o
(b) quiere una sección **adicional o distinta** (¿página propia, como "Quiénes
    somos" en la spec 07? ¿Contenido distinto?).

Esta spec asume (a) por ser la interpretación de menor riesgo y menor esfuerzo, y
dejarla planteada como "pulir lo existente para que quede claramente como
template" — si el cliente confirma que quería algo distinto, es la única spec del
lote que cambiaría de alcance sin afectar a ninguna otra.

## Alcance

1. Revisar la sección existente contra el resto del sitio (misma paleta/tipografía
   ya usada en `HomePage.tsx`, sin cambios de layout drásticos).
2. Confirmar que el copy actual lee inequívocamente como **contenido de relleno
   listo para reemplazar** (ej. si el ISO 9001/14001/ITICOL no son las
   certificaciones reales de la empresa, dejar el copy genérico pero con una
   estructura que el cliente pueda completar fácilmente después — no se está
   pidiendo verificar cuáles son las certificaciones reales).
3. Si se decide que amerita más peso (ej. un logo/sello visual por certificación en
   vez de solo texto en badges), este es el lugar para ese ajuste — pero mantenerlo
   como mejora de *pulido*, no una reconstrucción.

## Archivos

**Modificar:**
- `FrontEndUrbanos/src/features/public/properties/pages/HomePage.tsx` — sección
  "CERTIFICACIONES" existente (buscar el comentario `═══ CERTIFICACIONES — banda
  oscura ═══` dentro del archivo).

Sin solapamiento con ninguna otra spec del lote.

## Criterios de aceptación

- [ ] La sección de certificaciones es visualmente clara, consistente con el resto
      del home, y su copy se lee como una plantilla lista para completar con datos
      reales (no como un párrafo a medio escribir).

## Preguntas abiertas

- Confirmar con el cliente si esta petición se refiere a la sección ya existente en
  el home, o si esperaban algo adicional (página propia, ubicación distinta,
  contenido distinto al ISO 9001/14001/ITICOL ya presente). De la respuesta depende
  si esta spec se queda en "pulido" (alcance actual) o crece a un nuevo bloque —
  en cuyo caso seguiría siendo una spec pequeña y aislada, sin impacto en el resto
  del lote.
