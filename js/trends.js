function runTrends() {
    drawTrendGraph();
}

function processTrendData() {
    const variableToParse = document.getElementsByName('trendsCumVariable')[0].value;
    const units = {distance: 'mi', time: '', elapsedTime: '', elevation: 'ft', kudos: 'kudos'}
    const processed = processAllActivitiesByDayAndProperty(allActivities, variableToParse).data;
    const firstYear = parseInt(processed[0][0].split('-')[2])
    const choppedByYear = [];
    const dates = processed.map(a => a[0]);
    const titles = [];
    // sort by year.
    let cumulativeAtEndOfYear = 0;
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
        cumulativeAtEndOfYear = parseFloat(sliced[sliced.length-1][1])
        titles.push(i);
    }
    console.log(choppedByYear);

    // add all 366 days worth to choppedByYear. Leap year use is intended.
    let base = '01-01-2020'
    let seconds = Date.parse(base) / 1000;
    let day = 0;
    let dayIndexes = [];
    for (let j = 0; j < choppedByYear.length; j++) {
        dayIndexes.push(0)
    }

    const ar = [];

    while (day < 366) {
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
        ar.push(subArray);
    }
    return {data: ar, dataTitles: titles, unit: units[variableToParse]};
}

function drawTrendGraph() {

    const trendObj = processTrendData()
    const data = trendObj.data;
    const titles = trendObj.dataTitles;
    var dataSet = anychart.data.set(data);
    const series = [];
    const seriesColors = ['lime', 'orange', 'red', 'cornflowerblue', 'darkblue', 'darkgreen']

    for (let i = 1; i < data[0].length; i++) {
        series.push(dataSet.mapAs({x: 0, value: i}));
    }
  
    // create a line chart
    var chart = anychart.line();

    // set the y axis title
    chart.yAxis().title('Distance (mi)');

    // turn on the crosshair
    chart.crosshair().enabled(true).yLabel(false).yStroke(null);

    for (let i = 0; i < series.length; i++) {
        let lineStroke = 2;
        if (titles[i] == new Date().getFullYear()) {
            // if it's current.
            lineStroke = 6;
        }
        const ser = chart.line(series[i]);
        ser.name(titles[i])
      .stroke(lineStroke + ' ' + seriesColors[i])
      .tooltip()
      .format(titles[i] + ' Distance : {%value} mi');
    }

    // turn the legend on
    chart.legend().enabled(true);

    // set the container id for the line chart
    chart.container('yearTrendDiv');

    // draw the line chart
    chart.draw();
}
