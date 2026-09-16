# Logos de clientes

Los logos que aparecen en el carrusel de clientes (home y Quiénes somos).

## Estado actual

Verificado abriendo cada archivo, no por su nombre — los nombres estaban mal.

| Archivo             | Contiene                                  | Estado |
|---------------------|-------------------------------------------|--------|
| `ani.png`           | Agencia Nacional de Infraestructura        | ✅ en uso |
| `compensar.png`     | Compensar                                  | ✅ en uso |
| `geb.png`           | Grupo Energía Bogotá                       | ✅ en uso |
| `minsalud.png`      | Ministerio de Salud y Protección Social    | ✅ en uso — el archivo se llamaba `invias.png` |
| `sae.png`           | Sociedad de Activos Especiales             | ✅ en uso — el archivo se llamaba `findeter.png` |
| `cundinamarca.png`  | Gobernación de Cundinamarca                | ✅ en uso — el archivo se llamaba `ideam.png` |
| `epm.jpg` / `epm.png` | foto de stock, no es un logo             | ❌ sin usar |
| `isa.jpg` / `isa.png` | foto de stock, no es un logo             | ❌ sin usar |
| `alcaldia-bogota.jpg` / `.png` | foto de stock, no es un logo    | ❌ sin usar |
| `gobernacion-cundinamarca.jpg` / `.png` | foto de stock, no es un logo | ❌ sin usar |

Los archivos marcados ❌ se pueden borrar: son fotos genéricas de manos y
teclados que alguien dejó como marcador de posición.

## Logos que faltan

Estas entidades salen en el carrusel como texto, a la espera de su logo:
INVÍAS, FINDETER, IDEAM, EPM, ISA, Alcaldía de Bogotá, Ministerio de Vivienda
y Fondo Nacional del Ahorro.

## Cómo agregar uno

1. Guarda el archivo aquí con el nombre de la entidad (`invias.png`, `epm.png`…).
2. **Ábrelo y comprueba que es el logo correcto** antes de referenciarlo.
3. Añade la ruta al array `CLIENTES` de
   `src/features/public/institucional/components/ClientesCarrusel.tsx`.

Formato: PNG o SVG con fondo transparente o blanco, ancho ~300 px y alto
~120 px. Si el archivo no existe o falla la carga, la tarjeta cae de vuelta al
nombre en texto, sin romper la fila.
