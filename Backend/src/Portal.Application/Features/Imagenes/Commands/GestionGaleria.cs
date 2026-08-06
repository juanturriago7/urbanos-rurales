using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Imagenes.Commands;

// ── Marcar portada (RF-091) ──────────────────────────────────────────────────

public sealed record MarcarPortadaCommand(long InmuebleId, long ImagenId) : IRequest<Result>;

public sealed class MarcarPortadaCommandHandler : IRequestHandler<MarcarPortadaCommand, Result>
{
    private readonly IImagenRepository _imagenes;

    public MarcarPortadaCommandHandler(IImagenRepository imagenes) => _imagenes = imagenes;

    public async Task<Result> Handle(MarcarPortadaCommand request, CancellationToken ct)
    {
        var imagen = await _imagenes.GetByIdAsync(request.ImagenId, ct);

        if (imagen is null || imagen.InmuebleId != request.InmuebleId)
        {
            throw new KeyNotFoundException($"Imagen {request.ImagenId} no encontrada en este inmueble.");
        }

        await _imagenes.MarcarPortadaAsync(request.InmuebleId, request.ImagenId, ct);
        return Result.Success();
    }
}

// ── Reordenar galería (RF-091) ───────────────────────────────────────────────

public sealed record ReordenarImagenesCommand(long InmuebleId, IReadOnlyList<long> ImagenIds)
    : IRequest<Result>;

public sealed class ReordenarImagenesCommandValidator : AbstractValidator<ReordenarImagenesCommand>
{
    public ReordenarImagenesCommandValidator()
    {
        RuleFor(x => x.InmuebleId).GreaterThan(0);
        RuleFor(x => x.ImagenIds).NotEmpty().WithMessage("Envía el orden completo de la galería.");
        RuleFor(x => x.ImagenIds)
            .Must(ids => ids.Distinct().Count() == ids.Count)
            .WithMessage("La lista de orden tiene ids repetidos.");
    }
}

public sealed class ReordenarImagenesCommandHandler
    : IRequestHandler<ReordenarImagenesCommand, Result>
{
    private readonly IImagenRepository _imagenes;

    public ReordenarImagenesCommandHandler(IImagenRepository imagenes) => _imagenes = imagenes;

    public async Task<Result> Handle(ReordenarImagenesCommand request, CancellationToken ct)
    {
        await _imagenes.ReordenarAsync(request.InmuebleId, request.ImagenIds, ct);
        return Result.Success();
    }
}

// ── Texto alternativo (RF-094) ───────────────────────────────────────────────

public sealed record EditarTextoAltCommand(long InmuebleId, long ImagenId, string? TextoAlt)
    : IRequest<Result>;

public sealed class EditarTextoAltCommandValidator : AbstractValidator<EditarTextoAltCommand>
{
    public EditarTextoAltCommandValidator() => RuleFor(x => x.TextoAlt).MaximumLength(150);
}

public sealed class EditarTextoAltCommandHandler : IRequestHandler<EditarTextoAltCommand, Result>
{
    private readonly IImagenRepository _imagenes;

    public EditarTextoAltCommandHandler(IImagenRepository imagenes) => _imagenes = imagenes;

    public async Task<Result> Handle(EditarTextoAltCommand request, CancellationToken ct)
    {
        var imagen = await _imagenes.GetByIdAsync(request.ImagenId, ct);

        if (imagen is null || imagen.InmuebleId != request.InmuebleId)
        {
            throw new KeyNotFoundException($"Imagen {request.ImagenId} no encontrada en este inmueble.");
        }

        imagen.EditarTextoAlt(request.TextoAlt);
        await _imagenes.ActualizarTextoAltAsync(request.ImagenId, imagen.TextoAlt, ct);

        return Result.Success();
    }
}

// ── Eliminar imagen (RF-090) ─────────────────────────────────────────────────

public sealed record EliminarImagenCommand(long InmuebleId, long ImagenId) : IRequest<Result>;

public sealed class EliminarImagenCommandHandler : IRequestHandler<EliminarImagenCommand, Result>
{
    private readonly IImagenRepository _imagenes;
    private readonly IAlmacenamientoObjetos _almacenamiento;

    public EliminarImagenCommandHandler(
        IImagenRepository imagenes, IAlmacenamientoObjetos almacenamiento)
    {
        _imagenes = imagenes;
        _almacenamiento = almacenamiento;
    }

    public async Task<Result> Handle(EliminarImagenCommand request, CancellationToken ct)
    {
        var imagen = await _imagenes.GetByIdAsync(request.ImagenId, ct);

        if (imagen is null || imagen.InmuebleId != request.InmuebleId)
        {
            throw new KeyNotFoundException($"Imagen {request.ImagenId} no encontrada en este inmueble.");
        }

        var storageKey = await _imagenes.DeleteAsync(request.ImagenId, ct);

        // La fila se borra primero. Si el borrado en el bucket falla, queda un
        // objeto huérfano —barato y recuperable por la regla de ciclo de vida—
        // mientras que el orden inverso dejaría una fila apuntando a nada.
        if (storageKey is not null)
        {
            await _almacenamiento.EliminarObjetoAsync(storageKey, ct);
        }

        return Result.Success();
    }
}
