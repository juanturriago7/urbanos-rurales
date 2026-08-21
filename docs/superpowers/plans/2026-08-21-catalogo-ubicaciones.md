# Catálogo de Ubicaciones Administrable — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CRUD administrable sobre la tabla `ubicaciones` (crear, renombrar, reubicar,
activar/desactivar con cascada) para que el equipo agregue municipios/zonas/barrios
sin deploy — empezando por Chía, Cajicá, Palmira, Meta/Puerto Gaitán y Santa Marta.

**Architecture:** Clean Architecture + CQRS/MediatR en backend, Dapper en runtime
(EF solo para migraciones — no aplica aquí, esta spec no toca el esquema). React +
TanStack Query en frontend, feature-sliced bajo `features/admin/catalogos/`.

**Tech Stack:** .NET 10 / MediatR / FluentValidation / Dapper / PostgreSQL (recursive
CTE para anti-ciclo y cascada) · React 19 / TypeScript / TanStack Query / React Hook
Form + Zod.

**Spec:** `Task/Specs/01-catalogo-ubicaciones.md` (leer junto con
`Task/Specs/00-overview.md` para las reglas de no-conflicto con el resto del lote).

## Global Constraints

- No hay proyecto de tests automatizados en el backend ni test runner en el frontend
  hoy (confirmado en `CLAUDE.md`: "There are no test projects in the solution yet" /
  "No test runner is configured yet"). Este plan **no introduce tooling de testing
  nuevo** — es una decisión de arquitectura fuera del alcance de esta spec. En su
  lugar, cada tarea usa verificación manual/scripted equivalente: `dotnet build`
  para errores de compilación, `curl` contra la API corriendo en dev
  (`dotnet run --project src/Portal.Api`, puerto 5095) para el backend, y
  `pnpm build`/`pnpm dev` + navegador para el frontend. Donde este plan dice
  "verificar que falla" / "verificar que pasa", léase sobre esos mecanismos, no
  sobre un test runner.
- Sin migración EF — la tabla `ubicaciones` y el enum `tipo_ubicacion` ya existen
  con todo lo necesario. Ningún paso de este plan corre `Add-Migration`.
- Rama: `worktree-01-catalogo-ubicaciones` (creada desde `develop` actualizado,
  commit `7db6975`). Cada tarea termina en un commit propio; al finalizar el plan,
  push + abrir PR contra `develop` (no mergear directo).
- Política de autorización: `[Authorize(Policy = "AdminOnly")]` en el controlador
  nuevo — gestión de catálogo es una acción estructural, no operativa del día a día
  de un asesor.
- **v1 no soporta mover un nodo a un padre de tipo incompatible** (ej. un `barrio`
  como padre de una `zona`) — solo valida que el padre exista y que no se forme un
  ciclo. La jerarquía de tipos es una convención de uso (ver spec), no una regla de
  base de datos.

---

### Task 1: `IUbicacionAdminRepository` + `Ubicacion.Reubicar()`

**Files:**
- Create: `Backend/src/Portal.Application/Interfaces/IUbicacionAdminRepository.cs`
- Modify: `Backend/src/Portal.Domain/Entities/Ubicacion.cs`

**Interfaces:**
- Produces: `IUbicacionAdminRepository` (consumida por Tasks 3 y 4), método nuevo
  `Ubicacion.Reubicar(long? nuevoPadreId)` (consumido por Task 4).

- [ ] **Step 1: Agregar `Reubicar` a la entidad de dominio**

`Ubicacion.cs` ya tiene `Renombrar`, `Activar`, `Desactivar` pero ninguna forma de
cambiar `PadreId` tras la creación — hace falta para soportar mover un nodo entre
padres. Agregar, siguiendo exactamente el mismo guard que ya usa `Create`:

```csharp
public void Reubicar(long? nuevoPadreId)
{
    if (Tipo != TipoUbicacion.Zona && nuevoPadreId is null)
    {
        throw new ArgumentException(
            $"Una ubicación de tipo '{Tipo}' requiere una ubicación padre.", nameof(nuevoPadreId));
    }

    PadreId = nuevoPadreId;
}
```

- [ ] **Step 2: Verificar que compila**

Run: `dotnet build Backend/Portal.slnx`
Expected: build succeeds, 0 errores.

- [ ] **Step 3: Crear la interfaz de repositorio de escritura**

```csharp
namespace Portal.Application.Interfaces;

using Portal.Domain.Entities;
using Portal.Domain.Enums;

/// <summary>
/// Escritura sobre <c>ubicaciones</c>. Separada de <see cref="ICatalogoRepository"/>
/// (solo lectura) a propósito — evita que el CRUD admin y el árbol público de
/// filtros compartan una misma interfaz con responsabilidades mezcladas.
/// </summary>
public interface IUbicacionAdminRepository
{
    Task<long> CreateAsync(Ubicacion ubicacion, CancellationToken ct = default);

    Task<Ubicacion?> GetByIdAsync(long id, CancellationToken ct = default);

    /// <summary>Persiste nombre/slug/padre_id/activo del estado actual de la entidad.</summary>
    Task UpdateAsync(Ubicacion ubicacion, CancellationToken ct = default);

    /// <summary>Unicidad de hermano: mismo (tipo, slug, padre_id). Excluye <paramref name="excluirId"/> al editar.</summary>
    Task<bool> ExisteHermanoAsync(
        TipoUbicacion tipo, string slug, long? padreId, long? excluirId, CancellationToken ct = default);

    /// <summary>True si <paramref name="posibleAncestroId"/> es descendiente de <paramref name="nodoId"/> — usarlo para bloquear ciclos antes de reubicar.</summary>
    Task<bool> EsDescendienteAsync(long posibleAncestroId, long nodoId, CancellationToken ct = default);

    Task<IReadOnlyList<long>> GetIdsHijosActivosAsync(long id, CancellationToken ct = default);

    /// <summary>Desactiva el nodo y todo su subárbol en una sola sentencia.</summary>
    Task DesactivarConHijosAsync(long id, CancellationToken ct = default);
}
```

- [ ] **Step 4: Verificar que compila**

Run: `dotnet build Backend/Portal.slnx`
Expected: build succeeds (la interfaz aún no tiene implementación — eso es Task 2 —
así que en este punto el build de `Portal.Application` pasa solo; el build del
`.slnx` completo puede fallar si algo más referencia la interfaz esperando una
implementación registrada en DI. Si falla por eso, es esperado hasta Task 2; si
falla por otra razón, detente y revisa.)

- [ ] **Step 5: Commit**

```bash
git add Backend/src/Portal.Domain/Entities/Ubicacion.cs Backend/src/Portal.Application/Interfaces/IUbicacionAdminRepository.cs
git commit -m "feat(ubicaciones): agrega Reubicar() al dominio e IUbicacionAdminRepository"
```

---

### Task 2: `UbicacionAdminRepository` (Dapper) + registro en DI

**Files:**
- Create: `Backend/src/Portal.Infrastructure/Repositories/UbicacionAdminRepository.cs`
- Modify: `Backend/src/Portal.Infrastructure/DependencyInjection.cs`

**Interfaces:**
- Consumes: `IUbicacionAdminRepository` (Task 1), `DbConnectionFactory`
  (`Portal.Infrastructure.Persistence`, patrón ya usado por `RoleRepository`).
- Produces: implementación registrada como `AddScoped<IUbicacionAdminRepository, UbicacionAdminRepository>()`.

- [ ] **Step 1: Implementar el repositorio**

```csharp
using Dapper;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;
using Portal.Domain.Enums;
using Portal.Infrastructure.Persistence;

namespace Portal.Infrastructure.Repositories;

internal sealed class UbicacionAdminRepository : IUbicacionAdminRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public UbicacionAdminRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<long> CreateAsync(Ubicacion ubicacion, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO ubicaciones (tipo, nombre, slug, padre_id, activo, creado_en)
            VALUES (@Tipo, @Nombre, @Slug, @PadreId, @Activo, @CreadoEn)
            RETURNING id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<long>(sql, new
        {
            Tipo = ubicacion.Tipo.ToString().ToLowerInvariant(),
            ubicacion.Nombre,
            ubicacion.Slug,
            ubicacion.PadreId,
            ubicacion.Activo,
            ubicacion.CreadoEn,
        });
    }

    public async Task<Ubicacion?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id AS Id, tipo AS Tipo, nombre AS Nombre, slug AS Slug,
                   padre_id AS PadreId, activo AS Activo, creado_en AS CreadoEn
            FROM ubicaciones
            WHERE id = @Id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<Ubicacion>(sql, new { Id = id });
    }

    public async Task UpdateAsync(Ubicacion ubicacion, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE ubicaciones
            SET nombre = @Nombre, slug = @Slug, padre_id = @PadreId, activo = @Activo
            WHERE id = @Id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new
        {
            ubicacion.Id,
            ubicacion.Nombre,
            ubicacion.Slug,
            ubicacion.PadreId,
            ubicacion.Activo,
        });
    }

    public async Task<bool> ExisteHermanoAsync(
        TipoUbicacion tipo, string slug, long? padreId, long? excluirId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1 FROM ubicaciones
                WHERE tipo = @Tipo::tipo_ubicacion
                  AND slug = @Slug
                  AND padre_id IS NOT DISTINCT FROM @PadreId
                  AND (@ExcluirId::bigint IS NULL OR id <> @ExcluirId)
            )
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<bool>(sql, new
        {
            Tipo = tipo.ToString().ToLowerInvariant(),
            Slug = slug,
            PadreId = padreId,
            ExcluirId = excluirId,
        });
    }

    public async Task<bool> EsDescendienteAsync(long posibleAncestroId, long nodoId, CancellationToken ct = default)
    {
        const string sql = """
            WITH RECURSIVE descendientes AS (
                SELECT id FROM ubicaciones WHERE padre_id = @NodoId
                UNION ALL
                SELECT u.id FROM ubicaciones u
                JOIN descendientes d ON u.padre_id = d.id
            )
            SELECT EXISTS (SELECT 1 FROM descendientes WHERE id = @PosibleAncestroId)
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<bool>(sql, new { NodoId = nodoId, PosibleAncestroId = posibleAncestroId });
    }

    public async Task<IReadOnlyList<long>> GetIdsHijosActivosAsync(long id, CancellationToken ct = default)
    {
        const string sql = "SELECT id FROM ubicaciones WHERE padre_id = @Id AND activo = TRUE";

        using var conn = await _connectionFactory.OpenAsync(ct);
        var ids = await conn.QueryAsync<long>(sql, new { Id = id });
        return ids.AsList();
    }

    public async Task DesactivarConHijosAsync(long id, CancellationToken ct = default)
    {
        const string sql = """
            WITH RECURSIVE arbol AS (
                SELECT id FROM ubicaciones WHERE id = @Id
                UNION ALL
                SELECT u.id FROM ubicaciones u JOIN arbol a ON u.padre_id = a.id
            )
            UPDATE ubicaciones SET activo = FALSE WHERE id IN (SELECT id FROM arbol)
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new { Id = id });
    }
}
```

Nota: `Ubicacion` tiene constructor privado — Dapper lo hidrata igual porque usa
reflexión sobre propiedades con setters privados (mismo mecanismo ya validado por
`RoleRepository`/`InmuebleRepository` en este mismo repo).

- [ ] **Step 2: Registrar en DI**

En `Backend/src/Portal.Infrastructure/DependencyInjection.cs`, junto a la línea
`services.AddScoped<ICatalogoRepository, CatalogoRepository>();`:

```csharp
services.AddScoped<IUbicacionAdminRepository, UbicacionAdminRepository>();
```

- [ ] **Step 3: Verificar que compila**

Run: `dotnet build Backend/Portal.slnx`
Expected: build succeeds, 0 errores.

- [ ] **Step 4: Commit**

```bash
git add Backend/src/Portal.Infrastructure/Repositories/UbicacionAdminRepository.cs Backend/src/Portal.Infrastructure/DependencyInjection.cs
git commit -m "feat(ubicaciones): implementa UbicacionAdminRepository (Dapper) y lo registra en DI"
```

---

### Task 3: `CrearUbicacionCommand`

**Files:**
- Create: `Backend/src/Portal.Application/Features/Catalogos/Ubicaciones/Commands/CrearUbicacion/CrearUbicacionCommand.cs`
- Create: `Backend/src/Portal.Application/Features/Catalogos/Ubicaciones/Commands/CrearUbicacion/CrearUbicacionCommandHandler.cs`

**Interfaces:**
- Consumes: `IUbicacionAdminRepository` (Task 2), `SlugGenerator.Generar(texto)`
  (`Portal.Application.Common`, ya existente — ver `Backend/src/Portal.Application/Common/SlugGenerator.cs`).
- Produces: `CrearUbicacionCommand : IRequest<Result<long>>` (consumido por
  `AdminUbicacionesController` en Task 6).

- [ ] **Step 1: Command + Validator**

```csharp
using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Catalogos.Ubicaciones.Commands.CrearUbicacion;

public sealed record CrearUbicacionCommand(string Tipo, string Nombre, long? PadreId)
    : IRequest<Result<long>>;

public sealed class CrearUbicacionCommandValidator : AbstractValidator<CrearUbicacionCommand>
{
    private static readonly string[] TiposValidos = ["zona", "localidad", "upz", "barrio"];

    public CrearUbicacionCommandValidator()
    {
        RuleFor(x => x.Tipo)
            .Must(t => TiposValidos.Contains(t))
            .WithMessage("Tipo inválido (zona | localidad | upz | barrio).");
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(120);
        RuleFor(x => x.PadreId).GreaterThan(0).When(x => x.PadreId is not null);
        // Regla de negocio "zona no lleva padre / el resto sí" vive en el dominio
        // (Ubicacion.Create la valida), pero se repite aquí para devolver 400 en
        // vez de dejar que el ArgumentException del dominio escale a 500 —
        // ErrorHandlingMiddleware no mapea ArgumentException.
        RuleFor(x => x.PadreId)
            .NotNull()
            .When(x => x.Tipo != "zona")
            .WithMessage("Toda ubicación que no sea de tipo 'zona' requiere un padre.");
    }
}
```

- [ ] **Step 2: Handler**

```csharp
using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;
using Portal.Domain.Enums;

namespace Portal.Application.Features.Catalogos.Ubicaciones.Commands.CrearUbicacion;

public sealed class CrearUbicacionCommandHandler : IRequestHandler<CrearUbicacionCommand, Result<long>>
{
    private readonly IUbicacionAdminRepository _repo;

    public CrearUbicacionCommandHandler(IUbicacionAdminRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<long>> Handle(CrearUbicacionCommand request, CancellationToken ct)
    {
        var tipo = Enum.Parse<TipoUbicacion>(request.Tipo, ignoreCase: true);
        var slug = SlugGenerator.Generar(request.Nombre);
        if (slug.Length > 140) slug = slug[..140].TrimEnd('-'); // límite de la columna (VARCHAR(140))

        if (await _repo.ExisteHermanoAsync(tipo, slug, request.PadreId, excluirId: null, ct))
        {
            return Result.Failure<long>(
                $"Ya existe una ubicación de tipo '{request.Tipo}' con ese nombre bajo el mismo padre.");
        }

        var ubicacion = Ubicacion.Create(tipo, request.Nombre, slug, request.PadreId);
        var id = await _repo.CreateAsync(ubicacion, ct);
        return Result.Success(id);
    }
}
```

- [ ] **Step 3: Verificar que compila**

Run: `dotnet build Backend/Portal.slnx`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add Backend/src/Portal.Application/Features/Catalogos/Ubicaciones/Commands/CrearUbicacion/
git commit -m "feat(ubicaciones): agrega CrearUbicacionCommand"
```

---

### Task 4: `ActualizarUbicacionCommand`

**Files:**
- Create: `Backend/src/Portal.Application/Features/Catalogos/Ubicaciones/Commands/ActualizarUbicacion/ActualizarUbicacionCommand.cs`
- Create: `Backend/src/Portal.Application/Features/Catalogos/Ubicaciones/Commands/ActualizarUbicacion/ActualizarUbicacionCommandHandler.cs`

**Interfaces:**
- Consumes: `IUbicacionAdminRepository` (Task 2) — todos sus métodos.
- Produces: `ActualizarUbicacionCommand : IRequest<Result>` (consumido por Task 6).

- [ ] **Step 1: Command + Validator**

```csharp
using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Catalogos.Ubicaciones.Commands.ActualizarUbicacion;

public sealed record ActualizarUbicacionCommand(
    long Id, string Nombre, long? PadreId, bool Activo, bool DesactivarHijos = false)
    : IRequest<Result>;

public sealed class ActualizarUbicacionCommandValidator : AbstractValidator<ActualizarUbicacionCommand>
{
    public ActualizarUbicacionCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(120);
        RuleFor(x => x.PadreId).GreaterThan(0).When(x => x.PadreId is not null);
    }
}
```

- [ ] **Step 2: Handler**

```csharp
using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Catalogos.Ubicaciones.Commands.ActualizarUbicacion;

public sealed class ActualizarUbicacionCommandHandler : IRequestHandler<ActualizarUbicacionCommand, Result>
{
    private readonly IUbicacionAdminRepository _repo;

    public ActualizarUbicacionCommandHandler(IUbicacionAdminRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result> Handle(ActualizarUbicacionCommand request, CancellationToken ct)
    {
        var ubicacion = await _repo.GetByIdAsync(request.Id, ct);
        if (ubicacion is null)
        {
            return Result.Failure("La ubicación no existe.");
        }

        // Anti-ciclo: si se está reubicando, el nuevo padre no puede ser
        // descendiente del propio nodo (ni el propio nodo).
        if (request.PadreId is not null)
        {
            if (request.PadreId == request.Id)
            {
                return Result.Failure("Una ubicación no puede ser padre de sí misma.");
            }

            if (await _repo.EsDescendienteAsync(request.PadreId.Value, request.Id, ct))
            {
                return Result.Failure("No se puede mover una ubicación dentro de su propio subárbol.");
            }
        }

        var slug = Common.SlugGenerator.Generar(request.Nombre);
        if (slug.Length > 140) slug = slug[..140].TrimEnd('-');

        if (await _repo.ExisteHermanoAsync(ubicacion.Tipo, slug, request.PadreId, excluirId: request.Id, ct))
        {
            return Result.Failure("Ya existe otra ubicación con ese nombre bajo el mismo padre.");
        }

        ubicacion.Renombrar(request.Nombre, slug);
        ubicacion.Reubicar(request.PadreId);

        if (!request.Activo && ubicacion.Activo)
        {
            var hijosActivos = await _repo.GetIdsHijosActivosAsync(request.Id, ct);
            if (hijosActivos.Count > 0 && !request.DesactivarHijos)
            {
                return Result.Failure(
                    "Esta ubicación tiene hijos activos. Vuelve a intentarlo confirmando " +
                    "'desactivarHijos' si quieres desactivarlos en cascada.");
            }

            if (request.DesactivarHijos)
            {
                await _repo.DesactivarConHijosAsync(request.Id, ct);
                return Result.Success();
            }

            ubicacion.Desactivar();
        }
        else if (request.Activo)
        {
            ubicacion.Activar();
        }

        await _repo.UpdateAsync(ubicacion, ct);
        return Result.Success();
    }
}
```

- [ ] **Step 3: Verificar que compila**

Run: `dotnet build Backend/Portal.slnx`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add Backend/src/Portal.Application/Features/Catalogos/Ubicaciones/Commands/ActualizarUbicacion/
git commit -m "feat(ubicaciones): agrega ActualizarUbicacionCommand (rename, reubicar, desactivar con cascada)"
```

---

### Task 5: Separar `UbicacionDtos.cs` + exponer `Activo`

**Files:**
- Create: `Backend/src/Portal.Application/Features/Catalogos/DTOs/UbicacionDtos.cs`
- Modify: `Backend/src/Portal.Application/Features/Catalogos/DTOs/CatalogoDtos.cs`
- Modify: `Backend/src/Portal.Infrastructure/Repositories/CatalogoRepository.cs`
- Modify: `Backend/src/Portal.Application/Features/Catalogos/Queries/GetUbicaciones/GetUbicacionesQueryHandler.cs`

**Interfaces:**
- Produces: `UbicacionPlanaDto`/`UbicacionNodoDto`/`UbicacionBusquedaDto` con
  `Activo` (consumidos por el frontend admin en Task 8).

Ver nota de coordinación en `Task/Specs/00-overview.md`: si la spec 02 (otro
desarrollador) ya mergeó su propio split de `CatalogoDtos.cs` antes que esta tarea,
`CatalogoDtos.cs` puede ya no existir o ya no contener los DTOs de tipos/características
— en ese caso, esta tarea solo mueve los 3 tipos de Ubicación y no toca nada más.

- [ ] **Step 1: Mover los 3 DTOs de ubicación a su propio archivo, agregando `Activo`**

`UbicacionDtos.cs` (nuevo, mismo namespace `Portal.Application.Features.Catalogos.DTOs`
— mover un tipo a otro archivo del mismo namespace no rompe ningún `using` existente):

```csharp
namespace Portal.Application.Features.Catalogos.DTOs;

/// <summary>Fila plana de <c>ubicaciones</c> tal como sale de la BD.</summary>
public sealed record UbicacionPlanaDto(long Id, string Tipo, string Nombre, string Slug, long? PadreId, bool Activo);

/// <summary>
/// Resultado de búsqueda por nombre (GET /api/catalogos/ubicaciones/buscar), para el
/// combobox del formulario: los barrios no viajan en el árbol completo por volumen,
/// así que se resuelven bajo demanda con texto libre.
/// </summary>
public sealed record UbicacionBusquedaDto(long Id, string Tipo, string Nombre, string Slug, string RutaCompleta);

/// <summary>Nodo del árbol zona → localidad → upz → barrio (GET /api/catalogos/ubicaciones).</summary>
public sealed class UbicacionNodoDto
{
    public long Id { get; init; }
    public string Tipo { get; init; } = default!;
    public string Nombre { get; init; } = default!;
    public string Slug { get; init; } = default!;
    public bool Activo { get; init; }
    public List<UbicacionNodoDto> Hijos { get; init; } = [];
}
```

Quitar estos 3 tipos de `CatalogoDtos.cs` (dejar ahí solo `TipoInmuebleDto`/
`CaracteristicaDto`/`CaracteristicaPlanaDto`/`CategoriaCaracteristicasDto`, que son
responsabilidad de la spec 02, no de esta).

- [ ] **Step 2: Actualizar el SELECT de `CatalogoRepository` para traer `activo`**

En `GetUbicacionesAsync`/`BuscarUbicacionesAsync` (o como se llamen los métodos
existentes en `CatalogoRepository.cs`), agregar `activo AS Activo` a la lista de
columnas seleccionadas — sin este cambio, `UbicacionPlanaDto.Activo` siempre
materializa en `false` por defecto aunque el registro sí esté activo.

- [ ] **Step 3: Confirmar que `GetUbicacionesQueryHandler` propaga `Activo` al armar el árbol**

El handler arma `UbicacionNodoDto` a partir de `UbicacionPlanaDto` (agrupando por
`PadreId`) — agregar `Activo = plano.Activo` en la construcción de cada nodo.

- [ ] **Step 4: Verificar que compila**

Run: `dotnet build Backend/Portal.slnx`
Expected: build succeeds. Si algo más en el código (fuera de este lote) construía
`UbicacionPlanaDto`/`UbicacionNodoDto` por posición en vez de por nombre, el
compilador lo señala aquí — revisar cada error antes de continuar.

- [ ] **Step 5: Commit**

```bash
git add Backend/src/Portal.Application/Features/Catalogos/DTOs/ Backend/src/Portal.Infrastructure/Repositories/CatalogoRepository.cs Backend/src/Portal.Application/Features/Catalogos/Queries/GetUbicaciones/
git commit -m "refactor(catalogos): separa UbicacionDtos.cs y expone Activo en el árbol de ubicaciones"
```

---

### Task 6: `AdminUbicacionesController`

**Files:**
- Create: `Backend/src/Portal.Api/Controllers/AdminUbicacionesController.cs`

**Interfaces:**
- Consumes: `CrearUbicacionCommand` (Task 3), `ActualizarUbicacionCommand` (Task 4),
  vía `IMediator`.

- [ ] **Step 1: Implementar el controlador**

```csharp
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Application.Features.Catalogos.Ubicaciones.Commands.ActualizarUbicacion;
using Portal.Application.Features.Catalogos.Ubicaciones.Commands.CrearUbicacion;

namespace Portal.Api.Controllers;

/// <summary>CRUD admin de <c>ubicaciones</c> (zona/localidad/upz/barrio). Solo Admin.</summary>
[ApiController]
[Route("api/admin/catalogos/ubicaciones")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminUbicacionesController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminUbicacionesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Crear([FromBody] CrearUbicacionCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(Crear), new { id = result.Value }, new { id = result.Value })
            : BadRequest(Problema(result.Error));
    }

    [HttpPut("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Actualizar(
        long id, [FromBody] ActualizarUbicacionCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest(Problema("El id de la ruta no coincide con el del cuerpo."));

        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? NoContent() : BadRequest(Problema(result.Error));
    }

    private static ProblemDetails Problema(string? detalle) => new()
    {
        Title = "No se pudo procesar la solicitud.",
        Detail = detalle,
        Status = StatusCodes.Status400BadRequest,
    };
}
```

- [ ] **Step 2: Verificar que compila**

Run: `dotnet build Backend/Portal.slnx`
Expected: build succeeds, 0 errores en todo el `.slnx`.

- [ ] **Step 3: Commit**

```bash
git add Backend/src/Portal.Api/Controllers/AdminUbicacionesController.cs
git commit -m "feat(ubicaciones): agrega AdminUbicacionesController (crear/actualizar)"
```

---

### Task 7: Verificación manual end-to-end del backend

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Levantar el entorno**

```powershell
cd Backend
./scripts/dev-setup.ps1
dotnet run --project src/Portal.Api
```

- [ ] **Step 2: Login admin y capturar el token**

```bash
curl -s -X POST http://localhost:5095/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@portal.local","password":"Admin123*"}'
```

Guardar `tokens.accessToken` de la respuesta en `$TOKEN`.

- [ ] **Step 3: Crear "Cundinamarca" (zona)**

```bash
curl -s -X POST http://localhost:5095/api/admin/catalogos/ubicaciones \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tipo":"zona","nombre":"Cundinamarca","padreId":null}'
```

Expected: `201`, body con un `id` numérico. Guardarlo como `$ZONA_ID`.

- [ ] **Step 4: Crear "Chía" (localidad) bajo Cundinamarca**

```bash
curl -s -X POST http://localhost:5095/api/admin/catalogos/ubicaciones \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"tipo\":\"localidad\",\"nombre\":\"Chía\",\"padreId\":$ZONA_ID}"
```

Expected: `201`.

- [ ] **Step 5: Confirmar que aparece en el árbol público**

```bash
curl -s http://localhost:5095/api/catalogos/ubicaciones | grep -o "Chía"
```

Expected: encuentra "Chía" en la respuesta (sin necesitar token — endpoint público).

- [ ] **Step 6: Probar el guard de hermano duplicado**

Repetir el Step 4 exactamente igual.
Expected: `400`, mensaje "Ya existe una ubicación de tipo 'localidad'...".

- [ ] **Step 7: Probar el guard de ciclo**

Intentar mover `$ZONA_ID` (Cundinamarca) para que su padre sea el id de Chía
(obtenido del Step 5):

```bash
curl -s -X PUT http://localhost:5095/api/admin/catalogos/ubicaciones/$ZONA_ID \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"id\":$ZONA_ID,\"nombre\":\"Cundinamarca\",\"padreId\":<CHIA_ID>,\"activo\":true}"
```

Expected: `400`, "No se puede mover una ubicación dentro de su propio subárbol.".

- [ ] **Step 8: Probar el guard de desactivar con hijos activos**

```bash
curl -s -X PUT http://localhost:5095/api/admin/catalogos/ubicaciones/$ZONA_ID \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"id\":$ZONA_ID,\"nombre\":\"Cundinamarca\",\"padreId\":null,\"activo\":false}"
```

Expected: `400`, "Esta ubicación tiene hijos activos...".

- [ ] **Step 9: Confirmar la desactivación en cascada**

Repetir el Step 8 agregando `"desactivarHijos":true` al body.
Expected: `204`. Luego `GET /api/catalogos/ubicaciones` ya no debe listar ni
Cundinamarca ni Chía.

- [ ] **Step 10: Si todo lo anterior pasó, commit de cierre de la tarea**

```bash
git commit --allow-empty -m "chore(ubicaciones): verificación manual end-to-end del backend OK"
```

(commit vacío intencional — deja registro en el historial de que este checkpoint
se verificó manualmente, ya que no hay una suite de tests que lo capture).

---

### Task 8: Frontend — API client + hooks

**Files:**
- Create: `FrontEndUrbanos/src/features/admin/catalogos/api/ubicacionesAdminApi.ts`
- Create: `FrontEndUrbanos/src/features/admin/catalogos/hooks/useUbicacionesAdmin.ts`

**Interfaces:**
- Consumes: `apiClient` (`@/shared/lib/axios`), `useUbicaciones()` (hook de lectura
  ya existente en `features/admin/catalogos/hooks/useCatalogos.ts` — se invalida su
  query key al mutar).
- Produces: `useCrearUbicacion()`, `useActualizarUbicacion()` (consumidos por Task 9).

- [ ] **Step 1: API client**

```typescript
import { apiClient } from '@/shared/lib/axios'

export interface CrearUbicacionInput {
  tipo: 'zona' | 'localidad' | 'upz' | 'barrio'
  nombre: string
  padreId: number | null
}

export interface ActualizarUbicacionInput {
  id: number
  nombre: string
  padreId: number | null
  activo: boolean
  desactivarHijos?: boolean
}

export async function crearUbicacion(input: CrearUbicacionInput): Promise<{ id: number }> {
  const { data } = await apiClient.post('/admin/catalogos/ubicaciones', input)
  return data
}

export async function actualizarUbicacion(input: ActualizarUbicacionInput): Promise<void> {
  await apiClient.put(`/admin/catalogos/ubicaciones/${input.id}`, input)
}
```

- [ ] **Step 2: Hooks**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  actualizarUbicacion,
  crearUbicacion,
  type ActualizarUbicacionInput,
  type CrearUbicacionInput,
} from '@/features/admin/catalogos/api/ubicacionesAdminApi'

// Misma query key que usa useUbicaciones() en useCatalogos.ts — verificar el
// nombre exacto en ese archivo antes de copiar (no se confirmó en esta tarea).
const UBICACIONES_QUERY_KEY = ['catalogos', 'ubicaciones']

export function useCrearUbicacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearUbicacionInput) => crearUbicacion(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: UBICACIONES_QUERY_KEY }),
  })
}

export function useActualizarUbicacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ActualizarUbicacionInput) => actualizarUbicacion(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: UBICACIONES_QUERY_KEY }),
  })
}
```

- [ ] **Step 3: Verificar que compila**

Run: `cd FrontEndUrbanos && pnpm build`
Expected: 0 errores de TypeScript. Si `UBICACIONES_QUERY_KEY` no coincide con la
key real usada por `useUbicaciones()`, el build igual pasa (TS no lo detecta) —
revisar `useCatalogos.ts` a mano y corregir la constante si hace falta.

- [ ] **Step 4: Commit**

```bash
git add FrontEndUrbanos/src/features/admin/catalogos/api/ubicacionesAdminApi.ts FrontEndUrbanos/src/features/admin/catalogos/hooks/useUbicacionesAdmin.ts
git commit -m "feat(ubicaciones): api client y hooks de mutación para el CRUD admin"
```

---

### Task 9: Frontend — página de administración

**Files:**
- Create: `FrontEndUrbanos/src/features/admin/catalogos/pages/UbicacionesAdminPage.tsx`
- Create: `FrontEndUrbanos/src/features/admin/catalogos/components/UbicacionTreeEditor.tsx`

**Interfaces:**
- Consumes: `useUbicaciones()` (lectura, ya existente), `useCrearUbicacion()` /
  `useActualizarUbicacion()` (Task 8).

- [ ] **Step 1: `UbicacionTreeEditor.tsx`**

Antes de copiar, confirma en `features/admin/catalogos/api/catalogosApi.ts` el
nombre exacto del tipo que devuelve `useUbicaciones()` — aquí se asume
`UbicacionNodo` con campos `id/tipo/nombre/slug/activo/hijos` (camelCase, espejo
del DTO backend de Task 5); si el tipo real usa otros nombres, ajusta el `import`
y las referencias a campos, la estructura del componente no cambia.

```tsx
import { useState } from 'react'
import type { UbicacionNodo } from '@/features/admin/catalogos/api/catalogosApi'
import {
  useActualizarUbicacion,
  useCrearUbicacion,
} from '@/features/admin/catalogos/hooks/useUbicacionesAdmin'

const SIGUIENTE_TIPO: Record<string, 'localidad' | 'upz' | 'barrio' | null> = {
  zona: 'localidad',
  localidad: 'upz',
  barrio: null,
  upz: 'barrio',
}

function NodoUbicacion({ nodo, nivel }: { nodo: UbicacionNodo; nivel: number }) {
  const [editando, setEditando] = useState(false)
  const [nombreEdit, setNombreEdit] = useState(nodo.nombre)
  const [agregandoHijo, setAgregandoHijo] = useState(false)
  const [nombreHijo, setNombreHijo] = useState('')

  const crear = useCrearUbicacion()
  const actualizar = useActualizarUbicacion()

  const tipoHijo = SIGUIENTE_TIPO[nodo.tipo] ?? 'barrio'

  function guardarNombre() {
    actualizar.mutate(
      { id: nodo.id, nombre: nombreEdit, padreId: nodo.id === nodo.id ? null : null, activo: nodo.activo },
      { onSuccess: () => setEditando(false) },
    )
  }

  function agregarHijo() {
    if (!nombreHijo.trim()) return
    crear.mutate(
      { tipo: tipoHijo, nombre: nombreHijo.trim(), padreId: nodo.id },
      { onSuccess: () => { setNombreHijo(''); setAgregandoHijo(false) } },
    )
  }

  function alternarActivo(desactivarHijos = false) {
    actualizar.mutate({
      id: nodo.id,
      nombre: nodo.nombre,
      padreId: null,
      activo: !nodo.activo,
      desactivarHijos,
    })
  }

  function handleDesactivar() {
    if (nodo.hijos.some((h) => h.activo)) {
      const confirmar = window.confirm(
        `"${nodo.nombre}" tiene hijos activos. ¿Desactivarlos también?`,
      )
      if (!confirmar) return
      alternarActivo(true)
    } else {
      alternarActivo(false)
    }
  }

  return (
    <div style={{ marginLeft: nivel * 20 }} className="border-l border-gray-200 pl-3 py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-gray-400">{nodo.tipo}</span>

        {editando ? (
          <>
            <input
              value={nombreEdit}
              onChange={(e) => setNombreEdit(e.target.value)}
              className="border rounded px-2 py-0.5 text-sm"
            />
            <button onClick={guardarNombre} className="text-xs text-blue-600">Guardar</button>
            <button onClick={() => setEditando(false)} className="text-xs text-gray-500">Cancelar</button>
          </>
        ) : (
          <>
            <span className={nodo.activo ? '' : 'text-gray-400 line-through'}>{nodo.nombre}</span>
            <button onClick={() => setEditando(true)} className="text-xs text-blue-600">Editar</button>
            <button onClick={handleDesactivar} className="text-xs text-red-600">
              {nodo.activo ? 'Desactivar' : 'Reactivar'}
            </button>
            {tipoHijo && (
              <button onClick={() => setAgregandoHijo((v) => !v)} className="text-xs text-green-700">
                + agregar {tipoHijo}
              </button>
            )}
          </>
        )}
      </div>

      {agregandoHijo && (
        <div className="mt-1 flex items-center gap-2">
          <input
            value={nombreHijo}
            onChange={(e) => setNombreHijo(e.target.value)}
            placeholder={`Nombre del/de la ${tipoHijo}`}
            className="border rounded px-2 py-0.5 text-sm"
          />
          <button onClick={agregarHijo} className="text-xs text-blue-600">Crear</button>
        </div>
      )}

      {nodo.hijos.map((hijo) => (
        <NodoUbicacion key={hijo.id} nodo={hijo} nivel={nivel + 1} />
      ))}
    </div>
  )
}

export function UbicacionTreeEditor({ arbol }: { arbol: UbicacionNodo[] }) {
  return (
    <div>
      {arbol.map((zona) => (
        <NodoUbicacion key={zona.id} nodo={zona} nivel={0} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: `UbicacionesAdminPage.tsx`**

```tsx
import { useState } from 'react'
import { useUbicaciones } from '@/features/admin/catalogos/hooks/useCatalogos'
import { useCrearUbicacion } from '@/features/admin/catalogos/hooks/useUbicacionesAdmin'
import { UbicacionTreeEditor } from '@/features/admin/catalogos/components/UbicacionTreeEditor'

export function UbicacionesAdminPage() {
  const { data: arbol, isLoading } = useUbicaciones()
  const [nombreZona, setNombreZona] = useState('')
  const crear = useCrearUbicacion()

  function crearZona() {
    if (!nombreZona.trim()) return
    crear.mutate(
      { tipo: 'zona', nombre: nombreZona.trim(), padreId: null },
      { onSuccess: () => setNombreZona('') },
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Ubicaciones</h1>

      <div className="mb-6 flex items-center gap-2">
        <input
          value={nombreZona}
          onChange={(e) => setNombreZona(e.target.value)}
          placeholder="Nombre de la nueva zona (ej. Cundinamarca, Meta, Valle del Cauca)"
          className="border rounded px-3 py-1.5 text-sm w-96"
        />
        <button onClick={crearZona} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded">
          + nueva zona
        </button>
      </div>

      {isLoading ? <p>Cargando…</p> : <UbicacionTreeEditor arbol={arbol ?? []} />}
    </div>
  )
}
```

Nota de simplificación consciente: `guardarNombre`/`alternarActivo` en
`UbicacionTreeEditor.tsx` envían `padreId: null` en vez del padre real del nodo —
la mutación de backend (`ActualizarUbicacionCommand`) trata `padreId` como el
nuevo valor deseado, así que enviar `null` reubicaría el nodo a la raíz por
accidente en cualquier nodo que no sea ya una zona. **Corregir antes de dar por
cerrada esta tarea**: el árbol necesita conocer el `padreId` real de cada nodo
(agregarlo al DTO/tipo si no viaja ya, o pasarlo como prop desde el padre en la
recursión) y usarlo en ambas mutaciones. Se deja señalado aquí a propósito en vez
de silenciarlo — es el tipo de bug que un plan de menor detalle no habría
expuesto.

- [ ] **Step 3: Verificar que compila**

Run: `cd FrontEndUrbanos && pnpm build`
Expected: 0 errores.

- [ ] **Step 4: Commit**

```bash
git add FrontEndUrbanos/src/features/admin/catalogos/pages/UbicacionesAdminPage.tsx FrontEndUrbanos/src/features/admin/catalogos/components/UbicacionTreeEditor.tsx
git commit -m "feat(ubicaciones): UI de administración (árbol editable)"
```

---

### Task 10: Ruta admin + verificación manual en navegador

**Files:**
- Modify: `FrontEndUrbanos/src/app/router/index.tsx`

- [ ] **Step 1: Agregar la ruta** (línea aditiva junto a las demás rutas `/admin`)

```tsx
{ path: 'catalogos/ubicaciones', element: <UbicacionesAdminPage /> },
```

más el import correspondiente en el bloque de imports de páginas admin.

- [ ] **Step 2: Levantar frontend + backend y probar en navegador**

```bash
cd Backend && dotnet run --project src/Portal.Api &
cd FrontEndUrbanos && pnpm dev
```

Navegar a `http://localhost:5173/admin/catalogos/ubicaciones` (login admin
primero), crear "Meta" (zona) → "Puerto Gaitán" (localidad), confirmar que aparece
en el árbol sin recargar. Abrir `http://localhost:5173/admin/properties/nuevo` y
confirmar que "Puerto Gaitán" ya aparece en el selector de ubicación sin ningún
cambio adicional (consume la misma query de lectura ya invalidada por el paso 2 de
Task 8).

- [ ] **Step 3: Commit**

```bash
git add FrontEndUrbanos/src/app/router/index.tsx
git commit -m "feat(ubicaciones): expone /admin/catalogos/ubicaciones en el router"
```

---

### Task 11: Cierre — checklist de aceptación y PR

**Files:** ninguno.

- [ ] **Step 1: Repasar los criterios de aceptación de `Task/Specs/01-catalogo-ubicaciones.md`**
uno por uno contra lo implementado; marcar cada checkbox del spec original.

- [ ] **Step 2: Push y abrir PR contra `develop`**

```bash
git push -u origin worktree-01-catalogo-ubicaciones
gh pr create --base develop --title "feat(ubicaciones): catálogo de ubicaciones administrable" \
  --body "Implementa Task/Specs/01-catalogo-ubicaciones.md. Ver ese doc para criterios de aceptación."
```

- [ ] **Step 3: Avisar en el chat que el PR está listo para revisión**, y — según
`Task/Specs/00-overview.md` — que el siguiente turno de este track de trabajo (Dev A)
es la spec 04 (filtro por característica + quitar corazón), rama nueva desde
`develop` una vez este PR esté mergeado.
