namespace Portal.Application.Features.Imagenes.DTOs;

/// <summary>Imagen de la galería tal como la consume el panel.</summary>
public sealed record ImagenDto(
    long Id,
    string UrlCdn,
    string? UrlThumbnail,
    string Formato,
    int? PesoBytes,
    short Orden,
    bool EsPortada,
    string? TextoAlt);

/// <summary>Respuesta del paso 1: permiso para subir directo al bucket.</summary>
public sealed record UrlSubidaDto(string UrlSubida, string StorageKey, int VigenciaSegundos);

/// <summary>Nuevo orden de la galería: los ids en la secuencia deseada.</summary>
public sealed record ReordenarImagenesInput(IReadOnlyList<long> ImagenIds);
