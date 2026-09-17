FROM mcr.microsoft.com/dotnet/sdk:10.0@sha256:2fa828c68761b1b8c23d7662dc134421b9d3b59fe1425fdbc80804e390cdb24d AS build
WORKDIR /src

COPY Directory.Build.props Directory.Packages.props global.json ./
COPY src ./src

RUN dotnet restore src/Charkhoone.Worker/Charkhoone.Worker.csproj
RUN dotnet publish src/Charkhoone.Worker/Charkhoone.Worker.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/runtime:10.0@sha256:8a153b5889d796b6450295b383596b13308c24c230515f8a7770ce1b94e0c460 AS runtime
ARG VCS_REF=unknown
LABEL org.opencontainers.image.source="https://github.com/mahdimarzooghi4-debug/charkhoone" \
      org.opencontainers.image.revision="$VCS_REF" \
      org.opencontainers.image.title="Charkhoone Worker"

WORKDIR /app
COPY --from=build /app/publish ./

USER $APP_UID
ENTRYPOINT ["dotnet", "Charkhoone.Worker.dll"]
