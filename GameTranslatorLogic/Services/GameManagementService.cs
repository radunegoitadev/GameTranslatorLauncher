using System.Diagnostics;
using System.IO.Compression;

namespace GameTranslatorLogic.Services;

public class GameManagementService(IHttpClientFactory httpClientFactory) : IGameManagementService
{
    public async Task<(bool isSucces, string Message)> InstallTranlsation(string gameName, string gameFolder)
    {
        var formatedGameName = gameName.Replace(" ", "%20");
        var githubUrl = $"https://github.com/iamradubtwsss-ui/Translations/raw/refs/heads/main/{formatedGameName}.zip";
        var httpClient =  httpClientFactory.CreateClient();

        var tempZip = Path.Combine(Path.GetTempPath(), $"{gameName}.zip");

        try
        {
            var response = await httpClient.GetByteArrayAsync(githubUrl);
            await File.WriteAllBytesAsync(tempZip, response);
        
            await ZipFile.ExtractToDirectoryAsync(tempZip, gameFolder, overwriteFiles:true);
        
            File.Delete(tempZip);

            var markerFile = File.Exists(Path.Combine(gameFolder, "ro_installed.txt"));

            return !markerFile ? (false, "The Translation is coruppted please try again later") : (true, "Installed Translation to the Game Folder");
        }
        catch (Exception e)
        {
            return (false, e.Message);
        }
    }

    public async Task<(bool isSucces, string Message)> ExecuteLaunch(string fullPath)
    {
        if (string.IsNullOrWhiteSpace(fullPath))
        {
            return (false, "Enter a valid path");
        }

        try
        {
            var gameFolder = Path.GetDirectoryName(fullPath);
            var exeName = Path.GetFileName(fullPath);
            var allowedGames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "EldenRing.exe",
                "HogwartsLegacy.exe"
            };

            if (!allowedGames.Contains(exeName))
            {
                return(false, $"The selected game is not in our Translated Games List, {exeName}");
            }

            var startInfo = new ProcessStartInfo
            {
                FileName = fullPath,
                WorkingDirectory = gameFolder,
                UseShellExecute = true
            };

            using var process = new Process();
            process.StartInfo = startInfo;
            process.EnableRaisingEvents = true;

            process.Start();
            await process.WaitForExitAsync();

            return(true, "Game Launched Successfully");
        }
        catch (Exception e)
        {
            return (false, $"Error: {e}");
        }
    }
}