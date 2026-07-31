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

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Portal.Api.dll"]
