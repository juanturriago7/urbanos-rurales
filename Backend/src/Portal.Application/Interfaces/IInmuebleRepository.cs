using Portal.Application.Common;
using Portal.Application.Features.Inmuebles.DTOs;
using Portal.Domain.Entities;
using Portal.Domain.Enums;

namespace Portal.Application.Interfaces;

/// <summary>
/// Puerto del agregado Inmueble (tablas <c>inmuebles</c>, <c>inmueble_operaciones</c>,
/// <c>inmueble_caracteristicas</c>). Las escrituras compuestas (inmueble + operaciones +
/// características) son transaccionales dentro del repositorio.
/// </summary>
public interface IInmuebleRepository
{
    // ── Escritura ───────────────────────────────────────────────────────────
    Task<Inmueble?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<bool> ExisteCodigoAsync(string codigoReferencia, CancellationToken ct = default);
    Task<bool> ExisteSlugAsync(string slug, CancellationToken ct = default);

    /// <summary>Inserta el inmueble con sus operaciones y características en una transacción.</summary>
    Task<long> CreateAsync(
        Inmueble inmueble,
        IReadOnlyCollection<OperacionInput> operaciones,
        IReadOnlyCollection<CaracteristicaValorInput> caracteristicas,
        CancellationToken ct = default);

    /// <summary>Actualiza el inmueble; si <paramref name="caracteristicas"/> no es null, las reemplaza.</summary>
    Task UpdateAsync(
        Inmueble inmueble,
        IReadOnlyCollection<CaracteristicaValorInput>? caracteristicas = null,
        CancellationToken ct = default);

    // ── Operaciones (venta/arriendo) ────────────────────────────────────────
    Task<InmuebleOperacion?> GetOperacionAsync(
        long inmuebleId, TipoOperacion tipo, CancellationToken ct = default);
    Task<long> CreateOperacionAsync(InmuebleOperacion operacion, CancellationToken ct = default);
    Task UpdateOperacionAsync(InmuebleOperacion operacion, CancellationToken ct = default);

    // ── Validaciones de publicación (RF-077) ────────────────────────────────
    Task<int> ContarImagenesAsync(long inmuebleId, CancellationToken ct = default);
    Task<bool> TieneOperacionActivaAsync(long inmuebleId, CancellationToken ct = default);

    // ── Destacados (RF-078) ─────────────────────────────────────────────────
    /// <summary>
    /// Marca como destacado solo si hay cupo (menos de <paramref name="maximo"/>
    /// destacados publicados sin contar este) y el inmueble sigue publicado.
    /// Conteo y escritura van en una transacción serializada con un advisory lock,
    /// así dos peticiones simultáneas no pueden superar el máximo.
    /// </summary>
    Task<ResultadoDestacar> DestacarConCupoAsync(
        long id, int maximo, CancellationToken ct = default);

    /// <summary>Destacados publicados y no eliminados (los que ocupan cupo).</summary>
    Task<int> ContarDestacadosAsync(CancellationToken ct = default);

    /// <summary>
    /// Quita el destacado con un UPDATE dirigido (no reescribe la fila completa),
    /// así no puede resucitar un <c>eliminado_en</c>/<c>estado</c> escritos por un
    /// <c>EliminarInmueble</c>/<c>CambiarEstado</c> concurrente sobre la entidad
    /// leída al inicio del request.
    /// </summary>
    Task QuitarDestacadoAsync(long id, CancellationToken ct = default);

    // ── Lecturas del panel admin ────────────────────────────────────────────
    Task<PagedResult<InmuebleAdminListItemDto>> GetPagedAdminAsync(
        string? estado, string? q, PaginationParams pagination, CancellationToken ct = default);
    Task<InmuebleAdminDetalleDto?> GetDetalleAdminAsync(long id, CancellationToken ct = default);
}
