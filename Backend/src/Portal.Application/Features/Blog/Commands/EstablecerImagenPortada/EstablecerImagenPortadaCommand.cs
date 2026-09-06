using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Blog.Commands.EstablecerImagenPortada;

/// <summary>
/// Paso 2: confirma que el objeto llegó al bucket y fija la portada del
/// artículo (mismo patrón que Features/Imagenes/Commands/RegistrarImagen).
/// </summary>
public sealed record EstablecerImagenPortadaCommand(
    long ArticuloId,
    string StorageKey) : IRequest<Result<string>>;

public sealed class EstablecerImagenPortadaCommandValidator
    : AbstractValidator<EstablecerImagenPortadaCommand>
{
    public EstablecerImagenPortadaCommandValidator()
    {
        RuleFor(x => x.ArticuloId).GreaterThan(0);
        RuleFor(x => x.StorageKey).NotEmpty().MaximumLength(500);
    }
}
