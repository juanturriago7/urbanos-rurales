using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Inmuebles.Commands.MarcarDestacado;

/// <summary>Marca/desmarca un inmueble como destacado para la home (RF-078).</summary>
public sealed record MarcarDestacadoCommand(long Id, bool Destacado) : IRequest<Result>;
