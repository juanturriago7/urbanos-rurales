# ─── Build stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["src/Portal.Api/Portal.Api.csproj",            "Portal.Api/"]
COPY ["src/Portal.Application/Portal.Application.csproj", "Portal.Application/"]
COPY ["src/Portal.Infrastructure/Portal.Infrastructure.csproj", "Portal.Infrastructure/"]
COPY ["src/Portal.Domain/Portal.Domain.csproj",      "Portal.Domain/"]

RUN dotnet restore "Portal.Api/Portal.Api.csproj"

COPY src/ .

RUN dotnet publish "Portal.Api/Portal.Api.csproj" \
    -c Release -o /app/publish --no-restore

# ─── Migrator stage ───────────────────────────────────────────────────────────
# Imagen de un solo uso para aplicar migraciones EF contra un ambiente remoto
# (ver deploy/docker-compose.staging.yml, servicio "migrator"). Solo se usa en
# el ambiente de pruebas: en producción las migraciones se aplican a mano
# (ver CLAUDE.md).
FROM build AS migrator
RUN dotnet tool install --global dotnet-ef --version 10.0.0
ENV PATH="$PATH:/root/.dotnet/tools"
ENTRYPOINT ["dotnet", "ef", "database", "update", \
    "--project", "Portal.Infrastructure", \
    "--startup-project", "Portal.Api", \
    "--context", "PortalDbContext"]

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Portal.Api.dll"]
