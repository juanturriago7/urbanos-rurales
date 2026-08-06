using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Imagenes.DTOs;

namespace Portal.Application.Features.Imagenes.Commands.GenerarUrlSubida;

/// <summary>
/// Paso 1 de la subida (RF-090): autoriza y devuelve una URL prefirmada para que
/// el navegador escriba directo en el bucket. La API no transporta los bytes.
/// </summary>
public sealed record GenerarUrlSubidaCommand(
    long InmuebleId,
    string NombreArchivo,
    string ContentType) : IRequest<Result<UrlSubidaDto>>;

public sealed class GenerarUrlSubidaCommandValidator : AbstractValidator<GenerarUrlSubidaCommand>
{
    /// <summary>Formatos aceptados al subir (RF-093).</summary>
    private static readonly string[] ContentTypesValidos =
        ["image/jpeg", "image/png", "image/webp"];

    public GenerarUrlSubidaCommandValidator()
    {
        RuleFor(x => x.InmuebleId).GreaterThan(0);
        RuleFor(x => x.NombreArchivo).NotEmpty().MaximumLength(255);
        RuleFor(x => x.ContentType)
            .Must(t => ContentTypesValidos.Contains(t?.ToLowerInvariant()))
            .WithMessage("Formato no soportado. Se aceptan JPG, PNG o WebP.");
    }
}
