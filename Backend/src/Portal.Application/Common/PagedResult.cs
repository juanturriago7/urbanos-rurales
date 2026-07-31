namespace Portal.Application.Common;

/// <summary>
/// Wrapper de paginación reutilizable para todas las queries de listado.
/// Los repositorios devuelven este tipo directamente desde las queries de lectura.
/// </summary>
public sealed class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = [];
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;

    public static PagedResult<T> Create(IReadOnlyList<T> items, int page, int pageSize, int totalCount)
        => new() { Items = items, Page = page, PageSize = pageSize, TotalCount = totalCount };

    public static PagedResult<T> Empty(int page, int pageSize)
        => new() { Items = [], Page = page, PageSize = pageSize, TotalCount = 0 };
}
