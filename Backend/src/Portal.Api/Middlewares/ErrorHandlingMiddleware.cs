using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Text.Json;

namespace Portal.Api.Middlewares;

/// <summary>
/// Middleware centralizado de manejo de errores.
/// Transforma excepciones en respuestas ProblemDetails (RFC 7807).
/// Siempre se registra primero en el pipeline.
/// </summary>
public sealed class ErrorHandlingMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // El cliente cerró la conexión antes de que terminara la respuesta.
            // No es un error — es comportamiento normal del browser (navegación,
            // refetch, cierre de pestaña). Se registra a nivel Debug para no
            // contaminar los logs de errores reales.
            _logger.LogDebug("Petición cancelada por el cliente: {Path}", context.Request.Path);

            // 499 es el código no oficial que usan nginx/cloudflare para "client closed request".
            // No escribimos body porque la conexión ya se cerró.
            context.Response.StatusCode = 499;
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning("Validación fallida: {Errors}", ex.Errors);
            await WriteProblemAsync(context, HttpStatusCode.BadRequest, "Validation Error",
                errors: ex.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }));
        }
        catch (UnauthorizedAccessException)
        {
            await WriteProblemAsync(context, HttpStatusCode.Unauthorized, "Unauthorized");
        }
        catch (KeyNotFoundException ex)
        {
            await WriteProblemAsync(context, HttpStatusCode.NotFound, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error no controlado");
            await WriteProblemAsync(context, HttpStatusCode.InternalServerError,
                "An unexpected error occurred.");
        }
    }

    private static async Task WriteProblemAsync(
        HttpContext context,
        HttpStatusCode status,
        string detail,
        object? errors = null)
    {
        context.Response.StatusCode  = (int)status;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = (int)status,
            Title  = status.ToString(),
            Detail = detail,
            Instance = context.Request.Path
        };

        if (errors is not null)
            problem.Extensions["errors"] = errors;

        var json = JsonSerializer.Serialize(problem, JsonOptions);
        await context.Response.WriteAsync(json);
    }
}
