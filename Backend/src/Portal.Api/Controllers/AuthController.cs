using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Api.Contracts;
using Portal.Application.Features.Auth.Commands.Login;
using Portal.Application.Features.Auth.Commands.Logout;
using Portal.Application.Features.Auth.Commands.RecuperarPassword;
using Portal.Application.Features.Auth.Commands.RefreshToken;
using Portal.Application.Features.Auth.Commands.RestablecerPassword;
using Portal.Application.Features.Auth.DTOs;

namespace Portal.Api.Controllers;

/// <summary>
/// Autenticación del panel admin: login, refresh (rotación), logout y
/// recuperación de contraseña (RF-061..063, RNF-021).
/// </summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Login con correo y contraseña. Bloquea tras 5 intentos fallidos (RF-063).</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(result.Value)
            : Unauthorized(new ProblemDetails
            {
                Title = "No autorizado",
                Detail = result.Error,
                Status = StatusCodes.Status401Unauthorized
            });
    }

    /// <summary>Rota el par access/refresh token. El refresh anterior queda invalidado.</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthTokensDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);

        return result.IsSuccess
            ? Ok(result.Value)
            : Unauthorized(new ProblemDetails
            {
                Title = "No autorizado",
                Detail = result.Error,
                Status = StatusCodes.Status401Unauthorized
            });
    }

    /// <summary>Cierra la sesión del usuario autenticado (revoca su refresh token).</summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var usuarioId = User.GetUsuarioId();

        if (usuarioId is not null)
        {
            await _mediator.Send(new LogoutCommand(usuarioId.Value), ct);
        }

        return NoContent();
    }

    /// <summary>Solicita un token de recuperación (RF-062). Siempre responde 202 (anti-enumeración).</summary>
    [HttpPost("recuperar-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> RecuperarPassword(
        [FromBody] RecuperarPasswordCommand command, CancellationToken ct)
    {
        await _mediator.Send(command, ct);
        return Accepted();
    }

    /// <summary>Consume el token de recuperación y fija la nueva contraseña.</summary>
    [HttpPost("restablecer-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RestablecerPassword(
        [FromBody] RestablecerPasswordCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);

        return result.IsSuccess
            ? NoContent()
            : BadRequest(new ProblemDetails
            {
                Title = "Solicitud inválida",
                Detail = result.Error,
                Status = StatusCodes.Status400BadRequest
            });
    }
}
