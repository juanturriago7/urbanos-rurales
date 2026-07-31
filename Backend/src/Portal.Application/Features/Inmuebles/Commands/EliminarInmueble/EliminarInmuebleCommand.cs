using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Inmuebles.Commands.EliminarInmueble;

/// <summary>Borrado lógico (RF-073): marca <c>eliminado_en</c> y archiva; el registro se conserva.</summary>
public sealed record EliminarInmuebleCommand(long Id) : IRequest<Result>;
