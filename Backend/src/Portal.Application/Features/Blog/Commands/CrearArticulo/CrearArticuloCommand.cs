using FluentValidation;
using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Blog.Commands.CrearArticulo;

public sealed record CrearArticuloCommand(
    string Titulo, string Contenido, string? Resumen,
    string? ImagenPortadaUrl,
    string? MetaTitulo, string? MetaDescripcion)
    : IRequest<Result<long>>;

public sealed class CrearArticuloCommandValidator : AbstractValidator<CrearArticuloCommand>
{
    public CrearArticuloCommandValidator()
    {
        RuleFor(x => x.Titulo).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Contenido).NotEmpty();
        RuleFor(x => x.Resumen).MaximumLength(320);
        RuleFor(x => x.MetaTitulo).MaximumLength(160);
        RuleFor(x => x.MetaDescripcion).MaximumLength(320);
    }
}

public sealed class CrearArticuloCommandHandler : IRequestHandler<CrearArticuloCommand, Result<long>>
{
    private readonly Application.Interfaces.IArticuloBlogRepository _repo;

    public CrearArticuloCommandHandler(Application.Interfaces.IArticuloBlogRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<long>> Handle(CrearArticuloCommand request, CancellationToken ct)
    {
        var slug = SlugGenerator.Generar(request.Titulo);
        if (slug.Length > 180) slug = slug[..180].TrimEnd('-');

        if (await _repo.ExisteSlugAsync(slug, excluirId: null, ct))
        {
            return Result.Failure<long>(
                $"Ya existe un artículo con un título equivalente (slug '{slug}').");
        }

        var articulo = Domain.Entities.ArticuloBlog.Create(
            request.Titulo, slug, request.Contenido,
            request.Resumen, imagenPortadaUrl: request.ImagenPortadaUrl,
            metaTitulo: request.MetaTitulo, metaDescripcion: request.MetaDescripcion);

        var id = await _repo.CreateAsync(articulo, ct);
        return Result.Success(id);
    }
}
