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
    } else if (timeline == "monthly") {
        for (let yr = firstYear; yr <= new Date().getFullYear(); yr++) {
            let startMonth = 1;
            let endMonth = 12;
            let sliced = [];
            if (yr === firstYear) {
                // if the first year is being parsed.
                startMonth = parseInt(processed[0][0].split('-')[0])
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
                    choppedByYear.push(sliced.map(e => [e[0], parseFloat(e[1] - cumulativeAtEndOfYear), e[2]]));
                } else if (month == endMonth && yr == new Date().getFullYear()) {
                    // if the last month is getting processed.
                    sliced = processed.slice(dates.indexOf(`${month}-1-${yr}`))
                    choppedByYear.push(sliced.map(e => [e[0], parseFloat(e[1] - cumulativeAtEndOfYear), e[2]]));
                } else {
                    // if the other middle months are getting processesd.
                    sliced = processed.slice(dates.indexOf(`${month}-1-${yr}`), dates.indexOf(`${nextMonth}-1-${nextYear}`))
                    choppedByYear.push(sliced.map(e => [e[0], parseFloat(e[1] - cumulativeAtEndOfYear), e[2]]));
                }

                if (variableStatus === 'cumulative') {
                    cumulativeAtEndOfYear = parseFloat(sliced[sliced.length-1][1])
                }
                titles.push(`${month}/${yr}`);
            }
        }
        console.log(choppedByYear);
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
                subArray.push(null);
            } else {
                subArray.push(choppedByYear[i][dayIndexes[i]][1]);
                dayIndexes[i]++;
            }
        }
        if (timeline !== 'historical') {
            ar.push(subArray);
        }

        seconds += 86400
        day++;
    }

    console.log(ar);
    return {data: ar, dataTitles: titles, unitInfo: unitInfo[units.indexOf(variableToParse)]};
}

function drawTrendGraph() {

    const trendObj = processTrendData()
    const data = trendObj.data;
    let titles = trendObj.dataTitles;
    var dataSet = anychart.data.set(data);
    const series = [];
    const seriesColors = ['red', 'cornflowerblue', 'seagreen', 'orange', 'darkblue', 'gold', 'lime', 'black', 'grey', 'purple', 'skyblue', 'black']
    console.log(data[0]);

    if (data[0].length > seriesColors.length) {
        const tempDataTitles = [...titles];
        titles = [];
        for (let i = data[0].length - 1; i > data[0].length - 1 - seriesColors.length; i--) {
            series.push(dataSet.mapAs({x: 0, value: i}));
            titles.push(tempDataTitles[i-1])
        }
        /* for (let i = 1; i < seriesColors.length; i++) {
            series.push(dataSet.mapAs({x: 0, value: i}));
        } */
    } else {
        for (let i = 1; i < data[0].length; i++) {
            series.push(dataSet.mapAs({x: 0, value: i}));
        }
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
            lineStroke = 5;
        }
        
        const ser = chart.line(series[i]);
        if (trendObj.unitInfo.value == "elapsedTime" || trendObj.unitInfo.value == "time") {
            ser.name(titles[i]).stroke(lineStroke + ' ' + seriesColors[i % seriesColors.length]).tooltip().format(function (e){
                return titles[i] + ': ' + convert(this.value)
            }); 
        } else if (trendObj.unitInfo.value == "pace") {
            ser.name(titles[i]).stroke(lineStroke + ' ' + seriesColors[i % seriesColors.length]).tooltip().format(function (e){
                return titles[i] + ': ' + convert(this.value, 2)
            }); 
        } else {
            ser.name(titles[i]).stroke(lineStroke + ' ' + seriesColors[i % seriesColors.length]).tooltip().format(titles[i] + ": {%value} " + trendObj.unitInfo.unit);
        }
    }

    // turn the legend on
    chart.legend().enabled(true);

    // set the container id for the line chart
    chart.container('yearTrendDiv');

    // draw the line chart
    chart.draw();
}
