import React, { useState } from "react";
import {message} from '@tauri-apps/plugin-dialog';
import { getCurrentWindow } from "@tauri-apps/api/window";

interface Game{
    name: string,
    executablePath: string,
    isTranslated?: boolean
}

interface GameCardProps{
    game: Game,
    onTranslationComplete: (path: string) => void
}

export default function GameCardItem({game, onTranslationComplete}: GameCardProps){
    const [isTranslated, setIsTranslated] = useState<boolean>(game.isTranslated || false);
    const [isInstalling, setIsInstalling] = useState<boolean>(false);
    const [isRunning, setIsRunning] = useState<boolean>(false);

    const handleInstall = async (e:React.MouseEvent) => {
        e.stopPropagation();
        setIsInstalling(true);

        try{
            const gameFolder = game.executablePath.substring(0,game.executablePath.lastIndexOf('\\'));
            const response = await fetch(`http://localhost:5073/InstallTranslation?gameName=${game.name}&gameFolder=${encodeURIComponent(gameFolder)}`, {method: 'POST'});
        
            if(response.ok){
                setIsTranslated(true);
                onTranslationComplete(game.executablePath);
            }
            else{
                const errorMessage = await response.json();
                await message(errorMessage.detail);
            }
        }
        catch(error){
            console.error(error);
        }
        finally{
            setIsInstalling(false);
        }
    }

    const handleLaunch = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const bottle = localStorage.getItem('bottleName') || 'Gaming';
        setIsRunning(true);

        try{
            const response = await fetch(`http://localhost:5073/LaunchGame?fullPath=${encodeURIComponent(game.executablePath)}&bottle=${encodeURIComponent(bottle)}`, {method: 'GET'});
            
            if(response.ok){
                console.log("Launching " + game.name);
                const wantsToMinimize = JSON.parse(localStorage.getItem('minimizeOnLaunch') || 'false');

                if(wantsToMinimize === true){
                    const appWindow = getCurrentWindow();
                    await appWindow.minimize();
                }
            }
            else{
                const errorMessage = await response.text();
                await message(`Game not translated yet..\n${errorMessage}`)
            }
        }
        catch(error){
            console.log(error);
        }
        finally{
            setIsRunning(false);
        }
    }

    return (
        <div className={`GameCard ${isTranslated ? "translated" : "not-translated"}`}>
            <img className="GameCover" src={`/assets/img/${game.name}.png`} alt={game.name} />
            <div className={`CardActions ${isTranslated ? "translated" : ""}`}>
                {isTranslated ? (
                    isRunning ? (
                        <button style={{color:"#d1d5db", border: "none", backgroundColor: "transparent"}} disabled={true}>Running...</button>
                    ) : (
                        <button className="btn-launch" onClick={handleLaunch}>Launch</button>
                    )
                ) : (
                    <button className="btn-translate" onClick={handleInstall} disabled={isInstalling}>
                        {isInstalling ? "Downloading Translation.. Please wait." : "Translate"}
                    </button>
                )}
            </div>
        </div>
    );
};