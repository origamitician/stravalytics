function runTrends() {
    drawTrendGraph();
}

let processedByDay = []; // global var
let barRaceInterval; // global var for bar race
let timeline; // global var for graph render status

function updateTrendLineOption(event) {
    for (let i = 0; i < document.getElementsByClassName('indivTrendLineOption').length; i++) {
        const elem = document.getElementsByClassName('indivTrendLineOption')[i];
        elem.style.backgroundColor = "white";
        elem.style.color = "black";
    }
    const curr = document.getElementById(event.target.id)
    curr.style.color = "white";
    curr.style.backgroundColor = "purple";
    drawTrendGraph();
}

// returns data in the form of: {data: [2d array of activity stats], dataTitles: [1d array of line titles], unitInfo: {value: <variable>, display: <display>, unit: <unit>}}
function processTrendData() {
    // delete all yearly trend graphs.
    if (barRaceInterval) {
        clearInterval(barRaceInterval);
    }
    
    if (document.getElementById('yearTrendDiv').getElementsByTagName('div')[0]) {
        document.getElementById('yearTrendDiv').getElementsByTagName('div')[0].remove(); 
    }
     
    // set the variables.
    processedByDay  = [];
    let variableToParse = document.getElementsByName('trendsCumVariable')[0].value;
    const variableStatus = document.getElementsByName('trendsCumVariableSetting')[0].value;
    const dayHistory = parseInt(document.getElementsByName('movingAvgDays')[0].value);

    const unitInfo = [
        {value: 'distance', display: 'Distance', unit: 'mi', totalDecimalPoints: 2, avgDecimalPoints: 2}, 
        {value: 'time', display: 'Moving Time', unit: '', totalDecimalPoints: 0, avgDecimalPoints: 0},
        {value: 'elapsedTime', display: 'Elapsed Time', unit: '', totalDecimalPoints: 0, avgDecimalPoints: 0},
        {value: 'uptime', display: 'Uptime', unit: "%", totalDecimalPoints: 2, avgDecimalPoints: 2},
        {value: 'elevation', display: 'Elevation Gain', unit: "ft", totalDecimalPoints: 2, avgDecimalPoints: 2},
        {value: 'incline', display: 'Incline', unit: "%", totalDecimalPoints: 3, avgDecimalPoints: 3},
        {value: 'pace', display: 'Pace', unit: "/mi", totalDecimalPoints: 2, avgDecimalPoints: 2},
        {value: 'kudos', display: 'Kudos', unit: "", totalDecimalPoints: 0, avgDecimalPoints: 2},
        {value: 'maxPace', display: 'Maximum Pace', unit: "/mi", totalDecimalPoints: 2, avgDecimalPoints: 2},
        {value: 'cadence', display: 'Cadence', unit: "steps/min", totalDecimalPoints: 1, avgDecimalPoints: 2},
        {value: 'stepsPerMile', display: 'Steps / mile', unit: "", totalDecimalPoints: 0, avgDecimalPoints: 0},
        {value: 'strideLength', display: 'Stride length', unit: "ft", totalDecimalPoints: 3, avgDecimalPoints: 3},
        {value: 'totalSteps', display: 'Steps taken', unit: "", totalDecimalPoints: 0, avgDecimalPoints: 0},
    ] 

    // determine whether it's yearly, monthly, or historical by seeing which div is purple.
    for (let i = 0; i < document.getElementsByClassName('indivTrendLineOption').length; i++) {
        const elem = document.getElementsByClassName('indivTrendLineOption')[i];
        if (getComputedStyle(elem).getPropertyValue('color') == 'rgb(255, 255, 255)') {
            timeline = elem.id;
            break;
        }
    }

    const canBeTotaled = ["distance", "time", "elapsedTime", "elevation", "kudos", "totalSteps"];
    if (variableStatus == "cumulative" || variableStatus == "cumulativeMoving") {
        // disable most variables.
        for (let i = 0; i < unitInfo.length; i++) {
            if (canBeTotaled.indexOf(unitInfo[i].value) == -1) {
                // if the variables can't be totaled.
                document.getElementById("trendVariableList").getElementsByTagName('option')[i].setAttribute('disabled', true);
            }
        }

        // disable the moving days field
        if (variableStatus == "cumulative") {
            document.getElementById("trendsNumDaysInput").setAttribute('readonly', true);
            document.getElementById("trendsNumDaysInput").style.backgroundColor = "gray";
        } else {
            document.getElementById("trendsNumDaysInput").removeAttribute('readonly');
            document.getElementById("trendsNumDaysInput").style.backgroundColor = "white";
        }

        // default back to distance if an unknown variable is chosen.
        if (canBeTotaled.indexOf(variableToParse) == -1) {
            variableToParse = "distance";
            document.getElementById('trendVariableList').value = "distance";
        }
    } else {
        document.getElementById("trendsNumDaysInput").removeAttribute('readonly');
        document.getElementById("trendsNumDaysInput").style.backgroundColor = "white";

        // open up all variables
        for (let i = 0; i < document.getElementById("trendVariableList").getElementsByTagName('option').length; i++) {
            document.getElementById("trendVariableList").getElementsByTagName('option')[i].removeAttribute('disabled');
        }
    }

    let processed;
    let extra;
    const units = unitInfo.map(a => a.value);
    const important = unitInfo[units.indexOf(variableToParse)];
    if (variableStatus === 'cumulative') {
        processed = processAllActivitiesByDayAndProperty(allActivities, variableToParse).data;
        extra = `Total ${important.display}:`
    } else if (variableStatus === 'cumulativeMoving') {
        processed = processAllActivitiesByDayAndProperty(allActivities, variableToParse, dayHistory).data;
        extra = `Total ${important.display.toLowerCase()}, last ${dayHistory} days:`
    } else {
        processed = processAllActivitiesByDayAndProperty(allActivities, variableToParse, dayHistory, true).data;
        extra = `Avg ${important.display.toLowerCase()}/day, last ${dayHistory} days:`
    }
    console.log(processed)
    // set the top variable and comparisons (if applicable)
    let disp = parseFloat(processed[processed.length - 1].display)
    let unitDisplayer = `<span>${important.unit}</span>`
    if (variableToParse == "time" || variableToParse == "elapsedTime") {
        document.getElementById("trendInfoHighlight").innerHTML = convert(disp) + unitDisplayer
    } else if (variableToParse == "pace" || variableToParse == "maxPace") {
        document.getElementById("trendInfoHighlight").innerHTML = convert(disp, 2) + unitDisplayer
    } else {
        document.getElementById("trendInfoHighlight").innerHTML = (variableStatus === "cumulative" || variableStatus === "cumulativeMoving") ? disp.toFixed(important.totalDecimalPoints) + unitDisplayer : disp.toFixed(important.avgDecimalPoints) + unitDisplayer   
    }
    document.getElementById("trendInfoUnitDisplay").innerHTML = extra;
    
    let prev, percentage;
    const diff = document.getElementById("trendInfoComparison")
    if (variableStatus !== 'cumulative') {
        if (processed[processed.length - 1 - dayHistory]) {
            prev = processed[processed.length - 1 - dayHistory].display
            if (variableToParse == "pace" || variableToParse == "maxPace") {
                percentage = ((prev - disp) / prev) * 100
            } else {
                percentage = ((disp - prev) / prev) * 100
            }
        } else {
            alert ("Please enter a smaller day!");
            return 0;
        }

        if (variableToParse == "pace" || variableToParse == "maxPace") {
            prev = convert(prev, 2);
        } else if (variableToParse == "time" || variableToParse == "elapsedTime" ) {
            prev = convert(prev);
        } else {
            prev = (variableStatus === "cumulative" || variableStatus === "cumulativeMoving") ? Number(prev).toFixed(important.totalDecimalPoints): Number(prev).toFixed(important.avgDecimalPoints)
        }
        
        if (percentage > 0) {
            diff.innerHTML = "▲ Up <b>" + percentage.toFixed(2) + "%</b> from " + prev + ' ' + unitDisplayer
            diff.style.color = "green";
        } else {
            diff.innerHTML = "▼ Down <b>" + percentage.toFixed(2) + "%</b> from " + prev + " " + unitDisplayer
            diff.style.color = "blue";
        }
    } else {
        diff.innerHTML = "(No comparison provided)";
        diff.style.color = "orange";
    }

    // start processing data further

    const firstYear = parseInt(processed[0].date.split('-')[2])
    const choppedByYear = [];
    const dates = processed.map(a => a.date);
    const titles = [];
    // sort by year.
    let cumulativeAtEndOfYear = 0;
    if (timeline == "yearly") {
        for (let i = firstYear; i <= new Date().getFullYear(); i++) {
            let sliced;
            if (i == firstYear) {
                // if the first year of activities are getting parsed.
                sliced = processed.slice(0, dates.indexOf('1-1-' + (i+1)))
                choppedByYear.push(sliced.map(e => [e.date, parseFloat(e.display - cumulativeAtEndOfYear), e.statsThatDay]))
            } else if (i == new Date().getFullYear()) {
                // if the most recent year of activities are getting parsed.
                sliced = processed.slice(dates.indexOf('1-1-' + i))
                choppedByYear.push(sliced.map(e => [e.date, parseFloat(e.display - cumulativeAtEndOfYear), e.statsThatDay]));
            } else {
                // if the middle year of activities are getting parsed.
                sliced = processed.slice(dates.indexOf('1-1-' + i), dates.indexOf('1-1-' + (i+1)));
                choppedByYear.push(sliced.map(e => [e.date, parseFloat(e.display - cumulativeAtEndOfYear), e.statsThatDay]));
            }

            if (variableStatus === 'cumulative') {
                cumulativeAtEndOfYear = parseFloat(sliced[sliced.length-1].display)
            }
            titles.push(i);
        }
    } else if (timeline == "monthly") {
        for (let yr = firstYear; yr <= new Date().getFullYear(); yr++) {
            let startMonth = 1;
            let endMonth = 12;
            let sliced = [];
            if (yr === firstYear) {
                // if the first year is being parsed.
                startMonth = parseInt(processed[0].date.split('-')[0])
            }

            if (yr === new Date().getFullYear()) {
                // if the last year is getting processed.
                endMonth = new Date().getMonth() + 1;
            }

            for (let month = startMonth; month <= endMonth; month++) {
                let nextMonth, nextYear;
                if (month == 12) {
                    nextMonth = 1
                    nextYear = yr + 1;
                } else {
                    nextMonth = month+1;
                    nextYear = yr;
                }

                if (month == startMonth && yr == firstYear) {
                    // if the first month is getting processed.
                    sliced = processed.slice(0, dates.indexOf(`${nextMonth}-1-${nextYear}`))
                    choppedByYear.push(sliced.map(e => [e.date, parseFloat(e.display - cumulativeAtEndOfYear), e.statsThatDay]));
                } else if (month == endMonth && yr == new Date().getFullYear()) {
                    // if the last month is getting processed.
                    sliced = processed.slice(dates.indexOf(`${month}-1-${yr}`))
                    choppedByYear.push(sliced.map(e => [e.date, parseFloat(e.display - cumulativeAtEndOfYear), e.statsThatDay]));
                } else {
                    // if the other middle months are getting processesd.
                    sliced = processed.slice(dates.indexOf(`${month}-1-${yr}`), dates.indexOf(`${nextMonth}-1-${nextYear}`))
                    choppedByYear.push(sliced.map(e => [e.date, parseFloat(e.display - cumulativeAtEndOfYear), e.statsThatDay]));
                }

                if (variableStatus === 'cumulative') {
                    cumulativeAtEndOfYear = parseFloat(sliced[sliced.length-1].display)
                }
                titles.push(`${month}/${yr}`);
            }
        }
    }
    
    // add all 366 days worth to choppedByYear. Leap year use is intended.
    let base = '01-01-2020'
    let seconds = Date.parse(base) / 1000;
    let day = 0;
    let dayIndexes = [];
    for (let j = 0; j < choppedByYear.length; j++) {
        dayIndexes.push({index: 0, last: 0})
    }
    console.log(choppedByYear);
    const ar = [];
    if (timeline == 'historical') {
        processed.forEach(e => {
            ar.push([e.date, parseFloat(e.display)])
            processedByDay.push([e.date, parseFloat(e.display)])
        })
        titles.push("Historical");
    }

    let maxDays;
    if (timeline == 'yearly') {
        maxDays = 366;
    } else {
        maxDays = 31;
    }
    while (day < maxDays && timeline !== 'historical') {
        const subArray = [];
        const newDate = new Date(seconds * 1000);
        if (timeline == 'yearly') {
            subArray.push(newDate.getMonth() + 1 + '/' + newDate.getDate())
        } else if (timeline == 'monthly') {
            subArray.push(`Day ${newDate.getDate()}`)
        }
        
        for (let i = 0; i < choppedByYear.length; i++) {
            const dates = choppedByYear[i].map(a => {
                const toMap = a[0].split('-');
                if (timeline == 'yearly') {
                    return toMap[0] + '/' + toMap[1];
                } else {
                    return `Day ${toMap[1]}`;
                }
            });
            // console.log(dates);

            let ind;
            if (timeline == 'yearly') {
                ind = dates.indexOf(newDate.getMonth() + 1 + '/' + newDate.getDate())
            } else {
                ind = dates.indexOf(`Day ${newDate.getDate()}`)
            }
            
            if (ind == -1) {
                subArray.push(dayIndexes[i].last);
            } else {
                const toAdd = choppedByYear[i][dayIndexes[i].index][1]
                subArray.push(toAdd);
                dayIndexes[i].last = toAdd;
                dayIndexes[i].index++;
            }
        }
        if (timeline !== 'historical') {
            ar.push(subArray);
            processedByDay.push(subArray);
        }
        seconds += 86400
        day++;
    }
    return {data: ar, dataTitles: titles, unitInfo: unitInfo[units.indexOf(variableToParse)]};
}

function drawTrendGraph() {

    const trendObj = processTrendData()
    const data = trendObj.data;
    let titles = trendObj.dataTitles;
    var dataSet = anychart.data.set(data);
    const series = [];
    const seriesColors = ['red', 'cornflowerblue', 'seagreen', 'orange', 'darkblue', 'gold', 'lime','purple']

    if (data[0].length > seriesColors.length) {
        const tempDataTitles = [...titles];
        titles = [];
        for (let i = data[0].length - 1; i > data[0].length - 1 - seriesColors.length; i--) {
            series.push(dataSet.mapAs({x: 0, value: i}));
            titles.push(tempDataTitles[i-1])
            // rappel all changes down processedByDay.
            for (let j = 0; j < processedByDay.length; j++) {
                const tempData = processedByDay[j][i];
                processedByDay[j][i] = {name: tempDataTitles[i-1], value: tempData, color: seriesColors[data[0].length - 1 - i]}
            }
        }

        // clean up processedByDay by removing any entry that isn't an object.
        for (let j = 0; j < processedByDay.length; j++) {
            const end = processedByDay[j].length;
            processedByDay[j].splice(1, end - seriesColors.length - 1);
        }

    } else {
        for (let i = 1; i < data[0].length; i++) {
            series.push(dataSet.mapAs({x: 0, value: i}));
            for (let j = 0; j < processedByDay.length; j++) {
                const tempData = processedByDay[j][i];
                processedByDay[j][i] = {name: titles[i-1], value: tempData, color: seriesColors[i % seriesColors.length]}
            }
        }
    }

    // create a line chart
    var chart = anychart.line();

    // set the y axis title
    chart.yAxis().title(trendObj.unitInfo.display + ' (' + trendObj.unitInfo.unit + ')');

    // turn on the crosshair
    chart.crosshair().enabled(true).yLabel(false).yStroke(null);
    

    for (let i = 0; i < series.length; i++) {
        let lineStroke = 3;
        /* if (titles[i] == new Date().getFullYear()) {
            // if it's current.
            lineStroke = 5;
        } */
        
        const ser = chart.line(series[i]);
        if (trendObj.unitInfo.value == "elapsedTime" || trendObj.unitInfo.value == "time") {
            ser.name(titles[i]).stroke(lineStroke + ' ' + seriesColors[i % seriesColors.length]).tooltip().format(function (e){
                return titles[i] + ' (' + seriesColors[i % seriesColors.length] + '): ' + convert(this.value)
            })
        } else if (trendObj.unitInfo.value == "pace") {
            ser.name(titles[i]).stroke(lineStroke + ' ' + seriesColors[i % seriesColors.length]).tooltip().format(function (e){
                return titles[i] + ' (' + seriesColors[i % seriesColors.length] + '): ' + convert(this.value, 2)
            })
        } else {
            ser.name(titles[i]).stroke(lineStroke + ' ' + seriesColors[i % seriesColors.length]).tooltip().format(titles[i] + ' (' + seriesColors[i % seriesColors.length] + '): {%value} ' + trendObj.unitInfo.unit)
        }
    }

    // turn the legend on
    chart.legend().enabled(true);

    // set the container id for the line chart
    chart.container('yearTrendDiv');
    // draw the line chart
    chart.draw();
}

function runBarRace() {
    graphFrame = 0;
    // compute the intermediate.
    if (timeline == "yearly") {
        scrubbingRate = 12;
    } else {
        scrubbingRate = 100;
    }
    barRaceInterval = setInterval(() => computeIntermediatesAndDraw(), 40)
}

let graphFrame = 0;
let scrubbingRate = 100 // # of increments per data point.
function computeIntermediatesAndDraw() {
    const fraction = (graphFrame % scrubbingRate) / scrubbingRate;
    let computedIntermediate = [];
    const item = processedByDay[Math.floor(graphFrame / scrubbingRate)]
    const nextItem = processedByDay[Math.ceil(graphFrame / scrubbingRate)]

    if (!nextItem) {
        // if it goes out of bounds, stop immediately.
        clearInterval(barRaceInterval);
        return 0;
    }

    computedIntermediate.push(item[0]) // push the date.
    for (let i = 1; i < processedByDay[0].length; i++) {
        let calculatedDifference = (nextItem[i].value - item[i].value).toFixed(2);
        if (calculatedDifference >= 0) {
            calculatedDifference = "+" + calculatedDifference;
        }

        computedIntermediate.push({
            name: item[i].name, 
            value: item[i].value + ((nextItem[i].value - item[i].value) * fraction), 
            color: item[i].color,
            diff: calculatedDifference
        })
    }
    drawBarFrame(computedIntermediate)
}

function drawBarFrame(array) {
    // array is in the format [<date>, {name: name1, value: val, diff: dif1, color: c1}, {name: name2, value: val, color: c1}, ...]
    document.getElementById('barRaceMarker').innerHTML = array[0];
    // delete existing bars.
    var paras = document.getElementsByClassName('graphRow');

    while(paras[0]) {
        paras[0].parentNode.removeChild(paras[0]);
    }

    const data = array.slice(1);
    let maxValue;

    const values = data.map(e => e.value);
    maxValue = Math.max(...values);

    // sort data by decreasing order.
    for (let i = 1; i < data.length; i++) {
        let currentElement = data[i];
        let lastIndex = i - 1;
  
        while (lastIndex >= 0 && data[lastIndex].value < currentElement.value) {
            data[lastIndex + 1] = data[lastIndex];
            lastIndex--;
        }
        data[lastIndex + 1] = currentElement;
    }

    for (let i = 0; i < data.length; i++) {
        const graphRow = document.createElement('div');
        graphRow.className = 'graphRow';

        const graphText = document.createElement('p');
        graphText.className = 'trendsRaceText';
        graphText.innerHTML = data[i].name;
        graphRow.appendChild(graphText);

        const graphBarHolder = document.createElement('div');
        graphBarHolder.className = 'trendsRaceBarHolder';

        const graphBar = document.createElement('div');
        graphBar.className = 'trendsRaceGraphBar';
        graphBar.style.backgroundColor = data[i].color
        /* graphBar.style.background = 'linear-gradient(to right, white, ' + graphColors[i % graphColors.length] + ')'; */
        if ((data[i].value / maxValue) * 100 > 18) {
            graphBar.innerHTML = `${data[i].value.toFixed(2)} (${data[i].diff})`
        } else {
            graphBar.innerHTML = "."
        }
        
        graphBar.style.width = (data[i].value / maxValue) * 100 + "%";
        graphBarHolder.appendChild(graphBar);
         
        if ((data[i].value / maxValue) * 100 <= 18) {
            const graphTailText = document.createElement('p');
            graphTailText.innerHTML = `${data[i].value.toFixed(2)} (${data[i].diff})`
            graphTailText.style.paddingLeft = "2%";
            graphTailText.style.marginTop = "1%";
            graphTailText.style.marginBottom = "1%";
            graphTailText.style.fontSize = "110%";
            graphBarHolder.appendChild(graphTailText);
        }
        
        graphRow.appendChild(graphBarHolder);

        document.getElementById('kudoGraphDiv').appendChild(graphRow);
    }

    graphFrame++;

    /* const kudoScale = document.createElement('div');
    kudoScale.className = 'kudoGraphScale';

    const increments = 5;
    for (let j = 0; j < increments; j++) {
        const scaleIncrement = document.createElement('div');
        scaleIncrement.className = 'kudoScaleIncrement'
        scaleIncrement.style.width = (100 / increments) + "%";
        scaleIncrement.innerHTML = (maxValue / increments) * (j + 1);
        kudoScale.appendChild(scaleIncrement);
    }

    document.getElementById('kudoGraphDiv').appendChild(kudoScale); */
}
