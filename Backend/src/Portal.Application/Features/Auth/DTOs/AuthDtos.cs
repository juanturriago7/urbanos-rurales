namespace Portal.Application.Features.Auth.DTOs;

// Las formas replican el contrato que ya consume el frontend
// (FrontEndUrbanos/src/shared/types/auth.ts): { user, tokens } en login
// y { accessToken, refreshToken, expiresIn } en refresh.

public sealed record AuthUserDto(long Id, string Email, string FullName, string Role);

public sealed record AuthTokensDto(string AccessToken, string RefreshToken, int ExpiresIn);

public sealed record LoginResponseDto(AuthUserDto User, AuthTokensDto Tokens);
