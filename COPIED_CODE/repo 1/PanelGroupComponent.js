import "./PanelGroupComponent.css";
import PanelComponent from "../PanelComponent/PanelComponent";
import downloadImg from '../../resources/download-button.svg';
import shareImg from '../../resources/share-button.svg';
import reloadImg from '../../resources/reload.svg'
import { useState } from "react";
import PopUpPanelComponent from "../PopUpPanelComponent/PopUpPanelComponent";
import configData from "../../config/config.json"
import FetchErrorComponent from "../FetchErrorComponent/FetchErrorComponent";
import LoaderComponent from "../LoaderComponent/LoaderComponent";

function PanelGroupComponent(props) {

    const setup     = props.setup
    const carConfig = props.carConfig
    const positions = ["LF","RF","LR","RR"]


    const [popUpOn,setPopUpOn]           = useState(false)
    const [content,setContent]           = useState("")
    const [isSharePopUp,setIsSharePopUp] = useState(false)
    const [setupId,setSetupId]           = useState("");
    const [isErrorPopUpOn,setIsErrorPopUpOn] = useState(false)
    const [isLoading,setIsLoading] = useState(false)

    const [itemDescription,setItemDescription] = useState(null)
    const [sectionDescription,setSectionDescription] = useState(configData.sections.Tyres.description)
    const [functionName,setFunctionName] = useState("Tyres")
    const [type,setType] = useState(null)
    const setupName = props.setupName

    function changeDescription(description,name){
        setItemDescription(description)
        setType(name)
    }

    function togglePopUp(){
        if (popUpOn){
            document.getElementById("panelGroupRoot").style.filter="";
            setPopUpOn(false)
        } 
        else {
            document.getElementById("panelGroupRoot").style.filter="brightness(0.5)";
            setPopUpOn(true)
        }
    }

    function handleError(){
        setIsLoading(false)
        setIsErrorPopUpOn(true)
      }

    function buildSetup(share){
        
        let builtSetup = new Object()
        builtSetup.carName = setup.carName
        builtSetup.basicSetup = new Object()
        builtSetup.advancedSetup = new Object()
        builtSetup.basicSetup.tyres=tyres
        builtSetup.basicSetup.alignment=alignment
        builtSetup.basicSetup.electronics=electronics
        builtSetup.basicSetup.strategy=strategy
        builtSetup.advancedSetup.mechanicalBalance=mechanicalBalance
        builtSetup.advancedSetup.dampers=dampers
        builtSetup.advancedSetup.aeroBalance=aeroBalance
        builtSetup.advancedSetup.drivetrain=drivetrain
        builtSetup.trackBopType=setup.trackBopType
        if (share){
            builtSetup.setupName=setupName
        }
        return JSON.stringify(builtSetup)
    }

 async function shareSetup(){
        var url = process.env.REACT_APP_PROXY+process.env.REACT_APP_API_PREFIX+"/saveSetup";
        fetch(url,{
            method:"post",
            body:buildSetup(true),
                headers: {
                    "Content-Type": "application/json"
                }
            }
        ).then(res => {
            if (res.status == 500){
                handleError()
            } 
            else{
                return res.text()
            }
        })
        .then(res => {
            if (res!=null){
                setSetupId(res)
                setContent(window.location.href.split("?")[0].split("#")[0]+"?setup="+res)
                setIsLoading(false)
                setIsSharePopUp(true)
                togglePopUp()
            }
        }).catch((error)=>handleError())
        setIsLoading(true)
    }

    async function saveSetup(){
        const a = document.createElement('a');
        let fileName = setupName != null ? setupName:setup.carName
        a.download = fileName+".json";
        const blob = new Blob([buildSetup(false)],{type : 'application/json'});
        a.href = URL.createObjectURL(blob);
        a.addEventListener('click', (e) => {
          setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
        });
        a.click();
        setContent("save")
        setIsSharePopUp(false)
        togglePopUp();
    }

    function openPanel(name) {
        if (name != functionName){
            setFunctionName(name)
            setItemDescription(null)
            setType(null)
            setSectionDescription(configData.sections[name].description)
            document.getElementsByClassName("red-bg")[0].classList.add("hover:bg-red-400");
            document.getElementsByClassName("red-bg")[0].classList.remove("red-bg");
            document.getElementById(name+"_button").classList.add("red-bg");
            document.getElementById(name+"_button").classList.remove("hover:bg-red-400");
            document.dispatchEvent(new CustomEvent('displayEvent',{detail:name}));
        }
    }


    function resetSetup() {
        document.dispatchEvent(new CustomEvent('reloadEvent',{detail:setup}));
    }

    function addNewPitStrategy(){
        let stratArray = strategy.pitStrategy
        stratArray.push({
            fuelToAdd: 0,
            tyres:
            {
                tyreCompound: 0,
                tyrePressure: [0, 0, 0, 0]
            },
            tyreSet: 0,
            frontBrakePadCompound: 0,
            rearBrakePadCompound: 0
        })
        strategy = {...strategy,"pitStrategy":stratArray}
    }

    function updateValues(type,property,value){
        let position = null
        let stratIndex = null
        let subType = null;
        if (type.includes(".")){
            let arr = type.split(".")
            type = arr[0]
            subType = arr[1]
        }
        if (property.includes("|")){
            let arr = property.split("|")
            stratIndex = arr[0]
            property = arr[1]
        }
        if (property.includes("-")){
            let arr = property.split("-")
            position = arr[1]
            property = arr[0]
        }
        switch(type){
            case "tyres":{
                if (position != null){
                    let pos = positions.indexOf(position)
                    let newArr = tyres[property]
                    newArr[pos] = value
                    value = newArr
                }
                tyres = {...tyres,[property] : value}
                break;
            }
            case "alignment":{
                if (position != null){
                    let pos = positions.indexOf(position)
                    let newArr = alignment[property]
                    newArr[pos] = value
                    value = newArr
                }
                alignment = {...alignment,[property] : value}
                break;
            }
            case "electronics":{
                electronics = {...electronics,[property] : value}
                break;
            }
            case "strategy":{
                if (stratIndex != null){
                    let strat = strategy.pitStrategy[stratIndex];
                    if (subType!= null && subType == "tyres"){
                        let tyreStrat = strat.tyres
                        if (position != null){
                            let pos = positions.indexOf(position)
                            let newArr = tyreStrat[property]
                            newArr[pos] = value
                            value = newArr
                        }
                        tyreStrat = {...tyreStrat,[property] : value}
                        strat = {...strat,"tyres" : tyreStrat}
                    }
                    else{
                        strat = {...strat,[property] : value}}
                    let strat1 = strategy.pitStrategy
                    strat1[stratIndex] = strat
                    strategy = {...strategy,"pitStrategy":strat1}
                }
                else{
                    strategy = {...strategy,[property] : value}
                }
                break;
            }
            case "mechanicalBalance":{
                mechanicalBalance = {...mechanicalBalance,[property] : value}
                break;
            }
            case "dampers":{
                if (position != null){
                    let pos = positions.indexOf(position)
                    let newArr = dampers[property]
                    newArr[pos] = value
                    value = newArr
                }
                dampers = {...dampers,[property] : value}
                break;
            }
            case "aeroBalance":{
                if (property.includes("_")){
                    let arr = property.split("_")
                    property = arr[0]
                    let pos = arr[1]
                    let newArr;
                    switch(property){
                        case "brakeDuct":
                            newArr = aeroBalance.brakeDuct
                            
                            break
                        case "rideHeight":
                            newArr = aeroBalance.rideHeight
                    }
                    newArr[pos] = value
                    value = newArr;
                }
                aeroBalance = {...aeroBalance,[property] : value}
                break;
            }
            case "drivetrain":{
                drivetrain = {...drivetrain,[property] : value}
                break;
            }
        }
    }

    var drivetrain = setup.advancedSetup.drivetrain;
    var aeroBalance = setup.advancedSetup.aeroBalance;
    var dampers = setup.advancedSetup.dampers
    var mechanicalBalance = setup.advancedSetup.mechanicalBalance
    var strategy = setup.basicSetup.strategy
    var electronics = setup.basicSetup.electronics
    var tyres = setup.basicSetup.tyres
    var alignment = setup.basicSetup.alignment

    /*var setup = {
        carName: carName,
        basicSetup:
        {
            tyres: tyres,
            alignment: alignment,
            electronics: electronics,
            strategy: strategy
        },
        advancedSetup:
        {
            mechanicalBalance: mechanicalBalance,
            dampers: dampers,
            aeroBalance: aeroBalance,
            drivetrain: drivetrain
        },
        trackBopType: 27
    }*/

    return (
        <div className="flex flex-row">
            {popUpOn?<PopUpPanelComponent handler={togglePopUp} setupId={setupId} content={content} isSharePopUp={isSharePopUp}/>:""}
            {isErrorPopUpOn?<FetchErrorComponent handler={setIsErrorPopUpOn}/>:""}
            {isLoading?<LoaderComponent />:""}
            <div id="panelGroupRoot" className="flex-grow">
                
                <div id="Panels">
                    <div className="flex flex-row mt-5 mb-10">
                    <div className="flex flex-row content-center bg-black">
                        <button id="Tyres_button"           className="max-2xl:text-xl tablinks text-white mx-5 text-3xl red-bg hover:bg-red-400" onClick={() => openPanel("Tyres")}>TYRES</button>
                        <button id="Electronics_button"     className="max-2xl:text-xl tablinks text-white mx-5 text-3xl hover:bg-red-400" onClick={() => openPanel("Electronics")}>ELECTRONICS</button>
                        <button id="Strategy_button"        className="max-2xl:text-xl tablinks text-white mx-5 text-3xl hover:bg-red-400" onClick={() => openPanel("Strategy")}>STRATEGY</button>
                        <button id="Mechanical grip_button" className="max-2xl:text-xl tablinks text-white mx-5 text-3xl hover:bg-red-400" onClick={() => openPanel("Mechanical grip")}>MECHANICAL GRIP</button>
                        <button id="Dampers_button"         className="max-2xl:text-xl tablinks text-white mx-5 text-3xl hover:bg-red-400" onClick={() => openPanel("Dampers")}>DAMPERS</button>
                        <button id="Aero_button"            className="max-2xl:text-xl tablinks text-white mx-5 text-3xl hover:bg-red-400" onClick={() => openPanel("Aero")}>AERO</button>
                    </div>
                        <div className="flex flex-row max-2xl:hidden">
                            <button onClick={() => saveSetup()} className="text-3xl bg-red-600 self-center rounded-full mx-3 animate-bounce hover:bg-red-400"><img src={downloadImg} className="h-12 m-1"/></button>
                            <button onClick={() => shareSetup()} className="text-3xl bg-red-600 self-center rounded-full mx-3 animate-bounce hover:bg-red-400"><img src={shareImg}className="h-12 m-1"/></button>
                            <button onClick={() => resetSetup()} className="text-3xl mx-3 h-[fit-content] bg-white rounded-full hover:bg-red-400"><img src={reloadImg} className="h-8 m-3"/></button>
                        </div>
                    </div>
                    <div className="flex flex-row 2xl:hidden mt-5">
                            <button onClick={() => saveSetup()} className="text-3xl bg-red-600 self-center rounded-full mx-3 animate-bounce hover:bg-red-400"><img src={downloadImg} className="h-12 m-1"/></button>
                            <button onClick={() => shareSetup()} className="text-3xl bg-red-600 self-center rounded-full mx-3 animate-bounce hover:bg-red-400"><img src={shareImg}className="h-12 m-1"/></button>
                            <button onClick={() => resetSetup()} className="text-3xl mx-3 h-[fit-content] bg-white rounded-full hover:bg-red-400"><img src={reloadImg} className="h-8 m-3"/></button>
                    </div>

                    <PanelComponent key="tyrespanel" setup={props.setup} carConfig={carConfig} className="PanelComponent" name="Tyres" id="tyres" displayFromStart={true} handler={updateValues} changeDescription={changeDescription}/>
                    <PanelComponent key="electronics" setup={props.setup} carConfig={carConfig} className="PanelComponent" name="Electronics" id="electronics" handler={updateValues} changeDescription={changeDescription}/>
                    <PanelComponent key="strategy" setup={props.setup} carConfig={carConfig} className="PanelComponent" name="Strategy" id="strategy" handler={updateValues} strategyHandler={addNewPitStrategy} changeDescription={changeDescription}/>
                    <PanelComponent key="mech_grip" setup={props.setup} carConfig={carConfig} className="PanelComponent" name="Mechanical grip" id="mech_grip" handler={updateValues} changeDescription={changeDescription}/>
                    <PanelComponent key="dampers" setup={props.setup} carConfig={carConfig} className="PanelComponent" name="Dampers" id="dampers" handler={updateValues} changeDescription={changeDescription}/>
                    <PanelComponent key="aero" setup={props.setup} carConfig={carConfig} className="PanelComponent" name="Aero" id="aero" handler={updateValues} changeDescription={changeDescription}/>
                </div>
                {!popUpOn?<div>
                    <p className="text-white fixed max-2xl:hidden 2xl:top-8 2xl:left-2 max-2xl:bottom-6 max-2xl:right-2 text-3xl m-14 max-2xl:text-xl">{setup.carName.replaceAll("_"," ").toUpperCase()}</p>
                    <button className="text-white m-8 text-3xl fixed bottom-2 left-2"><a href="/">Go back</a></button></div>:""}
        
            </div>
            <div className="w-[25vw] min-h-[80vh] bg-white self-baseline float-right flex flex-col mt-5">
                <p className="text-l font-semibold m-5">SETUP {setupName}</p>    
                <p className="text-l font-bold ml-5">{functionName}</p>
                <div className="text-s font-light text-black mx-5 mt-5">{sectionDescription}</div>
                <p className="text-l font-bold ml-5">{type}</p>
                <div className="text-s font-semibold text-black mx-5 mt-3">{itemDescription}</div>
            </div>     
        </div>
    )
}

export default PanelGroupComponent;