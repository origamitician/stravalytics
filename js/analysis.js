let analyzedData = [];
let analyzedDataInOrder = [];

const unitInfo = [
    {value: 'distance', display: 'Distance', unit: 'mi', canBeTotaled: true, totalDecimalPlaces: 2, avgDecimalPlaces: 2, comparative: "Longer", extremeLow: "Shorter", extremeHigh: "Longer"}, 
    {value: 'time', display: 'Moving Time', unit: '', canBeTotaled: true, decimalPlaces: 0, avgDecimalPlaces: 0, comparative: "Longer", extremeLow: "Shorter", extremeHigh: "Longer"},
    {value: 'elapsedTime', display: 'Elapsed Time', unit: '', canBeTotaled: true, decimalPlaces: 0, avgDecimalPlaces: 0, comparative: "Longer", extremeLow: "Shorter", extremeHigh: "Longer"},
    {value: 'uptime', display: 'Uptime', unit: "%", avgDecimalPlaces: 2, comparative: "More", extremeLow: "Less", extremeHigh: "More"},
    {value: 'elevation', display: 'Elevation Gain', unit: "ft", canBeTotaled: true, decimalPlaces: 1, avgDecimalPlaces: 2, comparative: "Higher", extremeLow: "Lower", extremeHigh: "Higher"},
    {value: 'incline', display: 'Incline', unit: "%", avgDecimalPlaces: 3, comparative: "Greater", extremeLow: "Lighter grade", extremeHigh: "Steeper grade"},
    {value: 'pace', display: 'Pace', unit: "/mi", avgDecimalPlaces: 2, comparative: "Faster", extremeLow: "Slower", extremeHigh: "Faster"},
    {value: 'kudos', display: 'Kudos', unit: "", canBeTotaled: true, decimalPlaces: 0, avgDecimalPlaces: 2, comparative: "Greater", extremeLow: "Less", extremeHigh: "More"},
    {value: 'maxPace', display: 'Maximum Pace', unit: "/mi", avgDecimalPlaces: 2, comparative: "Faster", extremeLow: "Slower", extremeHigh: "Faster"},
    {value: 'cadence', display: 'Cadence', unit: "spm", avgDecimalPlaces: 1, comparative: "Higher", extremeLow: "Lower spm", extremeHigh: "Higher spm"},
    {value: 'stepsPerMile', display: 'Steps / mile', unit: "👟", avgDecimalPlaces: 0, comparative: "Greater", extremeLow: "Less", extremeHigh: "More"},
    {value: 'strideLength', display: 'Stride length', unit: "ft", avgDecimalPlaces: 3, comparative: "Longer", extremeLow: "Shorter", extremeHigh: "Longer"},
]
const unitValues = unitInfo.map(e => e.value)
let variableToAnalyze
let calculationMethod
let duration
let currentUnitInfo;
let maximum;

function runAnalysis() {
    variableToAnalyze = document.getElementsByName('analysisVariable')[0].value
    calculationMethod = document.getElementsByName('analysisVariableSetting')[0].value
    duration = document.getElementsByName('analysisVariableDuration')[0].value
    let data;
    if (calculationMethod === "cumulative") {
        data = processAllActivitiesByDayAndProperty(allActivities, variableToAnalyze).data
    } else {
        data = processAllActivitiesByDayAndProperty(allActivities, variableToAnalyze, 10000, true).data
    }
    
    // sort by week.
    analyzedData = []
    currentUnitInfo = unitInfo[unitValues.indexOf(variableToAnalyze)]

    let sum = 0;
    let numberOfDaysActive = 0;
    let subData = [];
    let dayData = [];
    let daysOfTheWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
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
            dayData = [];

            // add if needed.
            sum += data[i].statsThatDay
            if (data[i].statsThatDay > 0) {
                numberOfDaysActive++;
            }
            data[i].dayBreakdown.forEach(e => {
                dayData.push({...e})
            })
            let day = (date.getMonth() + 1) + "-" + (date.getDate()) + "-" + (date.getFullYear())
            let obj = {}
            obj.day = day;
            obj.details = dayData;
            if (calculationMethod === "cumulative") {
                obj.value = data[i].statsThatDay.toFixed(currentUnitInfo.totalDecimalPlaces)
            } else {
                obj.value = data[i].statsThatDay.toFixed(currentUnitInfo.avgDecimalPlaces)
            }
            subData.push(obj)
        
        } else {
            dayData = []
            sum += data[i].statsThatDay
            if (data[i].statsThatDay > 0) {
                numberOfDaysActive++;
            }
            data[i].dayBreakdown.forEach(e => {
                dayData.push({...e})
            })
            let day = (date.getMonth() + 1) + "-" + (date.getDate()) + "-" + (date.getFullYear())
            let obj = {}
            obj.day = day;
            obj.details = dayData;
            if (calculationMethod === "cumulative") {
                obj.value = data[i].statsThatDay.toFixed(currentUnitInfo.totalDecimalPlaces)
            } else {
                obj.value = data[i].statsThatDay.toFixed(currentUnitInfo.avgDecimalPlaces)
            }
            subData.push(obj)
        }

        if (i === data.length-1) {
            // if it's the last datapoint, submit.
            let title;
            if (duration === "weekly") {
                let closestMonday;
                if (date.getDay() > 0) {
                    closestMonday = new Date(Date.parse(date) - ((date.getDay() - 1) * 86400000))
                } else {
                    // if it's a Sunday.
                    closestMonday = new Date(Date.parse(date) - (6 * 86400000))
                }
                title = (closestMonday.getMonth() + 1) + "/" + closestMonday.getDate() + "/" + closestMonday.getFullYear().toString().substring(2) + "-"
                
            } else if (duration === "monthly") {
                title = date.getMonth() + 1 + "/" + date.getFullYear()
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
        }
    }
    console.log("------------------------------------------------")
    console.log(analyzedData)
    createBreakdown(analyzedData, currentUnitInfo)
}

function getIntermediateColor(percentage) {
    const clr1 = hexToRgb(document.getElementsByName("trendsColor1")[0].value)
    const clr2 = hexToRgb(document.getElementsByName("trendsColor2")[0].value)

    const r = (clr1.r + (clr2.r - clr1.r) * percentage)
    const g = (clr1.g + (clr2.g - clr1.g) * percentage)
    const b = (clr1.b + (clr2.b - clr1.b) * percentage)
    return {r: r, g: g, b: b}
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
    maximum = Math.max(...weeklyValues);
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

        const calculatedPosition = (array[i].value / (maximum));
        const intermediateColor = getIntermediateColor(calculatedPosition)
        const r = intermediateColor.r
        const g = intermediateColor.g
        const b = intermediateColor.b
        
        document.getElementById("analysisBarChartHolder").appendChild(o);

        const verticalHolder = document.createElement("div");
        verticalHolder.className = "analysisVerticalHolder";
        verticalHolder.id = "analysisBar-" + i + "-" + rgbToHex(Math.round(r), Math.round(g), Math.round(b))
        verticalHolder.style.height =  (window.innerHeight * 0.3) + "px"
        verticalHolder.addEventListener("click", showBreakdown);
        document.getElementsByClassName("analysisVerticalOuterContainer")[i].appendChild(verticalHolder);

        var verticalHolderBelow = document.createElement("p");
        verticalHolderBelow.className = "analysisVerticalHolderBelow";
        verticalHolderBelow.innerHTML = array[i].title
        document.getElementsByClassName("analysisVerticalOuterContainer")[i].appendChild(verticalHolderBelow);

        //draw bars
        var verticalHolderStat = document.createElement("p");
        verticalHolderStat.className= "analysisVerticalHolderStat";
        if(array[i].value / maximum > 0.2){
            verticalHolderStat.innerHTML = convertBasedOnVariable(array[i].value)
            if (i === array.length - 1) {
                verticalHolderStat.style.color = "rgb(" + r + ", " + g + ", " + b + ")"
            }
        }else{
            verticalHolderStat.innerHTML = ""
            verticalHolderStat.style.fontSize = "0px";
            //creating overflow text on the top of the
            var verticalHolderStatTop = document.createElement("p");
            verticalHolderStatTop.className = "analysisVerticalHolderStatTop";
            verticalHolderStatTop.innerHTML = convertBasedOnVariable(array[i].value)
            verticalHolderStatTop.style.bottom = ((array[i].value / maximum) * (window.innerHeight * 0.3)) + "px"
            if (i === array.length - 1) {
                verticalHolderStatTop.style.color = "rgb(" + r + ", " + g + ", " + b + ")"
            }
            document.getElementsByClassName("analysisVerticalHolder")[i].appendChild(verticalHolderStatTop);
        }

        if (i === array.length - 1) {
            verticalHolderStat.style.border = "3px dotted rgb(" + r + ", " + g + ", " + b + ")"
            verticalHolderStat.style.borderBottom = "none"
        } else {
            verticalHolderStat.style.background = "linear-gradient(to top, rgb(" + clr1.r + ", " + clr1.g + ", " + clr1.b + "), rgb(" + r + ", " + g + ", " + b + ")"
        }
        
        verticalHolderStat.style.height = ((array[i].value / maximum) * (window.innerHeight * 0.3)) + "px";
        verticalHolderStat.style.marginTop = (((maximum - array[i].value) / maximum) * (window.innerHeight * 0.3)) + "px";
        verticalHolderStat.style.width = "100%";
        document.getElementsByClassName("analysisVerticalHolder")[i].appendChild(verticalHolderStat);
    }

    analyzedDataInOrder = [...analyzedData]
    for (let i = 1; i < analyzedDataInOrder.length; i++) {
        let currentElement = analyzedDataInOrder[i];
        let lastIndex = i - 1;
  
        while (lastIndex >= 0 && Number(analyzedDataInOrder[lastIndex].value) > Number(currentElement.value)) {
            analyzedDataInOrder[lastIndex + 1] = analyzedDataInOrder[lastIndex];
            lastIndex--;
        }
        analyzedDataInOrder[lastIndex + 1] = currentElement;
    }
}

function convertBasedOnVariable(val) {
    let toReturn;
    if (currentUnitInfo.value === "pace" || currentUnitInfo.value === "maxPace") {
        toReturn = convert(val, currentUnitInfo.avgDecimalPlaces)
    } else if (currentUnitInfo.value === "time" || currentUnitInfo.value === "elapsedTime") {
        toReturn = convert(val)
    } else {
        toReturn = val
    }

    return toReturn;
}

function showBreakdown() {
    // show breakdown.
    paras = document.getElementsByClassName('weeklyChartCell');
    while(paras[0]) {
        paras[0].parentNode.removeChild(paras[0]);
    }

    console.log(this.id)
    const index = Number(this.id.split('-')[1])
    const toRender = analyzedData[index];

    // sort analyzedData in ascending order.
    
    const summaryElem = document.getElementById("analysisInfoMainStatistic")
    let displayStr = "";
    let summaryStr = "";

    if (calculationMethod === "average") {
        displayStr = "Avg " + currentUnitInfo.display.toLowerCase() + "/day for " + toRender.title + ""
    } else {
        displayStr = currentUnitInfo.display + " for " + toRender.title + ""
    }
    document.getElementById("analysisInfoMainStatisticUnit").innerHTML = displayStr

    if (calculationMethod === "cumulative") {
        summaryStr = "<b>" + convertBasedOnVariable(toRender.value) + currentUnitInfo.unit + " </b>" 
    } else {
        summaryStr = "<b>" + convertBasedOnVariable(toRender.value) + currentUnitInfo.unit + " </b>" 
    }
    summaryElem.innerHTML = summaryStr

    let clr = this.id.split('-')[2]
    let outerSummaryElem = document.getElementById("analysisInfoFlexLeft")
    outerSummaryElem.style.borderLeft = "6px solid " + clr
    summaryElem.getElementsByTagName('b')[0].style.color = clr

    // show the chart.
    const firstDay = new Date(toRender.activities[0].day)
    let dayToStart = firstDay.getDay()
    if (dayToStart === 0) {
        // if it's a Sunday.
        dayToStart = 6
    } else {
        dayToStart -=1
    }

    // add the gradient info.
    console.log('-----------------------------')
    console.log(analyzedDataInOrder.indexOf(toRender))
    let proportion = ((analyzedDataInOrder.indexOf(toRender) / analyzedDataInOrder.length)*100).toFixed(2)
    let adjustedProportion = ((analyzedDataInOrder.indexOf(toRender) / (analyzedDataInOrder.length - 1))*100).toFixed(2)
    document.getElementById('analysisInfoRanking').innerHTML = currentUnitInfo.comparative  + " than <b> " + analyzedDataInOrder.indexOf(toRender) + "</b> (of " + analyzedDataInOrder.length + ") weeks [Top <b>" + proportion + "%</b>  of weeks]"
    document.getElementById("analysisExtremeLow").innerHTML = currentUnitInfo.extremeLow;
    document.getElementById("analysisExtremeHigh").innerHTML = currentUnitInfo.extremeHigh;
    document.getElementById("analysisInfoSpectrumBar").style.left = Number(adjustedProportion) + "%"

    let calendarIndex = 0;
    for (let i = 0; i < toRender.activities.length; i++) {
        if (calendarIndex % 7 === 0) {
            // create a new row.
            let week = document.createElement("tr");
            week.id = "weeklyChartRow" + Math.floor(calendarIndex / 7)
            week.className = "weeklyChartRow"
            document.getElementById("summaryAnalysisTable").appendChild(week)
        }

        for (let j = 0; j < dayToStart && i == 0; j++) {
            // for weeks/months not starting on a Monday, create the "indent." Only run on the 1st iteration.
            let cell = document.createElement('td');
            cell.className = "weeklyChartCell";
            document.getElementById("weeklyChartRow" + Math.floor(calendarIndex / 7)).appendChild(cell)
            calendarIndex++;
        }

        let calculatedPosition;
        if (calculationMethod === "cumulative") {
            calculatedPosition = (Number(toRender.activities[i].value) / ((toRender.value / toRender.daysActive)*1.5));
        } else {
            calculatedPosition = (Number(toRender.activities[i].value) / maximum);
        }
        const intermediateColor = getIntermediateColor(calculatedPosition)
        const r = intermediateColor.r
        const g = intermediateColor.g
        const b = intermediateColor.b

        let cell = document.createElement('td');
        cell.className = "weeklyChartCell";
        
        let weekDayDisplay = document.createElement('p')
        weekDayDisplay.innerHTML = "<b>" + (i+1) + "</b>";
        weekDayDisplay.className = "chartWeekDayDisplay"

        let display = document.createElement('span');
        display.className = "weeklyChartCellDisplay"
        
        display.innerHTML = convertBasedOnVariable(toRender.activities[i].value) + currentUnitInfo.unit
        // display.style.color = "white"
        if (Number(toRender.activities[i].value) != 0) {
            display.style.color = "white"
            display.style.backgroundColor = "rgb(" + r + ", " + g + ", " + b + ")"
        }
        
        weekDayDisplay.appendChild(display);
        cell.appendChild(weekDayDisplay)

        // create the activity breakdown
        toRender.activities[i].details.forEach(act => {
            // get the sidebar color.
            if (calculationMethod === "cumulative") {
                calculatedPosition = (Number(act.activityStat) / ((toRender.value / toRender.daysActive)*1.5));
            } else {
                calculatedPosition = (Number(act.activityStat) / maximum);
            }
            const intermediateColor = getIntermediateColor(calculatedPosition)
            const r = intermediateColor.r
            const g = intermediateColor.g
            const b = intermediateColor.b

            let activityHolder = document.createElement("div")
            activityHolder.id = act.activityID;
            activityHolder.className = "weeklyChartActivityInfoHolder"
            activityHolder.addEventListener('click', () => createRunLookup(act.activityID))
            activityHolder.style.borderLeft = "3px solid rgb(" + r + ", " + g + ", " + b + ")"
            
            let dailyStat = document.createElement("b")
            dailyStat.className = "weeklyChartActivityStat"
            if (calculationMethod === "cumulative") {
                dailyStat.innerHTML = convertBasedOnVariable(act.activityStat.toFixed(currentUnitInfo.totalDecimalPlaces)) + currentUnitInfo.unit
            } else if (calculationMethod === "average") {
                dailyStat.innerHTML = convertBasedOnVariable(act.activityStat.toFixed(currentUnitInfo.avgDecimalPlaces)) + currentUnitInfo.unit
            }
            dailyStat.style.color = "rgb(" + r + ", " + g + ", " + b + ")"
            activityHolder.appendChild(dailyStat);

            let dailyStatName = document.createElement("p")
            dailyStatName.className = "weeklyChartActivityName"
            dailyStatName.innerHTML = act.activityTitle
            activityHolder.appendChild(dailyStatName);
            cell.appendChild(activityHolder);
        })
        
        document.getElementById("weeklyChartRow" + Math.floor(calendarIndex / 7)).appendChild(cell)
        calendarIndex++;
    }
}
