FROM mcr.microsoft.com/dotnet/sdk:10.0@sha256:2fa828c68761b1b8c23d7662dc134421b9d3b59fe1425fdbc80804e390cdb24d AS build
WORKDIR /src

COPY Directory.Build.props Directory.Packages.props global.json ./
COPY src ./src

RUN dotnet restore src/Charkhoone.Api/Charkhoone.Api.csproj
RUN dotnet publish src/Charkhoone.Api/Charkhoone.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0@sha256:6a94333d37514e385650a3c81a55e5350b67253dbe136e9cf17e499c35606a8c AS runtime
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
