using Dapper;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;
using Portal.Infrastructure.Persistence;

namespace Portal.Infrastructure.Repositories;

internal sealed class PostulacionLaboralRepository : IPostulacionLaboralRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public PostulacionLaboralRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<long> CreateAsync(PostulacionLaboral p, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO postulaciones_laborales (
                nombre, correo, telefono, cargo_interes, mensaje,
                cv_storage_key, cv_url, ip_origen, creado_en)
            VALUES (
                @Nombre, @Correo, @Telefono, @CargoInteres, @Mensaje,
                @CvStorageKey, @CvUrl, @IpOrigen, @CreadoEn)
            RETURNING id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<long>(sql, new
        {
            p.Nombre,
            p.Correo,
            p.Telefono,
            p.CargoInteres,
            p.Mensaje,
            p.CvStorageKey,
            p.CvUrl,
            p.IpOrigen,
            p.CreadoEn,
        });
    }
}
