using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Blog.Commands.ActualizarArticulo;

public sealed record ActualizarArticuloCommand(
    long Id, string Titulo, string Contenido, string? Resumen,
    string? ImagenPortadaUrl,
    string? MetaTitulo, string? MetaDescripcion)
    : IRequest<Result>;

public sealed class ActualizarArticuloCommandValidator : AbstractValidator<ActualizarArticuloCommand>
{
    public ActualizarArticuloCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Titulo).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Contenido).NotEmpty();
        RuleFor(x => x.Resumen).MaximumLength(320);
    }
}

public sealed class ActualizarArticuloCommandHandler : IRequestHandler<ActualizarArticuloCommand, Result>
{
    private readonly Application.Interfaces.IArticuloBlogRepository _repo;

    public ActualizarArticuloCommandHandler(Application.Interfaces.IArticuloBlogRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result> Handle(ActualizarArticuloCommand request, CancellationToken ct)
    {
        var articulo = await _repo.GetByIdAsync(request.Id, ct);
        if (articulo is null) return Result.Failure("El artículo no existe.");

        // Si el título cambia, regenerar slug y validar.
        if (!string.Equals(articulo.Titulo, request.Titulo, StringComparison.Ordinal))
        {
            var nuevoSlug = SlugGenerator.Generar(request.Titulo);
            if (nuevoSlug.Length > 180) nuevoSlug = nuevoSlug[..180].TrimEnd('-');
            if (await _repo.ExisteSlugAsync(nuevoSlug, request.Id, ct))
            {
                return Result.Failure($"Ya existe otro artículo con un título equivalente (slug '{nuevoSlug}').");
            }
        }

        articulo.Actualizar(
            request.Titulo, request.Contenido, request.Resumen,
            null /* portada key no se actualiza por esta vía */,
            request.ImagenPortadaUrl,
            request.MetaTitulo, request.MetaDescripcion);
        await _repo.UpdateAsync(articulo, ct);
        return Result.Success();
    }
}
