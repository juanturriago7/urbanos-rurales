using System.Globalization;
using System.Text;

namespace Portal.Application.Common;

/// <summary>Slugs SEO-friendly para inmuebles (RF-074 / RNF-050): minúsculas, sin acentos, guiones.</summary>
public static class SlugGenerator
{
    public static string Generar(string texto)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(texto);

        // Descompone acentos (á → a + ́) y descarta las marcas diacríticas
        var normalizado = texto.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalizado.Length);
        var anteriorGuion = false;

        foreach (var c in normalizado)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (char.IsAsciiLetterOrDigit(c))
            {
                sb.Append(c);
                anteriorGuion = false;
            }
            else if (c is 'ñ')
            {
                sb.Append('n');
                anteriorGuion = false;
            }
            else if (!anteriorGuion && sb.Length > 0)
            {
                sb.Append('-');
                anteriorGuion = true;
            }
        }

        var slug = sb.ToString().TrimEnd('-');

        return slug.Length > 150 ? slug[..150].TrimEnd('-') : slug;
    }
}
