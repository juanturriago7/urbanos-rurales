## 1. Atributos y filtros que la UI debe contemplar

Además de lo ya definido en el acta (operación, tipo, ubicación, precio, área, habitaciones, baños, parqueaderos, mascotas, estrato, administración), diseñar la UI/UX considerando estos atributos adicionales identificados en el análisis del proyecto — todos vienen del catálogo dinámico de características, así que la UI debe **renderizarlos genéricamente por categoría**, no hardcodearlos uno por uno:

| Categoría (ejemplo) | Atributos |
| --- | --- |
| Interior | Amoblado, tipo de cocina, closets, calentador |
| Servicios | Internet, gas natural, agua caliente |
| Seguridad | Portería/vigilancia 24h |
| Zonas comunes | Piscina, BBQ, salón social, gimnasio, parque infantil, cancha |
| Estructura | Piso, pisos del edificio, ascensor, orientación, balcón/terraza/patio, depósito |
| Comercial | Antigüedad (nuevo, sobre planos, usado <5 años, usado >5 años), disponibilidad |

**Importante para el diseño de filtros:** como el catálogo de características es dinámico (el admin puede agregar amenidades sin desplegar código), el componente de filtros debe leer la lista de características filtrables desde `/api/catalogos/caracteristicas` y renderizar checkboxes automáticamente — no debe haber una lista fija de filtros en el código del frontend.

