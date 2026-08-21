using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;
using Portal.Domain.Entities;

namespace Portal.Application.Features.Postulaciones.Commands.CrearPostulacion;

public sealed record CrearPostulacionCommand(
    string Nombre, string Correo, string? Telefono, string? CargoInteres,
    string? Mensaje, string CvStorageKey, string CvUrl, string? IpOrigen)
    : IRequest<Result<long>>;

public sealed class CrearPostulacionCommandValidator : AbstractValidator<CrearPostulacionCommand>
{
    public CrearPostulacionCommandValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Correo).NotEmpty().EmailAddress().MaximumLength(150);
        RuleFor(x => x.Telefono).MaximumLength(30);
        RuleFor(x => x.CargoInteres).MaximumLength(120);
        RuleFor(x => x.CvStorageKey).NotEmpty();
        RuleFor(x => x.CvUrl).NotEmpty();
    }
}

public sealed class CrearPostulacionCommandHandler
    : IRequestHandler<CrearPostulacionCommand, Result<long>>
{
    private readonly IPostulacionLaboralRepository _repo;

    public CrearPostulacionCommandHandler(IPostulacionLaboralRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<long>> Handle(CrearPostulacionCommand request, CancellationToken ct)
    {
        var postulacion = new PostulacionLaboral(
            request.Nombre, request.Correo, request.Telefono, request.CargoInteres,
            request.Mensaje, request.CvStorageKey, request.CvUrl, request.IpOrigen);

        var id = await _repo.CreateAsync(postulacion, ct);
        return Result.Success(id);
    }
}
