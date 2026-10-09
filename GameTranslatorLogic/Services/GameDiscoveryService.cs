using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.RegularExpressions;
using GameTranslatorLogic.Models;

namespace GameTranslatorLogic.Services;

public partial class GameDiscoveryService(Dictionary<string, string> supportedGames) : IGameDiscoveryService
{
    public Game? AddGame(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return null;
        }

        var exeName = Path.GetFileName(path);
        var translationFile = Path.Combine(Path.GetDirectoryName(path) ?? "", "ro_installed.txt");

        var isTranslated = File.Exists(translationFile);

        if (!File.Exists(path) || !supportedGames.TryGetValue(exeName, out var gameName)) return null;

        return new Game
        {
            Name = gameName,
            ExecutablePath = path,
            IsTranslated = isTranslated
        };
    }

    public List<object> FindEpicGames()
    {
        var programData = Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData);
        var epicGamesPath = Path.Combine(programData, @"Epic\\EpicGamesLauncher\\Data\\Manifests");
        var nameToExeMap = supportedGames.ToDictionary(kvp => kvp.Value, kvp => kvp.Key);
        var foundGames = new List<object>();

        if (!Directory.Exists(epicGamesPath))
        {
            return foundGames;
        }

        foreach (var item in Directory.GetFiles(epicGamesPath, "*.item"))
        {
            try
            {
                var jsonContent = File.ReadAllText(item);

                using var doc = JsonDocument.Parse(jsonContent);
                var root = doc.RootElement;

                if (!root.TryGetProperty("DisplayName", out var nameElement) ||
                    !root.TryGetProperty("InstallLocation", out var locationElement)) continue;
            
                var epicGameName = nameElement.GetString();

                if (string.IsNullOrEmpty(epicGameName) ||
                    !nameToExeMap.TryGetValue(epicGameName, out var exeName)) continue;
                    
                var installLocation = locationElement.GetString();
                        
                var fullExePath = Path.Combine(installLocation ?? "", exeName);
                var translationFile = Path.Combine(Path.GetDirectoryName(fullExePath) ?? "", "ro_installed.txt");
                var translated = File.Exists(translationFile);

                if (File.Exists(fullExePath))
                {
                    foundGames.Add(new
                    {
                        Name = epicGameName,
                        ExecutablePath = fullExePath,
                        isTranslated = translated
                    });
                }
            }
            catch (Exception)
            {
                // ignored
            }
        }

        return foundGames;
    }

    public List<object> FindSteamGames()
    {
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

            if (!File.Exists(vdfPath)) return foundGames;

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

                    var verifyTranslationFile = Path.Combine(Path.GetDirectoryName(fullexePath) ?? "", "ro_installed.txt");
                    var translated = File.Exists(verifyTranslationFile);

                    if (File.Exists(fullexePath))
                    {
                        foundGames.Add(new
                        {
                            Name = gameFolderName,
                            ExecutablePath = fullexePath,
                            isTranslated = translated
                        });
                    }
                }
            }

            return foundGames;
    }

    public List<Game> VerifyGames(List<Game> games)
    {
        foreach (var game in games)
        {
            game.IsTranslated = File.Exists(Path.Combine(Path.GetDirectoryName(game.ExecutablePath) ?? "", "ro_installed.txt"));
        }
        
        return games;
    }

    [GeneratedRegex("\"path\"\\s+\"([^\"]+)\"")]
    private static partial Regex MyRegex();
}