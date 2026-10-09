using GameTranslatorLogic.Models;
using GameTranslatorLogic.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient();


builder.Services.AddOpenApi();
builder.Services.AddCors();

var supportedGames = builder.Configuration.GetSection("SupportedGames").Get<Dictionary<string, string>>() ?? new Dictionary<string, string>();
builder.Services.AddSingleton(supportedGames);

builder.Services.AddScoped<IGameDiscoveryService, GameDiscoveryService>();
builder.Services.AddScoped<IGameManagementService, GameManagementService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(options => options.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

app.UseHttpsRedirection();

app.MapPost("/InstallTranslation", async (string gameName, string gameFolder, IGameManagementService gameManagementService) =>
{
    var result = await gameManagementService.InstallTranlsation(gameName, gameFolder);
    return !result.isSucces ? Results.Problem(result.Message) : Results.Ok(result.Message);
});

app.MapGet("/LaunchGame", async (string fullPath, IGameManagementService gameManagementService) =>
{
    var result = await gameManagementService.ExecuteLaunch(fullPath);
    return !result.isSucces ?  Results.Problem(result.Message) : Results.Ok(result.Message);
});

app.MapGet("/DetectGameByPath", (string path,IGameDiscoveryService gameDiscoveryService) =>
{
    var game = gameDiscoveryService.AddGame(path);
    return game == null ? Results.NotFound("No Translations detected for the selected game or path is invalid") : Results.Ok(game);
});

app.MapGet("/SteamGames", (IGameDiscoveryService gameDiscoveryService) =>
{
    var games = gameDiscoveryService.FindSteamGames();
    return games.Count == 0 ?  Results.NotFound("No supported games found on Steam") : Results.Ok(games);
});

app.MapGet("/EpicGames", (IGameDiscoveryService  gameDiscoveryService) =>
{
    var games = gameDiscoveryService.FindEpicGames();
    return games.Count == 0 ? Results.NotFound("No supported games found on Epic Games") : Results.Ok(games);
});

app.MapPost("/VerifyManualGames", (List<Game> gamesList,  IGameDiscoveryService gameDiscoveryService) =>
{
    var verifiedGames = gameDiscoveryService.VerifyGames(gamesList);
    return Results.Ok(verifiedGames);
});

app.Run();