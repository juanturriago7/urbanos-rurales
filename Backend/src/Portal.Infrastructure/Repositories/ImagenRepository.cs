using Dapper;
using Portal.Application.Features.Imagenes.DTOs;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;
using Portal.Infrastructure.Persistence;

namespace Portal.Infrastructure.Repositories;

/// <summary>
/// Metadatos de la galería (RF-090 a RF-094). El binario vive en el bucket.
/// </summary>
internal sealed class ImagenRepository : IImagenRepository
{
    private const string SelectImagen = """
        SELECT
            id            AS Id,
            inmueble_id   AS InmuebleId,
            storage_key   AS StorageKey,
            url_cdn       AS UrlCdn,
            url_thumbnail AS UrlThumbnail,
            formato       AS Formato,
            peso_bytes    AS PesoBytes,
            orden         AS Orden,
            es_portada    AS EsPortada,
            texto_alt     AS TextoAlt,
            creado_en     AS CreadoEn
        FROM imagenes
        """;

    private readonly DbConnectionFactory _connectionFactory;

    public ImagenRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyList<ImagenDto>> GetPorInmuebleAsync(
        long inmuebleId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                id            AS Id,
                url_cdn       AS UrlCdn,
                url_thumbnail AS UrlThumbnail,
                formato       AS Formato,
                peso_bytes    AS PesoBytes,
                orden         AS Orden,
                es_portada    AS EsPortada,
                texto_alt     AS TextoAlt
            FROM imagenes
            WHERE inmueble_id = @InmuebleId
            ORDER BY orden, id;
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        var filas = await conn.QueryAsync<ImagenDto>(sql, new { InmuebleId = inmuebleId });
        return filas.AsList();
    }

    public async Task<Imagen?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<Imagen>(
            $"{SelectImagen} WHERE id = @Id;", new { Id = id });
    }

    public async Task<int> ContarAsync(long inmuebleId, CancellationToken ct = default)
    {
        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM imagenes WHERE inmueble_id = @InmuebleId;",
            new { InmuebleId = inmuebleId });
    }

    public async Task<short> SiguienteOrdenAsync(long inmuebleId, CancellationToken ct = default)
    {
        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<short>(
            "SELECT COALESCE(MAX(orden) + 1, 0)::smallint FROM imagenes WHERE inmueble_id = @InmuebleId;",
            new { InmuebleId = inmuebleId });
    }

    public async Task<long> CreateAsync(Imagen imagen, CancellationToken ct = default)
    {
        // La primera imagen del inmueble queda como portada: así una galería con
        // contenido nunca se queda sin portada. El WHERE NOT EXISTS lo resuelve
        // en el mismo INSERT, sin condición de carrera con el índice parcial.
        const string sql = """
            INSERT INTO imagenes
                (inmueble_id, storage_key, url_cdn, url_thumbnail, formato,
                 peso_bytes, orden, es_portada, texto_alt)
            VALUES
                (@InmuebleId, @StorageKey, @UrlCdn, @UrlThumbnail, @Formato,
                 @PesoBytes, @Orden,
                 NOT EXISTS (SELECT 1 FROM imagenes WHERE inmueble_id = @InmuebleId),
                 @TextoAlt)
            RETURNING id;
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<long>(sql, new
        {
            imagen.InmuebleId,
            imagen.StorageKey,
            imagen.UrlCdn,
            imagen.UrlThumbnail,
            imagen.Formato,
            imagen.PesoBytes,
            imagen.Orden,
            imagen.TextoAlt
        });
    }

    public async Task MarcarPortadaAsync(
        long inmuebleId, long imagenId, CancellationToken ct = default)
    {
        using var conn = await _connectionFactory.OpenAsync(ct);
        using var tx = conn.BeginTransaction();

        // Desmarcar primero es obligatorio: idx_una_portada es un índice único
        // parcial y no tolera dos portadas simultáneas ni por un instante.
        await conn.ExecuteAsync(
            "UPDATE imagenes SET es_portada = FALSE WHERE inmueble_id = @InmuebleId AND es_portada;",
            new { InmuebleId = inmuebleId }, tx);

        await conn.ExecuteAsync(
            "UPDATE imagenes SET es_portada = TRUE WHERE id = @Id AND inmueble_id = @InmuebleId;",
            new { Id = imagenId, InmuebleId = inmuebleId }, tx);

        tx.Commit();
    }

    public async Task ReordenarAsync(
        long inmuebleId, IReadOnlyList<long> imagenIds, CancellationToken ct = default)
    {
        using var conn = await _connectionFactory.OpenAsync(ct);
        using var tx = conn.BeginTransaction();

        // El índice de la lista es el nuevo orden. Se acota por inmueble_id para
        // que no se pueda reordenar la galería de otro inmueble.
        for (short i = 0; i < imagenIds.Count; i++)
        {
            await conn.ExecuteAsync(
                "UPDATE imagenes SET orden = @Orden WHERE id = @Id AND inmueble_id = @InmuebleId;",
                new { Orden = i, Id = imagenIds[i], InmuebleId = inmuebleId }, tx);
        }

        tx.Commit();
    }

    public async Task ActualizarTextoAltAsync(
        long imagenId, string? textoAlt, CancellationToken ct = default)
    {
        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(
            "UPDATE imagenes SET texto_alt = @TextoAlt WHERE id = @Id;",
            new { Id = imagenId, TextoAlt = textoAlt });
    }

    public async Task<string?> DeleteAsync(long imagenId, CancellationToken ct = default)
    {
        using var conn = await _connectionFactory.OpenAsync(ct);
        using var tx = conn.BeginTransaction();

        var borrada = await conn.QuerySingleOrDefaultAsync<(long InmuebleId, string StorageKey, bool EsPortada)?>(
            "DELETE FROM imagenes WHERE id = @Id RETURNING inmueble_id, storage_key, es_portada;",
            new { Id = imagenId }, tx);

        if (borrada is null)
        {
            tx.Rollback();
            return null;
        }

        // Si se fue la portada, asciende la siguiente por orden para que la
        // galería no quede sin imagen principal.
        if (borrada.Value.EsPortada)
        {
            await conn.ExecuteAsync("""
                UPDATE imagenes SET es_portada = TRUE
                WHERE id = (
                    SELECT id FROM imagenes
                    WHERE inmueble_id = @InmuebleId
                    ORDER BY orden, id
                    LIMIT 1
                );
                """, new { borrada.Value.InmuebleId }, tx);
        }

        tx.Commit();
        return borrada.Value.StorageKey;
    }
}
