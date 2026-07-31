using System.Security.Cryptography;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Interfaces;

namespace Portal.Application.Features.Auth.Commands.RecuperarPassword;

/// <summary>
/// Genera un token de un solo uso (1 hora de vigencia) y lo envía por correo.
/// Siempre responde éxito, exista o no el correo, para evitar enumeración de usuarios.
/// </summary>
public sealed class RecuperarPasswordCommandHandler
    : IRequestHandler<RecuperarPasswordCommand, Result>
{
    private static readonly TimeSpan VigenciaToken = TimeSpan.FromHours(1);

    private readonly IUsuarioRepository _usuarios;
    private readonly IPasswordResetTokenRepository _resetTokens;
    private readonly ICorreoService _correo;

    public RecuperarPasswordCommandHandler(
        IUsuarioRepository usuarios,
        IPasswordResetTokenRepository resetTokens,
        ICorreoService correo)
    {
        _usuarios = usuarios;
        _resetTokens = resetTokens;
        _correo = correo;
    }

    public async Task<Result> Handle(RecuperarPasswordCommand request, CancellationToken ct)
    {
        var usuario = await _usuarios.GetByCorreoAsync(request.Email, ct);

        if (usuario is not null && usuario.Activo)
        {
            var token = Convert.ToHexStringLower(RandomNumberGenerator.GetBytes(32));

            await _resetTokens.InvalidarPendientesAsync(usuario.Id, ct);
            await _resetTokens.CreateAsync(
                usuario.Id, TokenHasher.Sha256(token), DateTime.UtcNow.Add(VigenciaToken), ct);

            await _correo.EnviarAsync(
                usuario.Correo,
                "Recuperación de contraseña — Portal Inmobiliario",
                $"""
                Hola {usuario.Nombre},

                Recibimos una solicitud para restablecer tu contraseña.
                Usa este token en el formulario de restablecimiento (vigencia: 1 hora, un solo uso):

                {token}

                Si no solicitaste el cambio, ignora este correo.
                """,
                ct);
        }

        return Result.Success();
    }
}
