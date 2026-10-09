namespace GameTranslatorLogic.Models;

public class Game
{
    public string Name { get; set; } = string.Empty;
    public string ExecutablePath { get; set; } = string.Empty;
    public bool IsTranslated { get; set; } = false;
}