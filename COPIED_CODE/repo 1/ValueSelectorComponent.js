import { useState } from "react";
import "./ValueSelectorComponent.css";
import configData from "../../config/config.json"

function ValueSelectorComponent(props) {

    const handler = props.handler;

    const carConfig = props.carConfig

    const carName = props.carName;
    const type = props.type;
    const name = props.name;
    const property = props.property;
    const key = props.datakey;
    const handleChange = props.handleChange;
    const [initialValue,setInitialValue] = useState(props.value)
    
    const minInternalValue  = 0
    const maxInternalValue  = carConfig[type].maxInternalValue
    const minDisplayValue   = carConfig[type].minDisplayValue
    
    const internalValueJump = 1
    const displayValueJump  = carConfig[type].displayValueJump
    const label             = carConfig[type].label
    const changeDescription = props.changeDescription
    const description = carConfig[type].description
    const [isLocked,setIsLocked] = useState(false)

    function updateDampersValue(e){
        //document.removeEventListener("reloadEvent", handleReloadEvent, false)
        if (property == "dampers"){
            if (e.detail.datakey != key){
                let datakeyArr = e.detail.datakey.split("-");
                if (datakeyArr[0] == key.split("-")[0]){
                    if (datakeyArr[1].charAt(1) == key.split("-")[1].charAt(1)){
                        setValue(e.detail.value)
                        setDisplayValue(Math.round(((minDisplayValue+(e.detail.value*displayValueJump[0]))+Number.EPSILON)*100)/100)
                    }
                }
            }
        }
    }

    document.addEventListener("updateDampersValueEvent", updateDampersValue, false)

    function handleToggleDampersLock(e){
        //document.removeEventListener("reloadEvent", handleReloadEvent, false)
        if (property == "dampers"){
            let pos;
            if (e.detail.isFront){
                pos = "F"
            } else {
                pos = "R"
            }
            if (key.split("-")[1].charAt(1) == pos){
                setIsLocked(e.detail.lock)
            }
        }
    }

    document.addEventListener("toggleDampersLockEvent", handleToggleDampersLock, false)

    function handleReloadEvent(e){
        document.removeEventListener("reloadEvent", handleReloadEvent, false)
        setValue(initialValue)
        setDisplayValue(initialDisplayValue)
    }

    document.addEventListener("reloadEvent", handleReloadEvent, false)

    function handleChangeValueEvent(e){
        //document.removeEventListener("changeValueEvent", handleChangeValueEvent, false)
        if (type == "tyrePressure"){
            if (e.detail == 1){
                incrementComponentValue()
            } else{
                decrementComponentValue()
            }
        }
    }

    document.addEventListener("changePSIValueEvent", handleChangeValueEvent, false)

    function toFixed(num, fixed) {
        var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
        return num.toString().match(re)[0];
    }

    function round(value, precision) {
        var multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
    }

    function incrementComponentValue() {

        var internalValue = value+internalValueJump

        if (internalValue <= maxInternalValue ) {
            setValue(internalValue)
            handler(property,key,internalValue)
            if (displayValueJump.length == 1){
                if (type === "caster"){
                    let actualValue = Math.round(((minDisplayValue+(internalValue*displayValueJump[0]))+Number.EPSILON)*100)/100
                    let num = actualValue
                    num *= 10
                    let decimal = num - Math.trunc(num)
                    num /= 10
                    if (decimal>0.03){
                        num += 0.1
                    }

                    setDisplayValue(toFixed(num,1))
                }
                else{
                    setDisplayValue(Math.round(((minDisplayValue+(internalValue*displayValueJump[0]))+Number.EPSILON)*100)/100)
                }
            } 
            else{
                if (type === "tyreCompound"){
                    setDisplayValue(displayValueJump[internalValue])
                }
                else{
                    let cont = 0;
                    for (let i = 0;i<internalValue;i++){
                        cont+=displayValueJump[i];
                    }
                    setDisplayValue(minDisplayValue+cont)
                }
            }
            if (property == "dampers" && isLocked){
                handleChange(key,internalValue)
            }
        }

    }

    function decrementComponentValue() {

        var internalValue = value-internalValueJump

        if (internalValue >= minInternalValue && internalValue>=0) {
            setValue(internalValue)
            handler(property,key,internalValue)
            if (displayValueJump.length == 1){
                if (type === "caster"){
                    let actualValue = Math.round(((minDisplayValue+(internalValue*displayValueJump[0]))+Number.EPSILON)*100)/100
                    let num = actualValue
                    num *= 10
                    let decimal = num - Math.trunc(num)
                    num /= 10
                    if (decimal>0.03){ 
                        num += 0.1
                    }

                    setDisplayValue(toFixed(num,1))
                }
                else{
                    setDisplayValue(Math.round(((minDisplayValue+(internalValue*displayValueJump[0]))+Number.EPSILON)*100)/100)
                }
            }
            else{
                if (type === "tyreCompound"){
                    setDisplayValue(displayValueJump[internalValue])
                }
                else{
                    var cont = 0;
                    for (let i = 0;i<internalValue;i++){
                        cont+=displayValueJump[i];
                    }
                    setDisplayValue(minDisplayValue+cont)
                }
            }
            if (property == "dampers" && isLocked){
                handleChange(key,internalValue)
            }
        }
    }

    function handleDrag(e) {

        if (e.clientX !== 0) {
            let rect = e.currentTarget.getBoundingClientRect();
            let rectLeft = rect.left
            let rectRight = rect.right
            let width = rectRight - rectLeft

            let currentValue = width / 100 * (value / 100 * maxInternalValue) + rectLeft

            if (e.clientX > currentValue) {
                incrementComponentValue()
            }
            else {
                decrementComponentValue()
            }
        }
    }

    var initState = null;
    if (displayValueJump.length > 1){
        if (type === "tyreCompound"){
            initState = displayValueJump[props.value]
        }
        else{
            var cont = 0;
            for (let i = 0;i<props.value;i++){
                cont+=displayValueJump[i];
            }
            initState = minDisplayValue+cont
        }
    }
    else if (name == "Toe"){
        initState = round((minDisplayValue+(minDisplayValue+(props.value*displayValueJump)-minDisplayValue)),2)
    } else{
        initState = round((minDisplayValue+(minDisplayValue+(props.value*displayValueJump)-minDisplayValue)),1)
    }
    const [initialDisplayValue,setInitialDisplayValue] = useState(initState);
    
    const [displayValue,setDisplayValue] = useState(initState);
    const [value,setValue] = useState(props.value)

    return (
        <li key={"val-"+key} onMouseEnter={ () => {
            if (description!=null){
                changeDescription(description,name)
            }
            }}>
            <div key={"valsel-"+key} className="valueSelector bg-black text-white text-xl flex flex-row mx-8 my-2 hover:bg-red-500">
                <div key={"valname-"+key} className="mr-8">{name}</div>
                <div key={"valcontainer-"+key} className="flex flex-row ml-auto">
                    <div key={"valminus-"+key} className="valueSelectorMinus flex-none cursor-pointer hover:bg-white hover:text-black" onClick={() => { decrementComponentValue() }}>-&#60;</div>
                    <div key={"valinput-"+key} onDrag={handleDrag} className="valueSelectorInput cursor-col-resize select-all hover:bg-white hover:text-black">
                        <div key={"valvalue-"+key} className="">{displayValue}{label}</div>
                    </div>
                    <div key={"valplus-"+key} className="valueSelectorPlus cursor-pointer select-none hover:bg-white hover:text-black" onClick={() => { incrementComponentValue() }}>&#62;+</div>
                </div>
            </div>
        </li>
    )
}

export default ValueSelectorComponent;