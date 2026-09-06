using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Inmuebles.Commands.ActualizarInmueble;

/// <summary>
/// Edición de inmueble (RF-072). El slug y el código de referencia no cambian
/// (estabilidad SEO, RNF-050).
/// </summary>
public sealed record ActualizarInmuebleCommand : InmuebleDatosCommandBase, IRequest<Result>
{
    /// <summary>Lo asigna el controller desde la ruta; no viene en el body.</summary>
    public long Id { get; set; }
}

public sealed class ActualizarInmuebleCommandValidator
    : InmuebleDatosValidatorBase<ActualizarInmuebleCommand>
{
    public ActualizarInmuebleCommandValidator(ITipoInmuebleAdminRepository tiposInmueble)
        : base(tiposInmueble)
    {
    }
}
