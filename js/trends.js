function runTrends() {
    drawTrendGraph();
}

function updateTrendLineOption(event) {
    for (let i = 0; i < document.getElementsByClassName('indivTrendLineOption').length; i++) {
        const elem = document.getElementsByClassName('indivTrendLineOption')[i];
        elem.style.backgroundColor = "white";
        elem.style.color = "black";
    }
    console.log(event)
    const curr = document.getElementById(event.target.id)
    curr.style.color = "white";
    curr.style.backgroundColor = "purple";
    drawTrendGraph();
}

// returns data in the form of: {data: [2d array of activity stats], dataTitles: [1d array of line titles], unitInfo: {value: <variable>, display: <display>, unit: <unit>}}
function processTrendData() {
    // delete all yearly trend graphs.
    if (document.getElementById('yearTrendDiv').getElementsByTagName('div')[0]) {
        document.getElementById('yearTrendDiv').getElementsByTagName('div')[0].remove(); 
    }
     
     // set the variables.
    const variableToParse = document.getElementsByName('trendsCumVariable')[0].value;
    const variableStatus = document.getElementsByName('trendsCumVariableSetting')[0].value;
    const dayHistory = parseInt(document.getElementsByName('movingAvgDays')[0].value);

    const unitInfo = [
        {value: 'distance', display: 'Distance', unit: 'mi', canBeTotaled: true}, 
        {value: 'time', display: 'Moving Time', unit: '', canBeTotaled: true},
        {value: 'elapsedTime', display: 'Elapsed Time', unit: '', canBeTotaled: true},
        {value: 'uptime', display: 'Uptime', unit: "%"},
        {value: 'elevation', display: 'Elevation Gain', unit: "ft", canBeTotaled: true},
        {value: 'incline', display: 'Incline', unit: "%"},
        {value: 'pace', display: 'Pace', unit: "/mi"},
        {value: 'kudos', display: 'Kudos', unit: "", canBeTotaled: true},
        {value: 'maxPace', display: 'Maximum Pace', unit: "/mi"},
        {value: 'cadence', display: 'Cadence', unit: "steps/min"},
        {value: 'stepsPerMile', display: 'Steps / mile', unit: "steps/mi"},
        {value: 'strideLength', display: 'Stride length', unit: "ft"},
    ]

    // determine whether it's yearly, monthly, or historical by seeing which div is purple.
    let timeline; // either "yearly", "monthly", or "historical"
    for (let i = 0; i < document.getElementsByClassName('indivTrendLineOption').length; i++) {
        const elem = document.getElementsByClassName('indivTrendLineOption')[i];
        if (getComputedStyle(elem).getPropertyValue('color') == 'rgb(255, 255, 255)') {
            timeline = elem.id;
            break;
        }
    }

    let processed;
    if (variableStatus === 'cumulative') {
        processed = processAllActivitiesByDayAndProperty(allActivities, variableToParse).data;
    } else if (variableStatus === 'cumulativeMoving') {
        processed = processAllActivitiesByDayAndProperty(allActivities, variableToParse, dayHistory).data;
    } else {
        processed = processAllActivitiesByDayAndProperty(allActivities, variableToParse, dayHistory, true).data;
    }

    const firstYear = parseInt(processed[0][0].split('-')[2])
    const choppedByYear = [];
    const dates = processed.map(a => a[0]);
    const units = unitInfo.map(a => a.value);
    const titles = [];
    // sort by year.
    let cumulativeAtEndOfYear = 0;
    if (timeline == "yearly") {
        for (let i = firstYear; i <= new Date().getFullYear(); i++) {
            let sliced;
            if (i == firstYear) {
                // if the first year of activities are getting parsed.
                sliced = processed.slice(0, dates.indexOf('1-1-' + (i+1)))
                choppedByYear.push(sliced.map(e => [e[0], parseFloat(e[1] - cumulativeAtEndOfYear), e[2]]))
            } else if (i == new Date().getFullYear()) {
                // if the most recent year of activities are getting parsed.
                sliced = processed.slice(dates.indexOf('1-1-' + i))
                choppedByYear.push(sliced.map(e => [e[0], parseFloat(e[1] - cumulativeAtEndOfYear), e[2]]));
            } else {
                // if the middle year of activities are getting parsed.
                sliced = processed.slice(dates.indexOf('1-1-' + i), dates.indexOf('1-1-' + (i+1)));
                choppedByYear.push(sliced.map(e => [e[0], parseFloat(e[1] - cumulativeAtEndOfYear), e[2]]));
            }

            if (variableStatus === 'cumulative') {
                cumulativeAtEndOfYear = parseFloat(sliced[sliced.length-1][1])
            }
            titles.push(i);
        }
    }
    
    

    // add all 366 days worth to choppedByYear. Leap year use is intended.
    let base = '01-01-2020'
    let seconds = Date.parse(base) / 1000;
    let day = 0;
    let dayIndexes = [];
    for (let j = 0; j < choppedByYear.length; j++) {
        dayIndexes.push(0)
    }

    const ar = [];
    if (timeline == 'historical') {
        processed.forEach(e => {
            ar.push([e[0], parseFloat(e[1])])
        })
        titles.push("Historical");
    }

    while (day < 366 && timeline !== 'historical') {
        const subArray = [];
        const newDate = new Date(seconds * 1000);
        subArray.push(newDate.getMonth() + 1 + '/' + newDate.getDate())
        seconds += 86400
        day++;
        for (let i = 0; i < choppedByYear.length; i++) {
            const dates = choppedByYear[i].map(a => {
                const toMap = a[0].split('-');
                return toMap[0] + '/' + toMap[1];
            });
            // console.log(dates);

            const ind = dates.indexOf(newDate.getMonth() + 1 + '/' + newDate.getDate())
            if (ind == -1) {
                subArray.push(null);
            } else {
                subArray.push(choppedByYear[i][dayIndexes[i]][1]);
                dayIndexes[i]++;
            }
        }
        if (timeline !== 'historical') {
            ar.push(subArray);
        }
    }

    console.log(ar);
    return {data: ar, dataTitles: titles, unitInfo: unitInfo[units.indexOf(variableToParse)]};
}

function drawTrendGraph() {

    const trendObj = processTrendData()
    const data = trendObj.data;
    const titles = trendObj.dataTitles;
    var dataSet = anychart.data.set(data);
    const series = [];
    const seriesColors = ['red', 'cornflowerblue', 'seagreen', 'orange', 'cornflowerblue', 'red', 'darkgreen']
    console.log(data[0]);
    for (let i = 1; i < data[0].length; i++) {
        series.push(dataSet.mapAs({x: 0, value: i}));
    }

    console.log(series);
    console.log(titles);
    // create a line chart
    var chart = anychart.line();

    // set the y axis title
    chart.yAxis().title(trendObj.unitInfo.display + ' (' + trendObj.unitInfo.unit + ')');

    // turn on the crosshair
    chart.crosshair().enabled(true).yLabel(false).yStroke(null);

    for (let i = 0; i < series.length; i++) {
        let lineStroke = 3;
        if (titles[i] == new Date().getFullYear()) {
            // if it's current.
            lineStroke = 3;
        }

        const ser = chart.spline(series[i]);
        if (trendObj.unitInfo.value == "elapsedTime" || trendObj.unitInfo.value == "time") {
            ser.name(titles[i]).stroke(lineStroke + ' ' + seriesColors[i]).tooltip().format(function (e){
                return titles[i] + ': ' + convert(this.value)
            }); 
        } else if (trendObj.unitInfo.value == "pace") {
            ser.name(titles[i]).stroke(lineStroke + ' ' + seriesColors[i]).tooltip().format(function (e){
                return titles[i] + ': ' + convert(this.value, 2)
            }); 
        } else {
            ser.name(titles[i]).stroke(lineStroke + ' ' + seriesColors[i]).tooltip().format(titles[i] + ": {%value} " + trendObj.unitInfo.unit);
        }
    }

    // turn the legend on
    chart.legend().enabled(true);

    // set the container id for the line chart
    chart.container('yearTrendDiv');

    // draw the line chart
    chart.draw();
}
