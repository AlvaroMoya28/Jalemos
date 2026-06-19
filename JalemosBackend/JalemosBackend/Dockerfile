


FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:8.0 AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
   clang zlib1g-dev 
ARG configuration=Development
WORKDIR /src
COPY ["JalemosBackend/JalemosBackend/JalemosBackend.csproj", "JalemosBackend/JalemosBackend/"]
RUN dotnet restore "JalemosBackend/JalemosBackend/JalemosBackend.csproj"
COPY . .
WORKDIR "/src/JalemosBackend/JalemosBackend"
RUN dotnet build "JalemosBackend.csproj" -c $configuration -o /app/build

FROM build AS publish
ARG configuration=Development
RUN dotnet publish "JalemosBackend.csproj" -c $configuration -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/runtime-aspnet:8.0 AS final
WORKDIR /app
EXPOSE 5000
COPY --from=publish /app/publish .
ENTRYPOINT ["./JalemosBackend"]
