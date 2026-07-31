using MediatR;
using Portal.Application.Features.Inmuebles.DTOs;

namespace Portal.Application.Features.Inmuebles.Queries.GetSitemapEntradas;

/// <summary>Slugs publicados para el sitemap dinámico (RNF-051).</summary>
public sealed record GetSitemapEntradasQuery : IRequest<IReadOnlyList<SitemapEntradaDto>>;
