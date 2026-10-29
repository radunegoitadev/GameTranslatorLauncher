namespace GameTranslatorLogic.Models;

public class Game
{
    public required string Name { get; set; }
    public required string ExecutablePath { get; set; }
    public bool IsTranslated { get; set; }
}