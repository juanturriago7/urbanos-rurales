using System.Text;
using System.Xml.Linq;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Application.Features.Inmuebles.Queries.GetSitemapEntradas;

namespace Portal.Api.Controllers;

/// <summary>
/// SEO técnico: sitemap.xml dinámico y robots.txt (RNF-051).
/// robots.txt bloquea el panel admin para no indexarlo (RNF-024).
/// </summary>
[ApiController]
[Route("api")]
[AllowAnonymous]
public sealed class SeoController : ControllerBase
{
    private static readonly XNamespace Ns = "http://www.sitemaps.org/schemas/sitemap/0.9";

    private readonly IMediator _mediator;
    private readonly IConfiguration _configuration;

    public SeoController(IMediator mediator, IConfiguration configuration)
    {
        _mediator = mediator;
        _configuration = configuration;
    }

    private string BaseUrl =>
        (_configuration["Frontend:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');

    /// <summary>Sitemap dinámico: home, búsqueda y fichas publicadas.</summary>
    [HttpGet("sitemap.xml")]
    [Produces("application/xml")]
    public async Task<IActionResult> Sitemap(CancellationToken ct)
    {
        var entradas = await _mediator.Send(new GetSitemapEntradasQuery(), ct);

        var urls = new List<XElement>
        {
            CrearUrl($"{BaseUrl}/", null, "daily", "1.0"),
            CrearUrl($"{BaseUrl}/inmuebles", null, "daily", "0.9")
        };

        urls.AddRange(entradas.Select(e =>
            CrearUrl($"{BaseUrl}/inmuebles/{e.Slug}", e.ActualizadoEn, "weekly", "0.8")));

        var documento = new XDocument(
            new XDeclaration("1.0", "utf-8", null),
            new XElement(Ns + "urlset", urls));

        return Content(
            documento.Declaration + Environment.NewLine + documento,
            "application/xml",
            Encoding.UTF8);
    }

    /// <summary>robots.txt: permite el sitio público, bloquea el panel admin (RNF-024).</summary>
    [HttpGet("/robots.txt")]
    [Produces("text/plain")]
    public IActionResult Robots()
        => Content(
            $"""
            User-agent: *
            Allow: /
            Disallow: /admin

            Sitemap: {BaseUrl}/api/sitemap.xml
            """,
            "text/plain",
            Encoding.UTF8);

    private static XElement CrearUrl(string loc, DateTime? lastMod, string changeFreq, string prioridad)
    {
        var elemento = new XElement(Ns + "url",
            new XElement(Ns + "loc", loc),
            new XElement(Ns + "changefreq", changeFreq),
            new XElement(Ns + "priority", prioridad));

        if (lastMod is not null)
        {
            elemento.Add(new XElement(Ns + "lastmod", lastMod.Value.ToString("yyyy-MM-dd")));
        }

        return elemento;
    }
}
