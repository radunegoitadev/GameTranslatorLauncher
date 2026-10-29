using GameTranslatorLogic.Models;

namespace GameTranslatorLogic.Services;

public interface IGameDiscoveryService
{
    List<object> FindSteamGames();
    List<object> FindEpicGames();
    Game? AddGame(string path);
    List<Game> VerifyGames(List<Game> games);
    TranslationListGame[] GetSupportedGames(Dictionary<string, string> gamesNames);
}