import "./GamesCardStyle.css"
interface GameTranslationStatus{
    name: string,
    status: string
}
export default function GameTranslationStatusCard({name, status} : GameTranslationStatus){

 const statusCheck = () => {
     switch (status){
         case "Completed":
             return <p className={"COMPLETED"}>Complete</p>
         case "In Progress":
             return <p className={"IN PROGRESS"}>In Progress</p>
         case "Upcoming":
             return <p className={"UPCOMING"}>Upcoming</p>
     }
 }

    return (
        <div className="GameCard">
            <img className="GameCover" src={`/assets/img/${name}.png`} alt={name} />
            <div className={"TranslationInfo"}>
                {
                    statusCheck()
                }
            </div>
        </div>
    )
}