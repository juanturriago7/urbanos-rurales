using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Inmuebles.Commands.CambiarEstadoInmueble;

/// <summary>Cambio de estado editorial (RF-075): borrador | publicado | pausado | archivado.</summary>
public sealed record CambiarEstadoInmuebleCommand(long Id, string Estado) : IRequest<Result>;

public sealed class CambiarEstadoInmuebleCommandValidator
    : AbstractValidator<CambiarEstadoInmuebleCommand>
{
    private static readonly string[] EstadosValidos =
        ["borrador", "publicado", "pausado", "archivado"];

    public CambiarEstadoInmuebleCommandValidator()
    {
        RuleFor(x => x.Estado)
            .Must(e => EstadosValidos.Contains(e))
            .WithMessage("Estado inválido (borrador | publicado | pausado | archivado).");
    }
}
