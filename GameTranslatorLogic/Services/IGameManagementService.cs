namespace GameTranslatorLogic.Services;

public interface IGameManagementService
{
    Task<(bool isSucces, string Message)> InstallTranlsation(string gameName, string gameFolder);
    Task<(bool isSucces, string Message)> ExecuteLaunch(string fullPath);
}