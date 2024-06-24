function runAnalysis() {
    let variableToAnalyze = document.getElementsByName('analysisVariable')[0].value
    let calculationMethod = document.getElementsByName('analysisVariableSetting')[0].value
    let duration = document.getElementsByName('analysisVariableDuration')[0].value
    let data;
    if (calculationMethod === "cumulative") {
        data = processAllActivitiesByDayAndProperty(allActivities, variableToAnalyze).data
    } else {
        data = processAllActivitiesByDayAndProperty(allActivities, variableToAnalyze, 10000, true).data
    }
    
    const analyzedData = [];
    // sort by week.

    const unitInfo = [
        {value: 'distance', display: 'Distance', unit: 'mi', canBeTotaled: true, totalDecimalPlaces: 2, avgDecimalPlaces: 2}, 
        {value: 'time', display: 'Moving Time', unit: '', canBeTotaled: true, decimalPlaces: 0, avgDecimalPlaces: 0},
        {value: 'elapsedTime', display: 'Elapsed Time', unit: '', canBeTotaled: true, decimalPlaces: 0, avgDecimalPlaces: 0},
        {value: 'uptime', display: 'Uptime', unit: "%", avgDecimalPlaces: 2},
        {value: 'elevation', display: 'Elevation Gain', unit: "ft", canBeTotaled: true, decimalPlaces: 1, avgDecimalPlaces: 2},
        {value: 'incline', display: 'Incline', unit: "%", avgDecimalPlaces: 3},
        {value: 'pace', display: 'Pace', unit: "/mi", avgDecimalPlaces: 2},
        {value: 'kudos', display: 'Kudos', unit: "", canBeTotaled: true, decimalPlaces: 0, avgDecimalPlaces: 2},
        {value: 'maxPace', display: 'Maximum Pace', unit: "/mi", avgDecimalPlaces: 2},
        {value: 'cadence', display: 'Cadence', unit: "steps/min", avgDecimalPlaces: 1},
        {value: 'stepsPerMile', display: 'Steps / mile', unit: "steps/mi", avgDecimalPlaces: 0},
        {value: 'strideLength', display: 'Stride length', unit: "ft", avgDecimalPlaces: 3},
    ]

    const unitValues = unitInfo.map(e => e.value)
    const currentUnitInfo = unitInfo[unitValues.indexOf(variableToAnalyze)]

    let sum = 0;
    let numberOfDaysActive = 0;
    let subData = [];
    for (let i = 0; i < data.length; i++) {
        
        let date = new Date(data[i].date)

        if ((duration === "weekly" && date.getDay() === 1) || (duration === "monthly" && date.getDate() === 1)) {
            // if it's monday or the first day of the month.
            let currentNumericalDate;
            let prevNumericalDate;
            let title;
            if (duration === "weekly") {
                // get the current numerical date
                let dateOneDayAgo = new Date(Date.parse(date) - 86400000)
                currentNumericalDate = (dateOneDayAgo.getMonth()+1) + "/" + dateOneDayAgo.getDate() + "/" + dateOneDayAgo.getFullYear().toString().substring(2) 
                // get the date one week ago
                prevDate = new Date(Date.parse(date) - 604800000)
                prevNumericalDate = (prevDate.getMonth()+1) + "/" + prevDate.getDate() + "/" + prevDate.getFullYear().toString().substring(2)
                title = prevNumericalDate + "-" + currentNumericalDate
            } else if (duration === "monthly"){
                // get previous date.
                let year = date.getFullYear()
                let month = date.getMonth()
                if (date.getMonth() === 0) {
                    // if it's january
                    year = date.getFullYear()-1
                    month = 12;
                }
                title = month + "/" + year
            }
            
            if (calculationMethod === "cumulative") {
                // add the cumulative.
                analyzedData.push({title: title, value: sum.toFixed(currentUnitInfo.totalDecimalPlaces), daysActive: numberOfDaysActive, activities: subData})
            } else {
                // add the average per day.
                if (numberOfDaysActive == 0) {
                    analyzedData.push({title: title, value: 0, daysActive: numberOfDaysActive, activities: subData})
                } else {
                    analyzedData.push({title: title, value: (sum/numberOfDaysActive).toFixed(currentUnitInfo.avgDecimalPlaces), daysActive: numberOfDaysActive, activities: subData})
                }
            }
            
            // reset
            sum = 0
            numberOfDaysActive = 0;
            subData = []

            // add if needed.
            sum += data[i].statsThatDay
            if (data[i].statsThatDay > 0) {
                numberOfDaysActive++;
            }
            data[i].dayBreakdown.forEach(e => {
                subData.push({...e});
            })
        
        } else {
            sum += data[i].statsThatDay
            if (data[i].statsThatDay > 0) {
                numberOfDaysActive++;
            }
            data[i].dayBreakdown.forEach(e => {
                subData.push({...e});
            })
        }
    }
    console.log("------------------------------------------------")
    console.log(analyzedData)
    createBreakdown(analyzedData, currentUnitInfo)
}

function createBreakdown(array, uInfo) {
    var paras = document.getElementsByClassName('analysisVerticalOuterContainer');

    const clr1 = hexToRgb(document.getElementsByName("trendsColor1")[0].value)
    const clr2 = hexToRgb(document.getElementsByName("trendsColor2")[0].value)

    while(paras[0]) {
        paras[0].parentNode.removeChild(paras[0]);
    }

    console.log(array)
    const weeklyValues = array.map(e => e.value)
    const maximum = Math.max(...weeklyValues);
    console.log("maximum is: " + maximum)

    for (let i = 0; i < array.length; i++) {
        const o = document.createElement("div");
        o.className = "analysisVerticalOuterContainer";
        let maxArrayLength
        if (window.innerWidth < window.innerHeight && window.innerWidth < 500) {
            maxArrayLength = 6;
        } else {
            maxArrayLength = 15;
        }
       
        if (array.length <= maxArrayLength) {
            o.style.width = 100/array.length + "%";
            document.getElementById("analysisBarChartHolder").style.overflowX = "hidden"
        } else {
            o.style.width = (100/maxArrayLength) +"%"
            document.getElementById("analysisBarChartHolder").style.overflowX = "scroll"
        }
        
        document.getElementById("analysisBarChartHolder").appendChild(o);

        const verticalHolder = document.createElement("div");
        verticalHolder.className = "analysisVerticalHolder";
        verticalHolder.id = "analysisBar" + i
        verticalHolder.style.height =  (window.innerHeight * 0.3) + "px"
        // verticalHolder.addEventListener("click", showMoreStats);
        document.getElementsByClassName("analysisVerticalOuterContainer")[i].appendChild(verticalHolder);

        var verticalHolderBelow = document.createElement("p");
        verticalHolderBelow.className = "analysisVerticalHolderBelow";
        verticalHolderBelow.innerHTML = array[i].title
        document.getElementsByClassName("analysisVerticalOuterContainer")[i].appendChild(verticalHolderBelow);

        //draw bars
        var verticalHolderStat = document.createElement("p");
        verticalHolderStat.className= "analysisVerticalHolderStat";
        if(array[i].value / maximum > 0.2){
            if (uInfo.value === "pace" || uInfo.value === "maxPace") {
                verticalHolderStat.innerHTML = convert(array[i].value, uInfo.avgDecimalPlaces)
            } else if (uInfo.value === "time" || uInfo.value === "elapsedTime") {
                verticalHolderStat.innerHTML = convert(array[i].value)
            } else {
                verticalHolderStat.innerHTML = array[i].value
            }
        }else{
            verticalHolderStat.innerHTML = ""
            verticalHolderStat.style.fontSize = "0px";
            //creating overflow text on the top of the
            var verticalHolderStatTop = document.createElement("p");
            verticalHolderStatTop.className = "analysisVerticalHolderStatTop";
            if (uInfo.value === "pace" || uInfo.value === "maxPace") {
                verticalHolderStatTop.innerHTML = convert(array[i].value, uInfo.avgDecimalPlaces)
            } else if (uInfo.value === "time" || uInfo.value === "elapsedTime") {
                verticalHolderStatTop.innerHTML = convert(array[i].value)
            } else {
                verticalHolderStatTop.innerHTML = array[i].value
            }
            verticalHolderStatTop.style.bottom = ((array[i].value / maximum) * (window.innerHeight * 0.3)) + "px"
            document.getElementsByClassName("analysisVerticalHolder")[i].appendChild(verticalHolderStatTop);
        }
        
        calculatedPosition = (array[i].value / (maximum * 0.85));
        const r = (clr1.r + (clr2.r - clr1.r) * calculatedPosition)
        const g = (clr1.g + (clr2.g - clr1.g) * calculatedPosition)
        const b = (clr1.b + (clr2.b - clr1.b) * calculatedPosition)

        verticalHolderStat.style.background = "linear-gradient(to top, rgb(" + clr1.r + ", " + clr1.g + ", " + clr1.b + "), rgb(" + r + ", " + g + ", " + b + ")"
        verticalHolderStat.style.height = ((array[i].value / maximum) * (window.innerHeight * 0.3)) + "px";
        verticalHolderStat.style.marginTop = (((maximum - array[i].value) / maximum) * (window.innerHeight * 0.3)) + "px";
        verticalHolderStat.style.width = "100%";
        document.getElementsByClassName("analysisVerticalHolder")[i].appendChild(verticalHolderStat);
    }
}
