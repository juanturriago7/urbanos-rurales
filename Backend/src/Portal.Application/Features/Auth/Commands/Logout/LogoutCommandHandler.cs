using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Auth.Commands.Logout;

public sealed class LogoutCommandHandler : IRequestHandler<LogoutCommand, Result>
{
    private readonly IUsuarioRepository _usuarios;

    public LogoutCommandHandler(IUsuarioRepository usuarios)
    {
        _usuarios = usuarios;
    }

    public async Task<Result> Handle(LogoutCommand request, CancellationToken ct)
    {
        var usuario = await _usuarios.GetByIdAsync(request.UsuarioId, ct);

        if (usuario is not null)
        {
            usuario.RevocarRefreshToken();
            await _usuarios.UpdateAsync(usuario, ct);
        }

        // Idempotente: si el usuario no existe ya no hay sesión que cerrar.
        return Result.Success();
    }
}
