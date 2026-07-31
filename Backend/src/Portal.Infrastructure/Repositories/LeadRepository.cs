using Dapper;
using Portal.Application.Common;
using Portal.Application.Features.Leads.DTOs;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;
using Portal.Infrastructure.Persistence;

namespace Portal.Infrastructure.Repositories;

/// <summary>Repositorio de leads con Dapper. <c>ip_origen</c> es INET: se lee con host() y se escribe con CAST.</summary>
internal sealed class LeadRepository : ILeadRepository
{
    private const string SelectLead = """
        SELECT
            id                       AS Id,
            inmueble_id              AS InmuebleId,
            nombre                   AS Nombre,
            correo                   AS Correo,
            telefono                 AS Telefono,
            mensaje                  AS Mensaje,
            origen                   AS Origen,
            utm_source               AS UtmSource,
            utm_campaign             AS UtmCampaign,
            acepto_tratamiento_datos AS AceptoTratamientoDatos,
            estado::text             AS Estado,
            asignado_a               AS AsignadoA,
            ip_origen                AS IpOrigen,
            creado_en                AS CreadoEn
        FROM leads
        """;

    private readonly DbConnectionFactory _connectionFactory;

    public LeadRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<Lead?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        const string sql = $"{SelectLead} WHERE id = @Id";

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<Lead>(sql, new { Id = id });
    }

    public async Task<long> CreateAsync(Lead lead, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO leads (
                inmueble_id, nombre, correo, telefono, mensaje, origen,
                utm_source, utm_campaign, acepto_tratamiento_datos,
                estado, asignado_a, ip_origen, creado_en)
            VALUES (
                @InmuebleId, @Nombre, @Correo, @Telefono, @Mensaje, @Origen,
                @UtmSource, @UtmCampaign, @AceptoTratamientoDatos,
                CAST(@Estado AS estado_lead), @AsignadoA, CAST(@IpOrigen AS INET), @CreadoEn)
            RETURNING id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        return await conn.ExecuteScalarAsync<long>(sql, new
        {
            lead.InmuebleId,
            lead.Nombre,
            lead.Correo,
            lead.Telefono,
            lead.Mensaje,
            lead.Origen,
            lead.UtmSource,
            lead.UtmCampaign,
            lead.AceptoTratamientoDatos,
            Estado = ContratoEnums.ToApi(lead.Estado),
            lead.AsignadoA,
            IpOrigen = lead.IpOrigen?.ToString(),
            lead.CreadoEn
        });
    }

    public async Task UpdateAsync(Lead lead, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE leads SET
                estado     = CAST(@Estado AS estado_lead),
                asignado_a = @AsignadoA
            WHERE id = @Id
            """;

        using var conn = await _connectionFactory.OpenAsync(ct);
        await conn.ExecuteAsync(sql, new
        {
            lead.Id,
            Estado = ContratoEnums.ToApi(lead.Estado),
            lead.AsignadoA
        });
    }

    public async Task<PagedResult<LeadDto>> GetPagedAsync(
        string? estado, long? inmuebleId, PaginationParams pagination, CancellationToken ct = default)
    {
        var condiciones = new List<string> { "TRUE" };

        if (estado is not null) condiciones.Add("l.estado = CAST(@Estado AS estado_lead)");
        if (inmuebleId is not null) condiciones.Add("l.inmueble_id = @InmuebleId");

        var where = string.Join(" AND ", condiciones);

        var sql = $"""
            SELECT
                l.id                  AS Id,
                l.inmueble_id         AS InmuebleId,
                i.titulo              AS InmuebleTitulo,
                i.codigo_referencia   AS InmuebleCodigo,
                l.nombre              AS Nombre,
                l.correo              AS Correo,
                l.telefono            AS Telefono,
                l.mensaje             AS Mensaje,
                l.origen              AS Origen,
                l.utm_source          AS UtmSource,
                l.utm_campaign        AS UtmCampaign,
                l.estado::text        AS Estado,
                l.asignado_a          AS AsignadoA,
                u.nombre              AS AsignadoNombre,
                l.creado_en           AS CreadoEn
            FROM leads l
            LEFT JOIN inmuebles i ON i.id = l.inmueble_id
            LEFT JOIN usuarios u ON u.id = l.asignado_a
            WHERE {where}
            ORDER BY l.creado_en DESC
            LIMIT @PageSize OFFSET @Skip;

            SELECT COUNT(*) FROM leads l WHERE {where};
            """;

        var parametros = new
        {
            Estado = estado,
            InmuebleId = inmuebleId,
            pagination.PageSize,
            pagination.Skip
        };

        using var conn = await _connectionFactory.OpenAsync(ct);
        using var multi = await conn.QueryMultipleAsync(sql, parametros);

        var items = (await multi.ReadAsync<LeadDto>()).ToList();
        var total = await multi.ReadSingleAsync<int>();

        return PagedResult<LeadDto>.Create(items, pagination.Page, pagination.PageSize, total);
    }
}
