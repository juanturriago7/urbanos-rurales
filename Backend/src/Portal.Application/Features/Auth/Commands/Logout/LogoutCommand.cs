using MediatR;
using Portal.Application.Common;

namespace Portal.Application.Features.Auth.Commands.Logout;

/// <summary>
/// Logout (POST /api/auth/logout): revoca el refresh token del usuario autenticado.
/// El access token vigente expira solo (JWT stateless).
/// </summary>
public sealed record LogoutCommand(long UsuarioId) : IRequest<Result>;
