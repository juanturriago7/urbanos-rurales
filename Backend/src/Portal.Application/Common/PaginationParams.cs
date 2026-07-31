namespace Portal.Application.Common;

/// <summary>
/// Parámetros de paginación estándar. Las Queries de listado incluyen esto.
/// </summary>
public record PaginationParams(int Page = 1, int PageSize = 20)
{
    public int Skip => (Page - 1) * PageSize;
    public const int MaxPageSize = 100;

    public PaginationParams WithClamp() =>
        new(Math.Max(1, Page), Math.Clamp(PageSize, 1, MaxPageSize));
}
