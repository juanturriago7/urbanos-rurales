using Portal.Application.Features.Imagenes.DTOs;
using Portal.Domain.Entities;

namespace Portal.Application.Interfaces;

/// <summary>
/// Puerto de la tabla <c>imagenes</c> (RF-090 a RF-094). Solo metadatos: el
/// binario vive en el almacenamiento de objetos.
/// </summary>
public interface IImagenRepository
{
    Task<IReadOnlyList<ImagenDto>> GetPorInmuebleAsync(long inmuebleId, CancellationToken ct = default);

    Task<Imagen?> GetByIdAsync(long id, CancellationToken ct = default);

    Task<int> ContarAsync(long inmuebleId, CancellationToken ct = default);

    /// <summary>Siguiente valor libre de <c>orden</c> para ese inmueble.</summary>
    Task<short> SiguienteOrdenAsync(long inmuebleId, CancellationToken ct = default);

    /// <summary>
    /// Inserta la imagen. Si es la primera del inmueble queda como portada
    /// automáticamente, para que nunca haya una galería sin portada.
    /// </summary>
    Task<long> CreateAsync(Imagen imagen, CancellationToken ct = default);

    /// <summary>
    /// Marca la portada. Desmarca la anterior en la misma transacción: hay un
    /// índice único parcial (<c>idx_una_portada</c>) que revienta si llegan a
    /// coexistir dos.
    /// </summary>
    Task MarcarPortadaAsync(long inmuebleId, long imagenId, CancellationToken ct = default);

    /// <summary>Reescribe el campo <c>orden</c> según la secuencia recibida.</summary>
    Task ReordenarAsync(long inmuebleId, IReadOnlyList<long> imagenIds, CancellationToken ct = default);

    Task ActualizarTextoAltAsync(long imagenId, string? textoAlt, CancellationToken ct = default);

    /// <summary>
    /// Borra la fila y devuelve la clave del objeto para que el handler lo
    /// elimine del bucket. Si era la portada, promueve la siguiente por orden.
    /// </summary>
    Task<string?> DeleteAsync(long imagenId, CancellationToken ct = default);
}
