using System.Security.Cryptography;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Inmuebles.Commands.CrearInmueble;

/// <summary>
/// Genera <c>codigo_referencia</c> y <c>slug</c> únicos (RF-074) y persiste el
/// agregado completo (inmueble + operaciones + características) en una transacción.
/// </summary>
public sealed class CrearInmuebleCommandHandler
    : IRequestHandler<CrearInmuebleCommand, Result<long>>
{
    private const string AlfabetoCodigo = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O ni 1/I
    private const int MaxIntentosCodigo = 5;

    private readonly IInmuebleRepository _inmuebles;

    public CrearInmuebleCommandHandler(IInmuebleRepository inmuebles)
    {
        _inmuebles = inmuebles;
    }

    public async Task<Result<long>> Handle(CrearInmuebleCommand request, CancellationToken ct)
    {
        var codigo = await GenerarCodigoUnicoAsync(ct);
        var slug = await GenerarSlugUnicoAsync(request.Titulo, ct);

        var inmueble = Inmueble.Create(
            codigo,
            slug,
            request.Titulo,
            request.Descripcion,
            request.TipoInmuebleId,
            request.UbicacionId,
            request.DireccionExacta,
            request.AreaTerrenoM2,
            request.AreaConstruidaM2,
            request.AreaPrivadaM2,
            request.YoutubeUrl,
            request.MapaEmbedUrl,
            request.AsesorId,
            request.CreadoPor);

        inmueble.ActualizarDatos(
            request.Titulo,
            request.Descripcion,
            request.TipoInmuebleId,
            request.UbicacionId,
            request.DireccionExacta,
            request.AreaTerrenoM2,
            request.AreaConstruidaM2,
            request.AreaPrivadaM2,
            request.YoutubeUrl,
            request.MapaEmbedUrl,
            request.Habitaciones,
            request.Banos,
            request.Parqueaderos,
            request.Piso,
            request.PisosEdificio,
            request.Estrato,
            request.Antiguedad,
            request.Orientacion,
            ContratoEnums.ParsePoliticaMascotas(request.PoliticaMascotas),
            request.Amoblado,
            request.MatriculaInmobiliaria,
            request.MetaTitulo,
            request.MetaDescripcion,
            request.AsesorId);

        var id = await _inmuebles.CreateAsync(
            inmueble,
            request.Operaciones ?? [],
            request.Caracteristicas ?? [],
            ct);

        return Result.Success(id);
    }

    private async Task<string> GenerarCodigoUnicoAsync(CancellationToken ct)
    {
        for (var intento = 0; intento < MaxIntentosCodigo; intento++)
        {
            var codigo = "INM-" + RandomNumberGenerator.GetString(AlfabetoCodigo, 6);

            if (!await _inmuebles.ExisteCodigoAsync(codigo, ct))
            {
                return codigo;
            }
        }

        throw new InvalidOperationException(
            "No fue posible generar un código de referencia único tras varios intentos.");
    }

    private async Task<string> GenerarSlugUnicoAsync(string titulo, CancellationToken ct)
    {
        var baseSlug = SlugGenerator.Generar(titulo);

        if (!await _inmuebles.ExisteSlugAsync(baseSlug, ct))
        {
            return baseSlug;
        }

        for (var sufijo = 2; ; sufijo++)
        {
            var candidato = $"{baseSlug}-{sufijo}";

            if (!await _inmuebles.ExisteSlugAsync(candidato, ct))
            {
                return candidato;
            }
        }
    }
}
