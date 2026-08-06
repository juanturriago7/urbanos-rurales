using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Imagenes.DTOs;

namespace Portal.Application.Features.Imagenes.Commands.RegistrarImagen;

/// <summary>
/// Paso 2 de la subida: confirma que el objeto llegó al bucket y guarda sus
/// metadatos en <c>imagenes</c>.
/// </summary>
public sealed record RegistrarImagenCommand(
    long InmuebleId,
    string StorageKey,
    string? TextoAlt) : IRequest<Result<ImagenDto>>;

public sealed class RegistrarImagenCommandValidator : AbstractValidator<RegistrarImagenCommand>
{
    public RegistrarImagenCommandValidator()
    {
        RuleFor(x => x.InmuebleId).GreaterThan(0);
        RuleFor(x => x.StorageKey).NotEmpty().MaximumLength(500);
        RuleFor(x => x.TextoAlt).MaximumLength(150);
    }
}
