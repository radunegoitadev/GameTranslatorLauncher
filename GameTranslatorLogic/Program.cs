using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(options => options.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

app.UseHttpsRedirection();

app.MapGet("/DetectGameByPath", (string path) =>
{
    if (string.IsNullOrWhiteSpace(path))
    {
        return Results.BadRequest(new {Message = "Please set a valid path"});
    }

    var supportedGames = new Dictionary<string, string>
    {
        { "Batman.exe", "Batman Vengeance" },
        { "EldenRing.exe", "Elden Ring" }
    };

    var exeName = Path.GetFileName(path);

    if (File.Exists(path) && supportedGames.TryGetValue(exeName, out var gameName))
    {
        return Results.Ok(new
        {
            Game = gameName,
            Status = "Installed",
            ExecutablePath = path
        });
    }

    return Results.NotFound(new
    {
        Message = "No Translations Detected for the selected Game",
        SearchedPath = path
    });
});

app.MapGet("/LaunchGame", (string fullPath) =>
{
    if (string.IsNullOrWhiteSpace(fullPath))
    {
        return Results.BadRequest(new {Message = "Please enter a valid game path"});
    }

    try
    {
        var gameFolder = Path.GetDirectoryName(fullPath);
        var exeName = Path.GetFileName(fullPath);
        var allowedGames = new HashSet<string>
        {
            "Batman.exe",
            "EldenRing.exe"
        };

        if (!allowedGames.Contains(exeName))
        {
            return Results.BadRequest("The selected game is not in our Translated Games List");
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = fullPath,
            WorkingDirectory = gameFolder,
            UseShellExecute = true
        };

        Process.Start(startInfo);

        return Results.Ok(new { Message = "The game run succeded" });
    }
    catch (Exception e)
    {
        return Results.Problem($"Error: {e}");
    }

});

app.MapGet("/SteamGames", () =>
{
    var supportedGames = new Dictionary<string, string>
    {
        { "Elden Ring", "eldenring.exe" },
        { "The Sims 4", "TS4_x64.exe" }
    };

    var steamPath = "";

    if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
    {
        using var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\WOW6432Node\Valve\Steam") ?? Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Valve\Steam");
        var registryPath = key?.GetValue("InstallPath")?.ToString();

        steamPath = !string.IsNullOrWhiteSpace(registryPath) ? registryPath : @"C:\Program Files (x86)\Steam";
    }
    else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
    {
        steamPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".steam", "steam");
    }
    else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
    {
        steamPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Library", "Application Support");
    }

    var vdfPath = Path.Combine(steamPath, "steamapps", "libraryfolders.vdf");
    var libraryPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    var foundGames = new List<object>();

    if (!File.Exists(vdfPath)) return Results.NotFound("No Supported Games Found on Steam");

    var vdfContent = File.ReadAllText(vdfPath);

    try
    {
        var matches = MyRegex().Matches(vdfContent);

        foreach (Match match in matches)
        {
            var cleanPath = match.Groups[1].Value.Replace(@"\\", "\\");
            libraryPaths.Add(cleanPath);
        }
    }
    catch (Exception e)
    {
        Console.WriteLine(e);
        throw;
    }

    foreach (var library in libraryPaths)
    {
        foreach (var (gameFolderName, gameExe) in supportedGames)
        {
            var gameRootPath = Path.Combine(library, "steamapps", "common", gameFolderName);
            var fullexePath = "";

            switch (gameFolderName)
            {
                case "The Sims 4":
                    fullexePath = Path.Combine(gameRootPath, "Game", "Bin", gameExe);
                    break;
                case "Elden Ring":
                    break;
            }

            if (File.Exists(fullexePath))
            {
                foundGames.Add(new
                {
                    Name = gameFolderName,
                    ExecutablePath = fullexePath
                });
            }
        }
    }

    return foundGames.Count > 0 ? Results.Ok(foundGames) : Results.NotFound("No Supported Games Found on Steam");
});

app.Run();

internal partial class Program
{
    [GeneratedRegex("\"path\"\\s+\"([^\"]+)\"")]
    private static partial Regex MyRegex();
}