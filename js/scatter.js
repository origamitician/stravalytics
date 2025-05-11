var MINIMUM_EXTREME = -1
var MAXIMUM_EXTREME = 4294967296
// is a global variable because functions outside of renderScatterPlot need access to it.
let regressionType = null;
let calibCoefficients = [];
let refArray = [];

function getNumberOfColons(str) {
    let colonNum = 0;
    for (let i = 0; i < str.length; i++) {
        if(str.substring(i, i+1) === ":") {
            colonNum++;
        }
    }
    return colonNum;
}


// add event listeners to be able to show/hide the variables in scatter plot
let variablesToggled = []

function renderVariableDisplay() {
    variablesToggled.forEach((item, index) => {
        if (item) {
            document.getElementsByClassName('scatterSettingsHolderSection')[index].style.display = "block"
            document.getElementsByClassName('scatterPropHolder')[index].style.backgroundColor = "rgba(16, 168, 0, 0.25)";
            document.getElementsByClassName('scatterArrow')[index].style.transform="rotate(90deg)";
        } else {
            document.getElementsByClassName('scatterSettingsHolderSection')[index].style.display = "none"
            document.getElementsByClassName('scatterPropHolder')[index].style.backgroundColor = "white";
            
            document.getElementsByClassName('scatterArrow')[index].style.transform="rotate(0)";
        }
    })
}

function toggleVariableDisplay(id) {
    variablesToggled[id] = !variablesToggled[id];
    renderVariableDisplay();
}


for (let i = 0; i < document.getElementsByClassName('scatterInputLabelsFlex').length; i++) {
    variablesToggled.push(false)
    document.getElementsByClassName('scatterInputLabelsFlex')[i].addEventListener('click', () => {toggleVariableDisplay(i)})
}

// render the appearance of the variables
renderVariableDisplay()

//variable names that are referenced by the values of the dropdown.
const variableDisplay = [
    {value: 'distance', display: 'Distance', placeholder: 'Distance (mi)', unit: 'mi', displayDecimalPoints: 2, predDecimalPoints: 2}, 
    {value: 'time', display: 'Moving Time', placeholder: 'h:mm:ss / mm:ss', unit: '', displayDecimalPoints: 0, predDecimalPoints: 0},
    {value: 'elapsedTime', display: 'Elapsed Time', placeholder: 'h:mm:ss / mm:ss', unit: '', displayDecimalPoints: 0, predDecimalPoints: 0},
    {value: 'uptime', display: 'Uptime', placeholder: '% uptime (0-100)', unit: "%", displayDecimalPoints: 2, predDecimalPoints: 2},
    {value: 'elevation', display: 'Elevation Gain', placeholder: 'Gain (ft)', unit: "ft", displayDecimalPoints: 2, predDecimalPoints: 2},
    {value: 'incline', display: 'Incline', placeholder: '% incline', unit: "%", displayDecimalPoints: 3, predDecimalPoints: 3},
    {value: 'pace', display: 'Pace', placeholder: 'm:ss', unit: "/mi", displayDecimalPoints: 2, predDecimalPoints: 2},
    {value: 'kudos', display: 'Kudos', placeholder: '# kudos', unit: "", displayDecimalPoints: 0, predDecimalPoints: 2},
    {value: 'maxPace', display: 'Maximum Pace', placeholder: 'm:ss', unit: "/mi", displayDecimalPoints: 2, predDecimalPoints: 2},
    {value: 'cadence', display: 'Cadence', placeholder: 'steps per min', unit: "steps/min", displayDecimalPoints: 1, predDecimalPoints: 2},
    {value: 'stepsPerMile', display: 'Steps / mile', placeholder: 'steps per mile', unit: "", displayDecimalPoints: 0, predDecimalPoints: 2},
    {value: 'strideLength', display: 'Stride length', placeholder: 'length in ft', unit: "ft", displayDecimalPoints: 3, predDecimalPoints: 3},
    {value: 'totalSteps', display: 'Steps taken', placeholder: '', unit: "", displayDecimalPoints: 0, predDecimalPoints: 2},
]

variableDisplay.forEach(e => {
    e.defaultMinimum = MAXIMUM_EXTREME
    e.userMinimum = -1
    e.defaultMaximum = -1
    e.userMaximum = MAXIMUM_EXTREME
})

function getVariableDisplayInfo(value, index) {
    for(let i = 0; i < variableDisplay.length; i++) {
        if (variableDisplay[i].value === value) {
            if (index) {
                return i
            } else {
                return variableDisplay[i]
            }
        }
    }
    return {};
}

function processStringToValue(val){
    let resultantString;
    if (val.includes(":")) {
        const breakPoint = val.indexOf(":");
        if (getNumberOfColons(val) === 1) {
            resultantString = parseFloat(val.substring(0, breakPoint))*60 
            + parseFloat(val.substring(breakPoint+1))
        } else if (getNumberOfColons(val) === 2) {
            const secondBreakPoint = val.substring(breakPoint + 1).indexOf(":") + breakPoint + 1;
            resultantString = parseFloat(val.substring(0, breakPoint))*3600 
            + parseFloat(val.substring(breakPoint+1, secondBreakPoint))*60 
            + parseFloat(val.substring(secondBreakPoint+1)) 
        }
    } else if (val.includes("-") && val.substring(0, 1) != "-") {
        resultantString = Date.parse(val) / 1000
    } else {
        resultantString = parseFloat(val)
    }
    return resultantString;
}

function processValueToString(val, prop) {
    if (prop == 'pace' || prop == 'elapsedTime' || prop == 'time' || prop == 'maxPace') {
        return convert(parseFloat(val))
    } else {
        return parseFloat(val).toFixed(getVariableDisplayInfo(prop).displayDecimalPoints)
    }
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
  
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

let minZ = 9223372036854775807;
let maxZ = -1;

function showScatterActivity(property1, property2, tertiaryProp, id){
    const index = Number(id.split('_')[0])
    const color = id.split('_')[2]

    document.getElementById("scatter_" + index).style.opacity = 0.7;

    let variableXInfo = variableDisplay[getVariableDisplayInfo(property1, true)]
    let variableYInfo = variableDisplay[getVariableDisplayInfo(property2, true)]

    let leftMargin = ((refArray[index][property1] - variableXInfo.userMinimum) / (variableXInfo.userMaximum - variableXInfo.userMinimum))*100
    let bottomMargin = ((refArray[index][property2] - variableYInfo.userMinimum) / (variableYInfo.userMaximum - variableYInfo.userMinimum))*100

    predictionDiv = document.getElementById('predictionDiv')
    predictionDiv.style.display = 'block';
    predictionDiv.style.border = '4px solid ' + color
    predictionDiv.style.bottom = Number(bottomMargin) + 5 + "%"
    predictionDiv.style.left= Number(leftMargin) + 2 + "%"
    document.getElementById('clickToSeeMore').style.display = "block";

    document.getElementById('predictionTxtX').innerHTML = "> " + getVariableDisplayInfo(property1).display + ": <b>" + processPredictionIntoReadableForm(property1, refArray[index][property1], getVariableDisplayInfo(property1).unit) + "</b>";
    document.getElementById('predictionTxtY').innerHTML = "> " + getVariableDisplayInfo(property2).display + ": <b>" + processPredictionIntoReadableForm(property2, refArray[index][property2], getVariableDisplayInfo(property2).unit) + "</b>"; 
    document.getElementById('predictionRunTitle').innerHTML = refArray[index].name
    if (tertiaryProp) {
        if (refArray[index][tertiaryProp] != null) {
            document.getElementById('predictionTxtZ').innerHTML = "> " + getVariableDisplayInfo(tertiaryProp).display + ": <b>" + processPredictionIntoReadableForm(tertiaryProp, refArray[index][tertiaryProp], getVariableDisplayInfo(tertiaryProp).unit) + "</b>"; 
        } else {
            document.getElementById('predictionTxtZ').innerHTML = "> No info available for " + getVariableDisplayInfo(tertiaryProp).display.toLowerCase()
        }

        document.getElementById('predictionTxtZ').style.color = color;
        document.getElementById('predictionTxtZ').style.display = "block";
    } else {
        document.getElementById('predictionTxtZ').style.display = "none";
    }
}

function renderScatterplot(arr, prop1, prop2, tertiaryProp, changedVariable){
    document.getElementsByName("xInput")[0].value = "";
    document.getElementsByName("yInput")[0].value = "";
    let variableXInfo = variableDisplay[getVariableDisplayInfo(prop1, true)]
    let variableYInfo = variableDisplay[getVariableDisplayInfo(prop2, true)]
    document.getElementById("scatterPlotTitle").innerHTML = variableXInfo.display + " (" + variableXInfo.unit + ") vs " + variableYInfo.display + " (" + variableYInfo.unit + ")"
    document.getElementById("scatterYAxisTitle").innerHTML = variableYInfo.display + " (" + variableYInfo.unit + ")"
    document.getElementById("scatterXAxisTitle").innerHTML = variableXInfo.display + " (" + variableXInfo.unit + ")"
    if (tertiaryProp){
        let variableZInfo = variableDisplay[getVariableDisplayInfo(tertiaryProp, true)]
        document.getElementById("scatterZAxisTitle").innerHTML = variableZInfo.display
    }

    refArray = [];
    var paras = document.getElementsByClassName('plot');

    while(paras[0]) {
        paras[0].parentNode.removeChild(paras[0]);
    }

    paras = document.getElementsByClassName('scatterGrid');
    while(paras[0]) {
        paras[0].parentNode.removeChild(paras[0]);
    }

    // constraint variables to filter out by.
    let bottomX
    let topX
    let bottomY
    let topY
    let bottomZ
    let topZ
    let variableZInfo;

    if (document.getElementsByName('xAxisMin')[0].value != "") {
        variableXInfo.userMinimum = processStringToValue(document.getElementsByName('xAxisMin')[0].value)
    } else if (!changedVariable || !changedVariable.includes(1)) {
        // default back 
        variableXInfo.userMinimum = MINIMUM_EXTREME
    }
    
    if (document.getElementsByName('xAxisMax')[0].value != "") {
        variableXInfo.userMaximum = processStringToValue(document.getElementsByName('xAxisMax')[0].value)
    } else if (!changedVariable || !changedVariable.includes(1)) {
        variableXInfo.userMaximum = MAXIMUM_EXTREME
    }
    
    if (document.getElementsByName('yAxisMin')[0].value != "") {
        variableYInfo.userMinimum = processStringToValue(document.getElementsByName('yAxisMin')[0].value)
    } else if (!changedVariable || !changedVariable.includes(2)) {
        variableYInfo.userMinimum = MINIMUM_EXTREME
    }
    
    if (document.getElementsByName('yAxisMax')[0].value != "") {
        variableYInfo.userMaximum = processStringToValue(document.getElementsByName('yAxisMax')[0].value)
    } else if (!changedVariable || !changedVariable.includes(2)) {
        variableYInfo.userMaximum = MAXIMUM_EXTREME
    }

    if (tertiaryProp) {
        variableZInfo = variableDisplay[getVariableDisplayInfo(tertiaryProp, true)]
        if (document.getElementsByName('zAxisMin')[0].value != "") {
            variableZInfo.userMinimum = processStringToValue(document.getElementsByName('zAxisMin')[0].value)
        } else if (!changedVariable || !changedVariable.includes(3)) {
            variableZInfo.userMinimum = MINIMUM_EXTREME
        }
        
        if (document.getElementsByName('zAxisMax')[0].value != "") {
            variableZInfo.userMaximum = processStringToValue(document.getElementsByName('zAxisMax')[0].value)
        } else if (!changedVariable || !changedVariable.includes(3)) {
            variableZInfo.userMaximum = MAXIMUM_EXTREME
        }
        bottomZ = variableZInfo.userMinimum
        topZ = variableZInfo.userMaximum
    }

    bottomX = variableXInfo.userMinimum
    topX = variableXInfo.userMaximum
    bottomY = variableYInfo.userMinimum
    topY = variableYInfo.userMaximum
    
    const array = [];

    let toleranceX;
    let toleranceY;
    if(prop1 == 'pace' || prop1 == 'elapsedTime' || prop1 == 'time' || prop1 == 'maxPace'){
        toleranceX = 1; // to the nearest second
    } else {
        toleranceX = 0.01; //to the nearest 0.01 unit
    }

    if(prop2 == 'pace' || prop2 == 'elapsedTime' || prop2 == 'time' || prop2 == 'maxPace'){
        toleranceY = 1; // to the nearest second
    } else {
        toleranceY = 0.01; //to the nearest 0.01 unit
    }

    arr.forEach(i => {
        const item = {...i};
        item.startDate = Date.parse(item.startDate) / 1000

        // if the x variable is unfiltered (happens when analyzing a variable for the first time - the default maximums and minimums are not set.)
        if(item[prop1]!=null && item[prop1] < variableXInfo.defaultMinimum && variableXInfo.userMinimum == MINIMUM_EXTREME){
            variableXInfo.defaultMinimum = item[prop1]
        }else if(item[prop1]!=null && item[prop1] > variableXInfo.defaultMaximum && variableXInfo.userMaximum == MAXIMUM_EXTREME){
            variableXInfo.defaultMaximum = item[prop1]
        }

        // if the y variable is unfiltered (happens when analyzing a variable for the first time - the default maximums and minimums are not set.)
        if(item[prop2]!=null && item[prop2] < variableYInfo.defaultMinimum && variableYInfo.userMinimum == MINIMUM_EXTREME){
            variableYInfo.defaultMinimum= item[prop2]
        }else if(item[prop2]!=null && item[prop2] > variableYInfo.defaultMaximum && variableYInfo.userMaximum == MAXIMUM_EXTREME){
            variableYInfo.defaultMaximum = item[prop2]
        }

        if((item[prop1] >= bottomX || Math.abs(item[prop1] - bottomX) <= toleranceX) && 
        (item[prop1] <= topX || Math.abs(item[prop1] - topX) <= toleranceX) && 
        (item[prop2] >= bottomY || Math.abs(item[prop2] - bottomY) <= toleranceY) && 
        (item[prop2] <= topY || Math.abs(item[prop2] - topY) <= toleranceY)){
            array.push({...item})
            refArray.push({...item})
        }
    })

    // enable placeholders when the initial scatterplot is drawn.
    const var1Info = getVariableDisplayInfo(prop1)
    const var2Info = getVariableDisplayInfo(prop2)
    document.getElementsByName('xInput')[0].placeholder = var1Info.placeholder
    document.getElementsByName('yInput')[0].placeholder = var2Info.placeholder
    document.getElementsByClassName('xPredictionVarName')[0].innerHTML = var1Info.display.toLowerCase() + "(x)";
    let unprocessed1Info= var1Info.display.toLowerCase()

    if (var1Info.unit) {
        unprocessed1Info += (" (" + var1Info.unit + ")")
    }

    document.getElementsByClassName('xPredictionVarName')[1].innerHTML = unprocessed1Info
    document.getElementsByClassName('yPredictionVarName')[0].innerHTML = var2Info.display.toLowerCase() + "(y)";
    let unprocessed2Info= var2Info.display.toLowerCase()
    if (var2Info.unit) {
        unprocessed2Info += (" (" + var2Info.unit + ")")
    }
    document.getElementsByClassName('yPredictionVarName')[1].innerHTML = unprocessed2Info;

    const fixedArray = [];
    const regressionArray = [];
    array.forEach(item => {
        if(item[prop1] != null && item[prop2] != null && item[prop1] != null && item[prop2] !=null) {
            if(tertiaryProp) {
                fixedArray.push({x: item[prop1], y: item[prop2], z: item[tertiaryProp]})
            } else {
                fixedArray.push({x: item[prop1], y: item[prop2]})
            }

            if(tertiaryProp && item[tertiaryProp] != null) {
                if(item[tertiaryProp] < variableZInfo.defaultMinimum && variableZInfo.userMinimum == MINIMUM_EXTREME){
                    variableZInfo.defaultMinimum = item[tertiaryProp]
                }else if(item[tertiaryProp] > variableZInfo.defaultMaximum && variableZInfo.userMaximum == MAXIMUM_EXTREME){
                    variableZInfo.defaultMaximum = item[tertiaryProp]
                }
            }
        }
    })

    /* autocomplete if fields are blank */
    if (document.getElementsByName('xAxisMin')[0].value == "") {
        const bool = (variableXInfo.userMinimum == MINIMUM_EXTREME)
        document.getElementsByName('xAxisMin')[0].value = bool ? processValueToString(variableXInfo.defaultMinimum, prop1) : processValueToString(variableXInfo.userMinimum, prop1)
        bottomX = bool ? variableXInfo.defaultMinimum : variableXInfo.userMinimum
        variableXInfo.userMinimum = bool ? variableXInfo.defaultMinimum : variableXInfo.userMinimum
    }

    if (document.getElementsByName('xAxisMax')[0].value == "") {
        const bool = (variableXInfo.userMaximum == MAXIMUM_EXTREME)
        document.getElementsByName('xAxisMax')[0].value = bool ? processValueToString(variableXInfo.defaultMaximum, prop1) : processValueToString(variableXInfo.userMaximum, prop1)
        topX = bool ? variableXInfo.defaultMaximum : variableXInfo.userMaximum
        variableXInfo.userMaximum = bool ? variableXInfo.defaultMaximum : variableXInfo.userMaximum
    }
    
    if (document.getElementsByName('yAxisMin')[0].value == "") {
        const bool = (variableYInfo.userMinimum == MINIMUM_EXTREME)
        document.getElementsByName('yAxisMin')[0].value = bool ? processValueToString(variableYInfo.defaultMinimum, prop2) : processValueToString(variableYInfo.userMinimum, prop2)
        bottomY = bool ? variableYInfo.defaultMinimum : variableYInfo.userMinimum
        variableYInfo.userMinimum = bool ? variableYInfo.defaultMinimum : variableYInfo.userMinimum
    }

    if (document.getElementsByName('yAxisMax')[0].value == "") {
        const bool = (variableYInfo.userMaximum == MAXIMUM_EXTREME)
        document.getElementsByName('yAxisMax')[0].value = bool ? processValueToString(variableYInfo.defaultMaximum, prop2) : processValueToString(variableYInfo.userMaximum, prop2)
        topY = bool ? variableYInfo.defaultMaximum : variableYInfo.userMaximum
        variableYInfo.userMaximum = bool ? variableYInfo.defaultMaximum : variableYInfo.userMaximum
    }

    if (tertiaryProp) {
        if (document.getElementsByName('zAxisMin')[0].value == "") {
            const bool = (variableZInfo.userMinimum == MINIMUM_EXTREME)
            document.getElementsByName('zAxisMin')[0].value = bool ? processValueToString(variableZInfo.defaultMinimum, tertiaryProp) : processValueToString(variableZInfo.userMinimum, tertiaryProp)
            bottomZ = bool ? variableZInfo.defaultMinimum : variableZInfo.userMinimum
            variableZInfo.userMinimum = bool ? variableZInfo.defaultMinimum : variableZInfo.userMinimum
        }
    
        if (document.getElementsByName('zAxisMax')[0].value == "") {
            const bool = (variableZInfo.userMaximum == MAXIMUM_EXTREME)
            document.getElementsByName('zAxisMax')[0].value = bool ? processValueToString(variableZInfo.defaultMaximum, tertiaryProp) : processValueToString(variableZInfo.userMaximum, tertiaryProp)
            topZ = bool ? variableZInfo.defaultMaximum : variableZInfo.userMaximum
            variableZInfo.userMaximum = bool ? variableZInfo.defaultMaximum : variableZInfo.userMaximum
        }

        document.getElementById('spectrumDiv').style.display = 'block';
        document.getElementById('spectrum').style.background = 'linear-gradient(to right, ' + document.getElementsByName('scatterColor1')[0].value + ', ' + document.getElementsByName('scatterColor2')[0].value + ')'
        if(tertiaryProp == 'pace' || tertiaryProp == 'elapsedTime' || tertiaryProp == 'time' || tertiaryProp == 'maxPace'){
            // yDisplay.innerHTML = convert(maxY - i*(((maxY - minY) / verticalIncrement))).split('.')[0]
            document.getElementById('spectrumLowerBound').innerHTML = convert(parseFloat(bottomZ))
            document.getElementById('spectrumUpperBound').innerHTML = convert(parseFloat(topZ))
        } else {
            document.getElementById('spectrumLowerBound').innerHTML = parseFloat(bottomZ).toFixed(2)
            document.getElementById('spectrumUpperBound').innerHTML = parseFloat(topZ).toFixed(2)
        }
    } else {
        document.getElementById('spectrumDiv').style.display = 'none';
    }

    // convert everything into a float
    bottomX = parseFloat(bottomX);
    topX = parseFloat(topX);
    bottomY = parseFloat(bottomY);
    topY = parseFloat(topY);

    const verticalIncrement = document.getElementsByName('incrementsY')[0].value;
    const horizontalIncrement = document.getElementsByName('incrementsX')[0].value;

    // draw the grid.

    for(let i = 0; i < verticalIncrement; i++){
        for(let j = 0; j < horizontalIncrement; j++){
            let grid = document.createElement('div');
            grid.className = 'scatterGrid';
            const txt = getComputedStyle(document.getElementById('scatterPlot')).height
            const height = parseFloat(txt.substring(0, txt.length - 2))
            grid.style.height = (height / verticalIncrement) + "px"
            grid.style.width = 100 / horizontalIncrement + '%'
            grid.style.top = i * (height / verticalIncrement) + "px"
            grid.style.left = j * ( 100 / horizontalIncrement) + '%'

            if( j == 0) {
                // add the vertical signs
                let yDisplay = document.createElement('p');
                yDisplay.className = 'yScatterDisplay';
                if(prop2 == 'pace' || prop2 == 'elapsedTime' || prop2 == 'time' || prop2 == 'maxPace'){
                    yDisplay.innerHTML = convert(topY - i*(((topY - bottomY) / verticalIncrement))) + "&nbsp;&nbsp;&nbsp;"
                } else {
                    yDisplay.innerHTML = (topY - i*(((topY - bottomY) / verticalIncrement))).toFixed(variableYInfo.displayDecimalPoints) + "&nbsp;&nbsp;&nbsp;"
                }
                
                grid.append(yDisplay)
            }

            if( i == verticalIncrement - 1) {
                // add the vertical signs
                let xDisplay = document.createElement('p');
                xDisplay.className = 'xScatterDisplay';
                if(prop1 == 'pace' || prop1 == 'elapsedTime' || prop1 == 'time' || prop1 == 'maxPace'){
                    xDisplay.innerHTML = convert(bottomX + (j+1)*(((topX - bottomX) / horizontalIncrement)))
                } else {
                    xDisplay.innerHTML = (bottomX + (j+1)*(((topX - bottomX) / horizontalIncrement))).toFixed(variableXInfo.displayDecimalPoints);
                }
                grid.append(xDisplay)
            }
            document.getElementById('scatterPlot').appendChild(grid)
        }
    }

    for(var i = 0; i < fixedArray.length; i++){
        regressionArray.push([fixedArray[i].x, fixedArray[i].y])
        const plot = document.createElement('p');
        plot.className = 'plot';
        plot.style.left = ((fixedArray[i].x - bottomX) / (topX - bottomX))*100 + '%';
        plot.style.bottom = ((fixedArray[i].y - bottomY) / (topY- bottomY))*100 -3 + '%';

        if(tertiaryProp) {
            // if user selects a tertiary prop
            if (fixedArray[i].z == null) {
                plot.style.backgroundColor = "grey";
            } else if (fixedArray[i].z < bottomZ) {
                plot.style.backgroundColor = document.getElementsByName('scatterColor1')[0].value
            } else if (fixedArray[i].z > topZ) {
                plot.style.backgroundColor = document.getElementsByName('scatterColor2')[0].value
            } else {
                const clr1 = hexToRgb(document.getElementsByName('scatterColor1')[0].value)
                const clr2 = hexToRgb(document.getElementsByName('scatterColor2')[0].value)
                const red = (clr1.r + (clr2.r - clr1.r) * ((fixedArray[i].z - bottomZ) / (topZ - bottomZ)))
                const green = (clr1.g + (clr2.g - clr1.g) * ((fixedArray[i].z - bottomZ) / (topZ - bottomZ)))
                const blue = (clr1.b + (clr2.b - clr1.b) * ((fixedArray[i].z - bottomZ) / (topZ - bottomZ)))
                const gradientClr = 'rgb(' + red + ', ' + green + ', ' + blue + ')'
                plot.style.backgroundColor = gradientClr;
            }
        } else {
            plot.style.backgroundColor = document.getElementsByName('plotColor')[0].value
        }
        plot.id = "scatter_" + i;
        const id = i+"_activity_"+plot.style.backgroundColor
        plot.addEventListener('mouseover', () => showScatterActivity(prop1, prop2, tertiaryProp, id))
        // plot.addEventListener('mouseover', () => showPrediction(prop1, prop2, newID))
        
        plot.addEventListener('mouseout', hidePrediction)
        plot.style.height = document.getElementsByName('plotSize')[0].value + "px";
        plot.style.width = document.getElementsByName('plotSize')[0].value + "px";
        plot.style.position = "absolute";
        plot.style.transform = "translate(-50%, -50%)";
        document.getElementById('scatterPlot').appendChild(plot)
    }

    let maxRSquared = -2;
    let calib;

    // draw the trendline/trendcurve

    calib = regression.linear(regressionArray);
    if(calib.r2 >= maxRSquared) {
        regressionType = 'linear';
        maxRSquared = calib.r2;
        calibCoefficients = calib.equation
    }

    calib = regression.polynomial(regressionArray, { order: 2 });
    if(calib.r2 >= maxRSquared) {
        regressionType = 'parabolic';
        maxRSquared = calib.r2;
        calibCoefficients = calib.equation
    }

    calib = regression.exponential(regressionArray);
    if(calib.r2 >= maxRSquared) {
        regressionType = 'exponential';
        maxRSquared = calib.r2;
        calibCoefficients = calib.equation
    }

    calib = regression.logarithmic(regressionArray);
    if(calib.r2 >= maxRSquared) {
        regressionType = 'logarithmic';
        maxRSquared = calib.r2;
        calibCoefficients = calib.equation
    }

    calib = regression.power(regressionArray);
    if(calib.r2 >= maxRSquared) {
        regressionType = 'power';
        maxRSquared = calib.r2;
        calibCoefficients = calib.equation
    }

    console.log("max R squared is: " + maxRSquared)

    const coefficientArray = []; // to house negative coefficents, if needed
    for (let i = 0; i < calibCoefficients.length; i++) {
        if(calibCoefficients[i] < 0 || i == 0) {
            coefficientArray[i] = calibCoefficients[i].toFixed(2)
        } else {
            // never put a "+" before the first term.
            coefficientArray[i] = "+" + calibCoefficients[i].toFixed(2)
        }
    }

    const equation = document.getElementById("curveEquation")
    if(regressionType == 'linear') {
        equation.innerHTML = "y=" + coefficientArray[0]  + "x" + coefficientArray[1]
    }else if (regressionType == 'parabolic') {
        equation.innerHTML =  "y=" + coefficientArray[0] + "x<sup>2</sup>" + coefficientArray[1] + "x" + coefficientArray[2]
    } else if (regressionType == 'cubic') {
        equation.innerHTML =  "y=" + coefficientArray[0] + "x<sup>3</sup>" + coefficientArray[1] + "x<sup>2</sup>+" + coefficientArray[2] + "x" + coefficientArray[3]
    } else if (regressionType == 'exponential') {
        equation.innerHTML = "y=" + coefficientArray[0] + "e<sup>" + coefficientArray[1] + "x</sup>"
    } else if (regressionType == 'logarithmic') {
        equation.innerHTML = "y=" + coefficientArray[0] + coefficientArray[1] + "log(x)"
    } else if (regressionType == 'power') {
        equation.innerHTML = "y=" + coefficientArray[0] + "x<sup>" + coefficientArray[1] + "</sup>"
    }

    for (let i = 0; i < scrubbingRate; i++) {
        const calculatedX = i * ((topX - bottomX) / scrubbingRate) + bottomX
        const calculatedY = calculatePrediction(calculatedX, regressionType, calibCoefficients);

        const plot = document.createElement('p');
        plot.className = 'plot';
        const left = ((calculatedX - bottomX) / (topX - bottomX))*100
        plot.style.left = left + '%';
        const bot = ((calculatedY - bottomY) / (topY- bottomY))*100 
        plot.style.bottom = bot + '%';
        
        if(bot <= 100 && bot >= 0) {
            const newID = "prediction_" + calculatedX + '_' + calculatedY + '_' + left.toFixed(2) + '_' + bot.toFixed(2);
            plot.id = newID
            plot.style.backgroundColor = document.getElementsByName('curveColor')[0].value
            plot.style.height = document.getElementsByName('curveSize')[0].value + "px";
            plot.style.width = document.getElementsByName('curveSize')[0].value + "px";
            plot.style.position = "absolute";
            plot.style.transform = "translate(-50%, -50%)";
            plot.addEventListener('mouseover', () => showPrediction(prop1, prop2, newID))
            plot.addEventListener('mouseout', hidePrediction)
            document.getElementById('scatterPlot').appendChild(plot)
        }
    }
}

function updateScatterDrawings() {
    renderScatterplot(allActivities, document.getElementsByName('variable1')[0].value, document.getElementsByName('variable2')[0].value, document.getElementsByName('variable3')[0].value)
}

// >> to be used in a future update.
function calculatePrediction(calculatedX, regressionType, equation) {
    let calculatedY;
    if(regressionType == 'linear') {
        calculatedY = equation[0] * (calculatedX) + equation[1]
    } else if (regressionType == 'parabolic') {
        calculatedY = equation[0] * (calculatedX ** 2) + equation[1] * calculatedX + equation[2]
    } else if (regressionType == 'cubic') {
        calculatedY = equation[0] * (calculatedX ** 3) + equation[1] * (calculatedX ** 2) + equation[2] + (calculatedX) + equation[3];
    } else if (regressionType == 'exponential') {
        calculatedY = equation[0] * (Math.E ** (calculatedX * equation[1]))
    } else if (regressionType == 'logarithmic') {
        calculatedY = equation[0] + equation[1]*Math.log(calculatedX);
    } else if (regressionType == 'power') {
        calculatedY = equation[0] * (calculatedX ** equation[1]);
    }

    return calculatedY
}

function processPredictionIntoReadableForm(prop, val, unit) {
    let variableInfo = variableDisplay[getVariableDisplayInfo(prop, true)]
    // prop = property of the value (e.g. elapsed time); 
    // val = value to be processed; 
    // unit = if it should include units or not.
    let processedVal;
    if (prop == "pace" || prop == "maxPace") {
        processedVal = convert(parseFloat(val), 2)
        if (unit) {
            processedVal += unit;
        }
    } else if (prop == "elapsedTime" || prop == "time") {
        processedVal = convert(parseFloat(val));
    } else {
        processedVal = parseFloat(val).toFixed(variableInfo.displayDecimalPoints);
        if (unit) {
            processedVal += (" " + unit);
        }
    }

    return processedVal;
}

// >> when the curve of best fit is hovered. To be used in a future update.
function showPrediction(property1, property2, id){ 
    const breakdown = id.split('_')
    // id is in the form of prediction_<xvalue>_<yvalue>_<xPosOnCanvas>_<yPosOnCanvas>

    const predictionDiv = document.getElementById('predictionDiv');
    predictionDiv.style.display = 'block';
    predictionDiv.style.bottom = parseFloat(breakdown[4]) + 5 + "%"
    predictionDiv.style.left= parseFloat(breakdown[3]) + 2 + "%"
    predictionDiv.style.border = '4px solid ' + document.getElementsByName("curveColor")[0].value

    document.getElementById('predictionRunTitle').innerHTML = "[Prediction]"
    document.getElementById('predictionTxtX').innerHTML = "> " + getVariableDisplayInfo(property1).display + ": " + processPredictionIntoReadableForm(property1, breakdown[1], getVariableDisplayInfo(property1).unit);
    document.getElementById('predictionTxtY').innerHTML = "> Best fit " + getVariableDisplayInfo(property2).display.toLowerCase() + ": " + processPredictionIntoReadableForm(property2, breakdown[2], getVariableDisplayInfo(property2).unit);
    document.getElementById('predictionTxtZ').style.display = "none";
    document.getElementById('clickToSeeMore').style.display = "none";
}

// when the user inputs into the x axis prediction field in an attempt to predict the y axis.
function showInputPrediction() {
    const processedXInput = parseFloat(processStringToValue(document.getElementsByName('xInput')[0].value));
    const yOutput = calculatePrediction(processedXInput, regressionType, calibCoefficients);
    const processedYOutput = processPredictionIntoReadableForm (document.getElementsByName('variable2')[0].value, yOutput); // no units added

    document.getElementsByName("yInput")[0].value = processedYOutput;
}

function hidePrediction(){
    document.getElementById('predictionDiv').style.display = 'none';
    for (index = 0; index < document.getElementsByClassName("plot").length; index++) {
        if (document.getElementById("scatter_" + index)) {
            document.getElementById("scatter_" + index).style.opacity = 1.0;
        }
    }
}

function updateScatterDrawingsInResponseToVariableChange(callerID) {
    if(callerID === 1) {
        const elem = getVariableDisplayInfo(document.getElementsByName('variable1')[0].value)
        document.getElementsByName('xAxisMax')[0].value = ''
        document.getElementsByName('xAxisMax')[0].placeholder = elem.placeholder
        document.getElementsByName('xAxisMin')[0].value = ''
        document.getElementsByName('xAxisMin')[0].placeholder = elem.placeholder
        document.getElementsByName('xInput')[0].placeholder = elem.placeholder
        document.getElementsByClassName('xPredictionVarName')[0].innerHTML = elem.display.toLowerCase() + "(x)";

        let unprocessed1Info= elem.display.toLowerCase()
        if (elem.unit) {
            unprocessed1Info += (" (" + elem.unit + ")")
        }
        document.getElementsByClassName('xPredictionVarName')[1].innerHTML = unprocessed1Info;

    } else if (callerID === 2) {
        const elem = getVariableDisplayInfo(document.getElementsByName('variable2')[0].value)
        document.getElementsByName('yAxisMin')[0].value = ''
        document.getElementsByName('yAxisMin')[0].placeholder = elem.placeholder
        document.getElementsByName('yAxisMax')[0].value = ''
        document.getElementsByName('yAxisMax')[0].placeholder = elem.placeholder
        document.getElementsByName('yInput')[0].placeholder = elem.placeholder
        document.getElementsByClassName('yPredictionVarName')[0].innerHTML = elem.display.toLowerCase() + "(y)";

        let unprocessed2Info= elem.display.toLowerCase()
        if (elem.unit) {
            unprocessed2Info += (" (" + elem.unit + ")")
        }
        document.getElementsByClassName('yPredictionVarName')[1].innerHTML = unprocessed2Info;

    } else if (callerID === 3) {
        document.getElementsByName('zAxisMin')[0].value = ''
        document.getElementsByName('zAxisMin')[0].placeholder = getVariableDisplayInfo(document.getElementsByName('variable3')[0].value).placeholder
        document.getElementsByName('zAxisMax')[0].value = ''
        document.getElementsByName('zAxisMax')[0].placeholder = getVariableDisplayInfo(document.getElementsByName('variable3')[0].value).placeholder
    }
    renderScatterplot(allActivities, document.getElementsByName('variable1')[0].value, document.getElementsByName('variable2')[0].value, document.getElementsByName('variable3')[0].value, [callerID])
}

