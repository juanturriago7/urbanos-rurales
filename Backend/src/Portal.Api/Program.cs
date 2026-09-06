using System.Text;
using System.Threading.RateLimiting;
using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Portal.Api.Middlewares;
using Portal.Application;
using Portal.Infrastructure;
using Scalar.AspNetCore;
using Serilog;

// ─── Bootstrap Logger (antes del build) ───────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Iniciando Portal.Api...");

    var builder = WebApplication.CreateBuilder(args);

    // ─── Serilog ──────────────────────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, services, cfg) =>
        cfg.ReadFrom.Configuration(ctx.Configuration)
           .ReadFrom.Services(services)
           .Enrich.FromLogContext()
           .WriteTo.Console()
           .WriteTo.File(
               path: "logs/portal-.log",
               rollingInterval: RollingInterval.Day,
               retainedFileCountLimit: 30));

    // ─── Application y Infrastructure (Clean Architecture DI) ────────────────
    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    // ─── JWT Authentication ───────────────────────────────────────────────────
    var jwtSection = builder.Configuration.GetSection("Jwt");
    var jwtKey = jwtSection["Key"]
        ?? throw new InvalidOperationException("JWT Key no configurada.");

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer           = true,
                ValidateAudience         = true,
                ValidateLifetime         = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer              = jwtSection["Issuer"],
                ValidAudience            = jwtSection["Audience"],
                IssuerSigningKey         = new SymmetricSecurityKey(
                                               Encoding.UTF8.GetBytes(jwtKey)),
                ClockSkew                = TimeSpan.Zero
            };
        });

    // ─── Authorization Policies por Rol ──────────────────────────────────────
    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("AdminOnly",     p => p.RequireRole("Admin"));
        options.AddPolicy("AsesorOrAdmin", p => p.RequireRole("Admin", "Asesor"));
    });

    // ─── Controllers + OpenAPI ───────────────────────────────────────────────
    builder.Services.AddControllers();
    builder.Services.AddOpenApi();

    // ─── CORS ─────────────────────────────────────────────────────────────────
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins")
                                              .Get<string[]>() ?? [];

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("FrontEnd", policy =>
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials());
    });

    // ─── Rate Limiting (anti-spam de leads por IP — RNF-023) ─────────────────
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        options.AddPolicy("leads", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "desconocida",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                }));

        // El presign es anónimo y sin ningún registro previo (no hay "lead" que
        // limitar por email/id): sin este límite, cualquiera podría generar URLs
        // de subida indefinidamente y llenar el bucket de basura.
        options.AddPolicy("postulaciones", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "desconocida",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                }));
    });

    // ─── Health Checks ────────────────────────────────────────────────────────
    builder.Services.AddHealthChecks();

    // ─── Build ────────────────────────────────────────────────────────────────
    var app = builder.Build();

    // ─── Database Seeder (usuario admin) ──────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var connectionFactory = scope.ServiceProvider.GetRequiredService<Portal.Infrastructure.Persistence.DbConnectionFactory>();
        try
        {
            using var connection = await connectionFactory.OpenAsync();
            
            // Verificar que la extensión pgcrypto esté habilitada
            await connection.ExecuteAsync("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
            
            // Crear usuario admin si no existe
            var adminInserted = await connection.ExecuteAsync(@"
                INSERT INTO usuarios (nombre, correo, password_hash, rol)
                VALUES ('Administrador Dev', 'admin@portal.local', crypt('Admin123*', gen_salt('bf', 11)), 'admin')
                ON CONFLICT (correo) DO NOTHING;
            ");
            
            if (adminInserted > 0)
            {
                Log.Information("✓ Usuario admin creado: admin@portal.local / Admin123*");
            }
            else
            {
                Log.Information("✓ Usuario admin ya existe en la base de datos");
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error al ejecutar el seeder de usuario admin");
        }
    }

    // ─── Middleware Pipeline ──────────────────────────────────────────────────
    app.UseMiddleware<ErrorHandlingMiddleware>(); // Siempre primero

    app.UseSerilogRequestLogging();
    app.UseCors("FrontEnd");
    app.UseRateLimiter();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi(); // → http://localhost:5095/openapi/v1.json
        app.MapScalarApiReference(); // → http://localhost:5095/scalar/v1
    }

    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/health");

    await app.RunAsync();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "La aplicación terminó de forma inesperada.");
    return 1;
}
finally
{
    await Log.CloseAndFlushAsync();
}

return 0;
