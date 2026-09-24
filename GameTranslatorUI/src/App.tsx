import { useEffect, useState } from "react";
import "./App.css";
import { Library, Settings, Gamepad2, FileSearchCorner } from "lucide-react";
import { open,ask,message } from '@tauri-apps/plugin-dialog';

interface Game {
  name: string;
  executablePath: string;
}

function App() {
  const [ActiveTab, setActiveTab] = useState("Library");
  const [Loading, setLoading] = useState(false);
  const [Games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:5073/SteamGames");
        const savedManualGames = JSON.parse(localStorage.getItem('manualGames') || '[]');

        if (response.ok) {
          const steamGames = await response.json();
          setGames([...steamGames, ...savedManualGames]);
        }
        else{
          setGames(savedManualGames);
        }
      } catch (error) {
        console.error("Failed to connect", error);
        setGames(JSON.parse(localStorage.getItem('manualGames') || '[]'));
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const Launch = async (gamePath: string, gameName: string) => {
    try{
      const response = await fetch(`http://localhost:5073/LaunchGame?fullPath=${encodeURIComponent(gamePath)}`, {method: 'GET'});
      if(response.ok){
        console.log("Launching " + gameName);
      }
      else{
        const errorMessage = await response.text();
        await message(`Game not translated yet..\n${errorMessage}`)
      }
    }
    catch(error){
      console.log(error);
    }
  };

  const Browse = async () => {
    setActiveTab('Browse');

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
      setActiveTab('Library');
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
          const newGame = { name:data.game, executablePath:data.executablePath};
          setGames((prevGames) => [...prevGames, newGame]);

          const savedManualGames = JSON.parse(localStorage.getItem('manualGames') || '[]');
          savedManualGames.push(newGame);
          localStorage.setItem('manualGames', JSON.stringify(savedManualGames));

          await message(`Added Game ${data.game}`);
        }
      }
      else{
        const errorMessage = await response.text();
        await message(errorMessage);
      }
    }
    catch(error){
      console.error(error);
    }
  }

  return (
    <div className="Container">
      <div className="Menu">
        <ul>
          <li
            onClick={() => {
              setActiveTab("Library");
            }}
            className={ActiveTab === "Library" ? "active" : ""}
          >
            <Library size={30} />
          </li>
          <li
            onClick={() => {
              Browse();
            }}
            className={ActiveTab === "Browse" ? "active" : ""}
          >
            <FileSearchCorner size={30} />
          </li>
          <li
            onClick={() => {
              setActiveTab("SupportedGames");
            }}
            className={ActiveTab === "SupportedGames" ? "active" : ""}
          >
            <Gamepad2 size={30} />
          </li>
          <li
            onClick={() => {
              setActiveTab("Settings");
            }}
            className={ActiveTab === "Settings" ? "active" : ""}
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
                  <div onClick={() => Launch(game.executablePath,game.name)} key={index} className="GameCard">
                    <img className="GameCover" src={`/assets/img/${game.name}.png`} alt={game.name} />
                  </div>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
