using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Imagenes.DTOs;

namespace Portal.Application.Features.Postulaciones.Commands.PresignCv;

/// <summary>
/// Paso 1 de la subida de la hoja de vida (spec 07, fast-follow): autoriza y
/// devuelve una URL prefirmada para que el navegador suba el PDF directo al
/// bucket. Público y anónimo — cualquiera puede postularse, sin sesión.
/// </summary>
public sealed record PresignCvCommand(
    string NombreArchivo,
    string ContentType) : IRequest<Result<UrlSubidaDto>>;

public sealed class PresignCvCommandValidator : AbstractValidator<PresignCvCommand>
{
    public PresignCvCommandValidator()
    {
        RuleFor(x => x.NombreArchivo).NotEmpty().MaximumLength(255);
        RuleFor(x => x.ContentType)
            .Must(t => string.Equals(t, "application/pdf", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Solo se aceptan archivos PDF.");
    }
}
