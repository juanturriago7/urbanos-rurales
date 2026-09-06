using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Imagenes.DTOs;

namespace Portal.Application.Features.Blog.Commands.GenerarUrlSubidaPortada;

/// <summary>
/// Paso 1 de la subida de portada de un artículo: autoriza y devuelve una URL
/// prefirmada para que el navegador escriba directo en el bucket (mismo patrón
/// que Features/Imagenes/Commands/GenerarUrlSubida, aplicado a articulos_blog).
/// </summary>
public sealed record GenerarUrlSubidaPortadaCommand(
    long ArticuloId,
    string NombreArchivo,
    string ContentType) : IRequest<Result<UrlSubidaDto>>;

public sealed class GenerarUrlSubidaPortadaCommandValidator
    : AbstractValidator<GenerarUrlSubidaPortadaCommand>
{
    private static readonly string[] ContentTypesValidos =
        ["image/jpeg", "image/png", "image/webp"];

    public GenerarUrlSubidaPortadaCommandValidator()
    {
        RuleFor(x => x.ArticuloId).GreaterThan(0);
        RuleFor(x => x.NombreArchivo).NotEmpty().MaximumLength(255);
        RuleFor(x => x.ContentType)
            .Must(t => ContentTypesValidos.Contains(t?.ToLowerInvariant()))
            .WithMessage("Formato no soportado. Se aceptan JPG, PNG o WebP.");
    }
}
