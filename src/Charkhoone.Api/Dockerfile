# syntax=docker/dockerfile:1.7

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Directory.Build.props Directory.Packages.props global.json ./
COPY src ./src

RUN dotnet restore src/Charkhoone.Api/Charkhoone.Api.csproj
RUN dotnet publish src/Charkhoone.Api/Charkhoone.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
ARG VCS_REF=unknown
LABEL org.opencontainers.image.source="https://github.com/mahdimarzooghi4-debug/charkhoone" \
      org.opencontainers.image.revision="$VCS_REF" \
      org.opencontainers.image.title="Charkhoone API"

WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish ./

USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Charkhoone.Api.dll"]
