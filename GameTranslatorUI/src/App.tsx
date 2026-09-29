import { useEffect, useState } from "react";
import "./App.css";
import { Library, Settings, Gamepad2, FileSearchCorner, Moon, Sun } from "lucide-react";
import { open,ask,message } from '@tauri-apps/plugin-dialog';
import GameCardItem from "./GameCard";
import Switch from "react-switch";
import { getCurrentWindow } from "@tauri-apps/api/window";


interface Game {
  name: string;
  executablePath: string;
  isTranslated?: boolean;
}

function App() {
  const [ActiveTab, setActiveTab] = useState("Library");
  const [Loading, setLoading] = useState(false);
  const [Games, setGames] = useState<Game[]>([]);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(() => {
    const savedWindowState = localStorage.getItem('isFullScreen');
    return savedWindowState !== null ? JSON.parse(savedWindowState) : false;
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('isDarkMode');
    return savedTheme !== null ? JSON.parse(savedTheme) : true;
  });
  const [isBrowsing, setIsBrowsing] = useState<boolean>(false);
  const [minimizeOnLaunch, setMinimizeOnLaunch] = useState<boolean>(() => {
    const saved = localStorage.getItem('isMinimized');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [bottleName, setBottleName] = useState<string>(() => {
    const saved = localStorage.getItem('bottleName');
    return saved !== null ? saved : "Gaming";
  });
  const [isLinux, setIsLinux] = useState<boolean>(false);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:5073/SteamGames");
        let steamGames: Game[] = [];

        if (response.ok) {
          steamGames = await response.json();
        }

        const savedManualGames = JSON.parse(localStorage.getItem('manualGames') || '[]');
        let verifiedManualGames = savedManualGames;

        if(savedManualGames.length > 0){
          const verifyResponse = await fetch(`http://localhost:5073/VerifyManualGames`, {method: "POST", headers: {"Content-Type": "application/json"},body: JSON.stringify(savedManualGames)}); 
        
          if (verifyResponse.ok){
            verifiedManualGames = await verifyResponse.json();
          }
        }

        setGames([...steamGames, ...verifiedManualGames]);
        localStorage.setItem('manualGames', JSON.stringify(verifiedManualGames));
        
      } catch (error) {
        console.error("Failed to connect", error);
        setGames(JSON.parse(localStorage.getItem('manualGames') || '[]'));
      } finally {
        setLoading(false);
      }
    };

    if (isFullScreen){
      const applyFullScreen = async () => {
        try{
          const appWindow = getCurrentWindow();
          await appWindow.setFullscreen(true);
        }
        catch(error){
          console.error(error);
        }
      };
      applyFullScreen();
    }

    const handleIsLinux = async () => {
      const isLinuxResponse = await fetch(`http://localhost:5073/IsLinux`);
      const data = await isLinuxResponse.json();
      setIsLinux(data.isLinux);
    }

    handleIsLinux();
    fetchGames();
  }, []);

  const Browse = async () => {
    setIsBrowsing(true);

    try{
      const selected = await open({
        multiple: false,
        title: 'Add Game',
        filters: [{
          name: 'Executable',
          extensions: ['exe']
        }]
      });

      if(selected !== null){
        await VerifyGame(selected as string);
      }
      else{
        console.log(selected);
      }
    }
    catch(error){
      console.error(error);
    }
    finally{
      setIsBrowsing(false);
    }
  };

  const VerifyGame = async (gamePath: string) => {

    if(gamePath === '' || !gamePath){
      await message("Please select a valid .exe file");
      return;
    }

    try{
      const response = await fetch(`http://localhost:5073/DetectGameByPath?path=${encodeURIComponent(gamePath)}`)

      if(response.ok){
        const data = await response.json();
        const isAlreadyInLibrary = Games.some(game => game.executablePath === data.executablePath);

        if (isAlreadyInLibrary){
          await message(`${data.game} is already in library!`);
          return;
        }
        const userWantsToAdd = await ask(`Found Translation for ${data.game}. Add to library?`);

        if(userWantsToAdd){

          const newGame = { name:data.game, executablePath:data.executablePath, isTranslated:data.isTranslated};
          setGames((prevGames) => [...prevGames, newGame]);

          const savedManualGames = JSON.parse(localStorage.getItem('manualGames') || '[]');
          savedManualGames.push(newGame);
          localStorage.setItem('manualGames', JSON.stringify(savedManualGames));

          await message(`Added Game ${data.game}`);
        }
      }
      else{
        const errorMessage = await response.json();
        await message(errorMessage.message);
      }
    }
    catch(error){
      console.error(error);
    }
  }

  const handleFullScreenToggle = async (checked: boolean) => {
    setIsFullScreen(checked);
    localStorage.setItem('isFullScreen', JSON.stringify(checked));

    try{
      const appWindow = getCurrentWindow();
      await appWindow.setFullscreen(checked);
    }
    catch(error){
      console.error("Error at FullScreen toggle:", error);
    }
  };

  const markAsTranslated = async (executablePath: string) => {
    setGames((prevGames) =>
      prevGames.map((game) => 
        game.executablePath === executablePath
        ? {...game, isTranslated: true} : game
      )
    );

    const savedManualGames = JSON.parse(localStorage.getItem('manualGames') || '[]');
    const updatedManualGames = savedManualGames.map((game : Game) =>
      game.executablePath === executablePath
        ? {...game, isTranslated: true}
        : game
    );
    localStorage.setItem('manualGames', JSON.stringify(updatedManualGames)); 
  };

  const handleThemeToggle = async (checked: boolean) => {
    setIsDarkMode(checked);
    localStorage.setItem('isDarkMode', JSON.stringify(checked));
  };

  const handleMinimizeToggle = async (checked: boolean) => {
    setMinimizeOnLaunch(checked);
    localStorage.setItem('minimizeOnLaunch', JSON.stringify(checked));
  }

  const handleBottleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBottleName(e.target.value);
    localStorage.setItem('bottleName', e.target.value);
  }

  return (
    <div className={`Container ${!isDarkMode ? "light-mode" : ""}`}>
      <div className="Menu">
        <ul>
          <li
            onClick={() => {
              setActiveTab("Library");
            }}
            className={ActiveTab === "Library" && !isBrowsing ? "active" : ""}
          >
            <Library size={30} />
          </li>
          <li
            onClick={() => {
              Browse();
            }}
            className={isBrowsing ? "active" : ""}
          >
            <FileSearchCorner size={30} />
          </li>
          <li
            onClick={() => {
              setActiveTab("SupportedGames");
            }}
            className={ActiveTab === "SupportedGames" && !isBrowsing ? "active" : ""}
          >
            <Gamepad2 size={30} />
          </li>
          <li
            onClick={() => {
              setActiveTab("Settings");
            }}
            className={ActiveTab === "Settings" && !isBrowsing ? "active" : ""}
          >
            <Settings size={30} />
          </li>
        </ul>
      </div>

      <div className="MainWindow">
        {ActiveTab === "Library" && (
          <div className="Content">
            <h2>Library</h2>
            {Loading ? (
              <p>Scanning for games, Please Wait..</p>
            ) : (
              <div className="GamesGrid">
                {Games.map((game, index) => (
                  <GameCardItem key={index} game={game} onTranslationComplete={markAsTranslated} />
                ))}
              </div>
            )}
          </div>
        )}
        {ActiveTab === "SupportedGames" && (
          <div className="Content">
            <h2>Supported Games</h2>
          </div>
        )}
        {ActiveTab === "Settings" && (
          <div className="Content">
            <h2>Settings</h2>
            <div className="SettingsItems">
              <div className="EachSetting">
                <span>FullScreen Mode</span>
                <Switch
                checked={isFullScreen}
                onChange={handleFullScreenToggle}
                onColor="#28a745"
                offColor="#3f4147"
                uncheckedIcon={false}
                checkedIcon={false}
                height={24}
                width={48}
                />
              </div>
              <div className="EachSetting">
                <span>Theme</span>
                <Switch
                checked={isDarkMode}
                onChange={handleThemeToggle}
                onColor="#000"
                offColor="#eee"
                uncheckedIcon={
                  <div className="Moon">
                    <Moon size={14} color="black" />
                  </div>
                }
                checkedIcon={
                  <div className="Sun">
                    <Sun size={14} color="white" />
                  </div>
                }
                height={24}
                width={48}
                />
              </div>
              <div className="EachSetting">
                <span>Minimize on Game launch</span>
                <Switch
                checked={minimizeOnLaunch}
                onChange={handleMinimizeToggle}
                onColor="#28a745"
                offColor="#3f4147"
                uncheckedIcon={false}
                checkedIcon={false}
                height={24}
                width={48}
                />
              </div>
              {
                isLinux && (
                  <div className="EachSetting">
                    <span>Bottle Name</span>
                    <input type="text"
                    value={bottleName}
                    placeholder="e.g. Gaming"
                    onChange={handleBottleChange}
                    className="BottleInput"
                    />
                  </div>
                )
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;