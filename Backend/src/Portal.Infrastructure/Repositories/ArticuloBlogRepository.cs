using Dapper;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;
using Portal.Domain.Enums;
using Portal.Infrastructure.Persistence;

namespace Portal.Infrastructure.Repositories;

internal sealed class ArticuloBlogRepository : IArticuloBlogRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public ArticuloBlogRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<long> CreateAsync(ArticuloBlog a, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO articulos_blog (
                titulo, slug, resumen, contenido,
                imagen_portada_key, imagen_portada_url,
                meta_titulo, meta_descripcion,
                estado, autor_id, creado_en, actualizado_en)
            VALUES (
                @Titulo, @Slug, @Resumen, @Contenido,
                @ImagenPortadaKey, @ImagenPortadaUrl,
                @MetaTitulo, @MetaDescripcion,
                CAST(@Estado AS estado_articulo_blog), @AutorId, @CreadoEn, @ActualizadoEn)
            RETURNING id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<long>(sql, new
        {
            a.Titulo,
            a.Slug,
            a.Resumen,
            a.Contenido,
            a.ImagenPortadaKey,
            a.ImagenPortadaUrl,
            a.MetaTitulo,
            a.MetaDescripcion,
            Estado = a.Estado.ToString().ToLowerInvariant(),
            a.AutorId,
            a.CreadoEn,
            a.ActualizadoEn,
        });
    }

    public async Task UpdateAsync(ArticuloBlog a, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE articulos_blog
            SET titulo = @Titulo, resumen = @Resumen, contenido = @Contenido,
                imagen_portada_key = @ImagenPortadaKey, imagen_portada_url = @ImagenPortadaUrl,
                meta_titulo = @MetaTitulo, meta_descripcion = @MetaDescripcion,
                estado = CAST(@Estado AS estado_articulo_blog),
                publicado_en = @PublicadoEn,
                actualizado_en = @ActualizadoEn
            WHERE id = @Id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new
        {
            a.Id,
            a.Titulo,
            a.Resumen,
            a.Contenido,
            a.ImagenPortadaKey,
            a.ImagenPortadaUrl,
            a.MetaTitulo,
            a.MetaDescripcion,
            Estado = a.Estado.ToString().ToLowerInvariant(),
            a.PublicadoEn,
            a.ActualizadoEn,
        });
    }

    public async Task<ArticuloBlog?> GetByIdAsync(long id, CancellationToken ct = default)
        => await GetSingleAsync(
            "SELECT id AS Id, titulo AS Titulo, slug AS Slug, resumen AS Resumen, contenido AS Contenido, imagen_portada_key AS ImagenPortadaKey, imagen_portada_url AS ImagenPortadaUrl, meta_titulo AS MetaTitulo, meta_descripcion AS MetaDescripcion, estado::text AS Estado, autor_id AS AutorId, publicado_en AS PublicadoEn, creado_en AS CreadoEn, actualizado_en AS ActualizadoEn FROM articulos_blog WHERE id = @Id",
            new { Id = id }, ct);

    public async Task<ArticuloBlog?> GetBySlugAsync(string slug, CancellationToken ct = default)
        => await GetSingleAsync(
            "SELECT id AS Id, titulo AS Titulo, slug AS Slug, resumen AS Resumen, contenido AS Contenido, imagen_portada_key AS ImagenPortadaKey, imagen_portada_url AS ImagenPortadaUrl, meta_titulo AS MetaTitulo, meta_descripcion AS MetaDescripcion, estado::text AS Estado, autor_id AS AutorId, publicado_en AS PublicadoEn, creado_en AS CreadoEn, actualizado_en AS ActualizadoEn FROM articulos_blog WHERE slug = @Slug",
            new { Slug = slug }, ct);

    public async Task<IReadOnlyList<ArticuloBlog>> GetPagedAdminAsync(int page, int pageSize, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id AS Id, titulo AS Titulo, slug AS Slug, resumen AS Resumen, contenido AS Contenido,
                   imagen_portada_key AS ImagenPortadaKey, imagen_portada_url AS ImagenPortadaUrl,
                   meta_titulo AS MetaTitulo, meta_descripcion AS MetaDescripcion,
                   estado::text AS Estado, autor_id AS AutorId, publicado_en AS PublicadoEn,
                   creado_en AS CreadoEn, actualizado_en AS ActualizadoEn
            FROM articulos_blog
            ORDER BY actualizado_en DESC
            LIMIT @PageSize OFFSET @Skip
            """;
        using var conn = await _connectionFactory.OpenAsync(ct);
        var filas = await conn.QueryAsync<ArticuloBlogRow>(sql,
            new { PageSize = pageSize, Skip = (page - 1) * pageSize });
        return filas.Select(r => r.ToEntity()).ToList();
    }

    public async Task<IReadOnlyList<ArticuloBlog>> GetPagedPublicoAsync(int page, int pageSize, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id AS Id, titulo AS Titulo, slug AS Slug, resumen AS Resumen, contenido AS Contenido,
                   imagen_portada_key AS ImagenPortadaKey, imagen_portada_url AS ImagenPortadaUrl,
                   meta_titulo AS MetaTitulo, meta_descripcion AS MetaDescripcion,
                   estado::text AS Estado, autor_id AS AutorId, publicado_en AS PublicadoEn,
                   creado_en AS CreadoEn, actualizado_en AS ActualizadoEn
            FROM articulos_blog
            WHERE estado = 'publicado'
            ORDER BY publicado_en DESC NULLS LAST, creado_en DESC
            LIMIT @PageSize OFFSET @Skip
            """;
        using var conn = await _connectionFactory.OpenAsync(ct);
        var filas = await conn.QueryAsync<ArticuloBlogRow>(sql,
            new { PageSize = pageSize, Skip = (page - 1) * pageSize });
        return filas.Select(r => r.ToEntity()).ToList();
    }

    public async Task<int> CountPublicoAsync(CancellationToken ct = default)
    {
        const string sql = "SELECT COUNT(*)::int FROM articulos_blog WHERE estado = 'publicado'";
        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<int>(sql);
    }

    public async Task<int> CountAdminAsync(CancellationToken ct = default)
    {
        const string sql = "SELECT COUNT(*)::int FROM articulos_blog";
        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<int>(sql);
    }

    public async Task<bool> ExisteSlugAsync(string slug, long? excluirId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1 FROM articulos_blog
                WHERE slug = @Slug
                  AND (@ExcluirId::bigint IS NULL OR id <> @ExcluirId)
            )
            """;
        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<bool>(sql, new { Slug = slug, ExcluirId = excluirId });
    }

    public async Task DeleteAsync(long id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM articulos_blog WHERE id = @Id";
        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new { Id = id });
    }

    private async Task<ArticuloBlog?> GetSingleAsync(string sql, object parameters, CancellationToken ct)
    {
        using var conn = await _connectionFactory.OpenAsync(ct);
        var row = await conn.QuerySingleOrDefaultAsync<ArticuloBlogRow>(sql, parameters);
        return row is null ? null : row.ToEntity();
    }

    /// <summary>Fila cruda de la BD. Se mapea a entidad con un método de instancia
    /// para evitar reflection sobre setters privados.</summary>
    private sealed class ArticuloBlogRow
    {
        public long Id { get; set; }
        public string Titulo { get; set; } = default!;
        public string Slug { get; set; } = default!;
        public string? Resumen { get; set; }
        public string Contenido { get; set; } = default!;
        public string? ImagenPortadaKey { get; set; }
        public string? ImagenPortadaUrl { get; set; }
        public string? MetaTitulo { get; set; }
        public string? MetaDescripcion { get; set; }
        public string Estado { get; set; } = default!;
        public long? AutorId { get; set; }
        public DateTime? PublicadoEn { get; set; }
        public DateTime CreadoEn { get; set; }
        public DateTime ActualizadoEn { get; set; }

        public ArticuloBlog ToEntity()
        {
            var estado = Estado switch
            {
                "borrador" => EstadoArticuloBlog.Borrador,
                "publicado" => EstadoArticuloBlog.Publicado,
                "archivado" => EstadoArticuloBlog.Archivado,
                _ => EstadoArticuloBlog.Borrador,
            };
            return new ArticuloBlog(
                Id, Titulo, Slug, Resumen, Contenido,
                ImagenPortadaKey, ImagenPortadaUrl,
                MetaTitulo, MetaDescripcion,
                estado, AutorId, PublicadoEn, CreadoEn, ActualizadoEn);
        }
    }
}
