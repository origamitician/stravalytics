const unitsThatCanBeTotaled = ["kudos", "distance", "elevation", "time", "elapsedTime"]
let graphDetail;

function createSummaryPage() {
    createQuickStats();
    createCumulativeTrends();
}

function createQuickStats() {
    const statisticsToIterate = [
        {display: "Days Active", property: null, unit: ''}, 
        {display: "Miles", property: "distance", unit: 'mi'},
        {display: "Elevation", property: "elevation", unit: 'ft'},
        {display: "Active Time", property: "time", unit: ''},
        {display: "Total Kudos", property: "kudos", unit: ''},
        {display: "Avg Pace", property: null, unit: '/mi'},
    ]

    const IDsToAddStatisticsTo = ['yearStatistics', 'monthStatistics', 'weekStatistics']

    IDsToAddStatisticsTo.forEach(id => {
        for (let i = 0; i < statisticsToIterate.length; i++) {
            const outerStatisticWrapper = document.createElement('div');
            outerStatisticWrapper.className  = 'statisticHolder';
            
            // create the highlighted text
            const innerStatisticText = document.createElement('p');
            innerStatisticText.className = 'quickStatisticHighlight';
            innerStatisticText.innerHTML = '<span>' + statisticsToIterate[i].display + '</span><b></b>'
            outerStatisticWrapper.appendChild(innerStatisticText);

            // create and compute the numbers
            
            if (statisticsToIterate[i].property){
                const byDays = processAllActivitiesByDayAndProperty(allActivities, statisticsToIterate[i].property);
                const dateArray = byDays.data.map(e => e[0]);
                let filterIndex, startPrevious, endPrevious, startDateDisplay, endDateDisplay;

                if (id === "yearStatistics" ) {
                    filterIndex = dateArray.indexOf('1-1-' + new Date().getFullYear());
                    startPrevious = dateArray.indexOf('1-1-' + (new Date().getFullYear() - 1));
                    endPrevious = dateArray.indexOf((new Date().getMonth() + 1) + "-" + new Date().getDate() + "-" + (new Date().getFullYear() - 1))

                    startDateDisplay = '1/1/' + (new Date().getFullYear() - 1)
                    endDateDisplay = (new Date().getMonth() + 1) + "/" + new Date().getDate() + "/" + (new Date().getFullYear() - 1)

                } else if (id === "monthStatistics") {
                    filterIndex = dateArray.indexOf((new Date().getMonth() + 1) + "-1-" + new Date().getFullYear())
                    let month = new Date().getMonth();
                    let year = new Date().getFullYear();
                    if (month === 0) {
                        // if the current month is january, then previous month is december of last year.
                        month = 11;
                        year = new Date().getFullYear() - 1;
                    }
                    startPrevious = dateArray.indexOf((month)  + '-1-' + year);
                    endPrevious = dateArray.indexOf((month) + '-' + new Date().getDate() + '-' + year);

                    startDateDisplay = month + '/1/' + year;
                    endDateDisplay = month + '/' + new Date().getDate() + '/' + year;

                } else if (id === "weekStatistics") {
                    const prevSunday = new Date(Date.now() - (86400000*new Date().getDay()))
                    filterIndex = dateArray.indexOf((prevSunday.getMonth() + 1)  + "-" + prevSunday.getDate() + "-" + prevSunday.getFullYear())

                    const twoSundaysAgo = new Date(Date.now() - (86400000*new Date().getDay()) - 604800000)
                    startPrevious = dateArray.indexOf((twoSundaysAgo.getMonth() + 1)  + "-" + twoSundaysAgo.getDate() + "-" + twoSundaysAgo.getFullYear())
                    startDateDisplay = (twoSundaysAgo.getMonth() + 1)  + "/" + twoSundaysAgo.getDate() + "/" + twoSundaysAgo.getFullYear()

                    const aWeekAgo = new Date(Date.now() - 604800000);
                    endPrevious = dateArray.indexOf((aWeekAgo.getMonth() + 1)  + "-" + aWeekAgo.getDate() + "-" + aWeekAgo.getFullYear())
                    endDateDisplay = (aWeekAgo.getMonth() + 1)  + "/" + aWeekAgo.getDate() + "/" + aWeekAgo.getFullYear()
                }
                
                let rawCurrentTotal = totalFromDate(byDays.data, filterIndex);
                let total;
                if (statisticsToIterate[i].property == "time") {
                    total = convert(rawCurrentTotal)
                } else {
                    total = rawCurrentTotal;
                }
                
                innerStatisticText.getElementsByTagName('b')[0].innerHTML = total + statisticsToIterate[i].unit ;
                console.log("Total distance this year so far is: " + totalFromDate(byDays.data, filterIndex))
                // note that byDays.data is in the form of [<date>, <cumulative>, <statistic that day>]

                // also compute the previous timeframe's cumulatives and create the statistic comparison div
                const sub = document.createElement('p');
                sub.className = 'quickStatisticComparison';
                let rawPreviousTotal = totalFromDate(byDays.data, startPrevious, endPrevious);
                if (statisticsToIterate[i].property == "time") {
                    total = convert(rawPreviousTotal)
                } else {
                    total = rawPreviousTotal;
                }

                let percentage;
                if (rawCurrentTotal > rawPreviousTotal) {
                    percentage = "Up " + (((rawCurrentTotal / rawPreviousTotal) * 100) - 100).toFixed(2) + "%"
                } else {
                    percentage = "Down " + (((rawCurrentTotal - rawPreviousTotal) / rawPreviousTotal) * 100).toFixed(2) + "%"
                }
                /* sub.innerHTML = 'Totals from <b>' + startDateDisplay + '</b> to <b>' + endDateDisplay + '</b>: ' + total + statisticsToIterate[i].unit + ' (' + percentage + ')';  */
                sub.innerHTML = "(" + percentage + " from " + total + statisticsToIterate[i].unit + ')';
                outerStatisticWrapper.appendChild(sub);
            }
            
            document.getElementById(id).appendChild(outerStatisticWrapper);
        }
    })
    

    
}

function totalFromDate(array, startIndex, endIndex) {
    // startIndex inclusive, endIndex exclusive.
    // startIndex (required), endIndex is not required. Totals the statistics between startIndex and endIndex of array.
    if (startIndex == -1) {
        startIndex = 0;
    }

    if (endIndex == -1) {
        return 0;
    }

    if (!endIndex) {
        endIndex = array.length;
    }
    console.log("The date array that is being calculated is:")
    console.log(array);
    let total = 0;
    for (let i = startIndex; i < endIndex; i++) {
        total+=array[i][2];
    }

    if (total.toString().indexOf('.') != -1) {
        total = total.toFixed(2);
    }
    
    return total;
}

function processAllActivitiesByDayAndProperty(array, property, numberOfDays, average) {
    // a function that takes allActivities (array), and process them into the property. numberOfDays (int) and average (boolean) is optional.
    const allActivitiesByDay = [];
    const chartData = [];
    // sort allActivities by date.
    for (let i = 1; i < array.length; i++) {
        let currentElement = array[i];
        let lastIndex = i - 1;
  
        while (lastIndex >= 0 && allActivities[lastIndex].parsedNumericalDate > currentElement.parsedNumericalDate) {
            array[lastIndex + 1] = array[lastIndex];
            lastIndex--;
        }
        array[lastIndex + 1] = currentElement;
    }

    // process data
    let currIndex = 0;
    let cum = 0;
    let daysActive = 0;
    for (let start = array[0].parsedNumericalDate; /*start < Date.parse(document.getElementsByName("endDate")[0].value) / 1000*/ start < Date.now() / 1000; start+=86400) {
        let refDateObj = new Date(start * 1000);
        let activityDateObj = array[currIndex].startDate.split("T")[0];
        
        let currentVal = 0; //only gets the total in one day, resets the next day.
        let activitiesThatDay = 0;
        while (activityDateObj.split("-")[0] == refDateObj.getFullYear() && activityDateObj.split("-")[1] - 1 == refDateObj.getMonth() && activityDateObj.split("-")[2] == refDateObj.getDate() && currIndex <= array.length) {
            
            currentVal += array[currIndex][property]
            if (unitsThatCanBeTotaled.includes(property)) {
                cum += array[currIndex][property]
            }
            
            activitiesThatDay ++;
            if (currIndex < array.length - 1) {
                currIndex++;
                activityDateObj = array[currIndex].startDate.split("T")[0];
                
            } else {
                break;
            }
        }

        if (average && activitiesThatDay > 0 && !unitsThatCanBeTotaled.includes(property)) {
            currentVal /= activitiesThatDay;
            cum+=currentVal;
        }

        if (currentVal > 0) {
            daysActive ++;
        }

        allActivitiesByDay.push({date: refDateObj, distance: currentVal, cumulative: cum})
        const refDateString = (refDateObj.getMonth()+1) + "-" + refDateObj.getDate() + "-" + refDateObj.getFullYear()
        
        if(numberOfDays && chartData.length >= numberOfDays) {
            // console.log("Subtracting cum by " + chartData[chartData.length - numberOfDays][2])
            const removedFromMovingCalc = chartData[chartData.length - numberOfDays][2]
            cum -= removedFromMovingCalc
            if (removedFromMovingCalc > 0) {
                daysActive--;
            }
        }

        if (average) {
            if (daysActive == 0) {
                chartData.push([refDateString, 0, currentVal])
            } else {
                chartData.push([refDateString, (cum / daysActive).toFixed(2), currentVal])
            }
        } else {
            chartData.push([refDateString, cum.toFixed(2), currentVal])
        }
    }
    return {data: chartData, cumulative: cum, daysActive: daysActive};
}

async function createCumulativeTrends() {
    // this function generates an object per date.
    const current = Date.now();
    var toDelete = document.getElementsByClassName('indivSummaryDiv');
    // const dayHistory = Math.abs(Math.trunc(document.getElementsByName('numberOfDays')[0].value));
    const dayHistory = 30; // <------- CHANGE THIS !!!!
    if (dayHistory >= allActivities.length) {
        dayHistory = allActivities.length - 1;
    }
    while(toDelete[0]) {
        toDelete[0].parentNode.removeChild(toDelete[0]);
    }

    document.getElementById("summaryDivWelcomeMsg").innerHTML = `Welcome, ${localStorage.stravaName}!`;

    let now = Date.now();
    console.log ((now - current) / 1000 + "seconds have elapsed to delete.")

    // -- deleted all elements, figuring out graph detail -- //

    /*var ele = document.getElementsByName('lagOption');
    for (i = 0; i < ele.length; i++) {
        if (ele[i].checked){
            graphDetail = ele[i].value
        }
    }*/ // commenting this out do to removal of option on the home page.

    graphDetail = 200; // <------- CHANGE THIS !!!!

    // -- found out graph detail - creating new elements -- //

    createCumulativeGraph("distance", "distSummary", "Total Miles");
    createCumulativeGraph("distance", "movingDistSummary", "Miles in past " + dayHistory + " days", dayHistory);
    createCumulativeGraph("kudos", "kudosSummary", "Total Kudos");
    createCumulativeGraph("kudos", "movingKudosSummary", "Kudos in past " + dayHistory + " days", dayHistory);
    createCumulativeGraph("elevation", "elevSummary", "Total Elevation");
    createCumulativeGraph("elevation", "movingElevSummary", "Elevation in past " + dayHistory + " days", dayHistory);
    createCumulativeGraph("time", "timeSummary", "Time Active");
    createCumulativeGraph("time", "movingTimeSummary", "Active time in past " + dayHistory + " days", dayHistory);

    /*const hr = document.createElement("hr");
    hr.style.marginTop = "5%";
    hr.style.marginBottom = "5%";
    document.getElementById("summaryDiv").appendChild (hr);*/

    /*createCumulativeGraph("distance", "avgMovingDistSummary", "Avg miles per day, past " + dayHistory + " d", dayHistory, true);
    createCumulativeGraph("elevation", "avgMovingElevSummary", "Avg elev gain per day, past " + dayHistory + " days", dayHistory, true);
    createCumulativeGraph("kudos", "avgMovingKudosSummary", "Avg kudos per day, past " + dayHistory + " d", dayHistory, true);
    createCumulativeGraph("uptime", "avgMovingUptimeSummary", "Avg uptime per day, past " + dayHistory + " d", dayHistory, true);
    createCumulativeGraph("time", "avgMovingTimeSummary", "Avg time per day, past " + dayHistory + " d", dayHistory, true);
    createCumulativeGraph("pace", "avgMovingPaceSummary", "Avg pace per day, past " + dayHistory + " d", dayHistory, true);
    createCumulativeGraph("incline", "avgMovingInclineSummary", "Avg incline per day, past " + dayHistory + " d", dayHistory, true);*/

    // let rendered = Date.now();
    // document.getElementById("debugDuration").innerHTML = "Deletion time: " + (now - current) / 1000 + "s; Drawing time: " + (rendered - now) / 1000 + "s";

}

function createCumulativeGraph(property, divName, subText, numberOfDays, average) {
    // numberOfDays is an optional parameter. 90 = 90 day moving totals.
    // "average" parameter is a boolean. If true, the moving avg is computed. If not, the moving totals are computed.

    // create skeleton
    const summaryDiv = document.createElement("div");
    summaryDiv.className = "indivSummaryDiv";
    summaryDiv.id = divName;
    document.getElementById("summaryDiv").appendChild(summaryDiv);

    const infoDiv = document.createElement("div");
    infoDiv.className = "indivSummaryDivInfo";
    infoDiv.id = divName + "-info"
    document.getElementById(divName).appendChild(infoDiv);

    const processedByDay = processAllActivitiesByDayAndProperty(allActivities, property, numberOfDays, average)
    const chartData = processedByDay.data;
    const cum = processedByDay.cumulative
    const daysActive = processedByDay.daysActive;

    const totalText = document.createElement("p");
    if (property == "time" || property == "pace") {
        if (average) {
            totalText.innerHTML = convert(Math.trunc(cum / daysActive));
        } else {
            totalText.innerHTML = convert(Math.trunc(cum));
        }
    } else {
        if (average) {
            totalText.innerHTML = (cum / daysActive).toFixed(2);
        } else {
            totalText.innerHTML = cum.toFixed(2);
        }
    }
    
    totalText.className = "summaryTotalText";
    document.getElementById(divName + "-info").appendChild(totalText);
    
    const sub = document.createElement("p");
    sub.innerHTML = subText
    sub.className = "summarySubText";
    document.getElementById(divName + "-info").appendChild(sub);

    const graphDiv = document.createElement("div");
    graphDiv.className = "indivSummaryDivGraphHolder";
    graphDiv.id = divName + "-graphHolder"
    document.getElementById(divName).appendChild(graphDiv);
    
    let prev, percentage;
    if (numberOfDays) {
        const diff = document.createElement("p");
        
        if (average) {
            prev = chartData[chartData.length - 1 - numberOfDays][1]
            percentage = ((chartData[chartData.length - 1][1] - prev) / prev) * 100
        } else {
            prev = chartData[chartData.length - 1 - numberOfDays][1]
            percentage = ((cum - prev) / prev) * 100
        }
        
        if (property == "time" || property == "pace") {
            prev = convert(Math.trunc(prev));
        }

        if (percentage > 0) {
            diff.innerHTML = "▲ Up <b>" + percentage.toFixed(2) + "%</b> from " + prev
            diff.style.color = "green";
        } else {
            diff.innerHTML = "▼ Down <b>" + percentage.toFixed(2) + "%</b> from " + prev
            diff.style.color = "blue";
        }
        
        diff.className = "summaryDiffText";
        document.getElementById(divName + "-info").appendChild(diff);
    }

    // trim the chart data into only ~100 entries to reduce lag.

    console.log("Graph Detail is: " + graphDetail);
    const trimBy = Math.ceil(chartData.length / graphDetail)
    const trimmedChart = [];
    for (let i = chartData.length - 1; i >= 0; i -= trimBy) {
        trimmedChart.unshift([chartData[i][0], chartData[i][1]])
    }
    trimmedChart.unshift([chartData[0][0], chartData[0][1]])
    // console.log(trimmedChart)
    
    // create the graph
    // create a data set
    var dataSet = anychart.data.set(trimmedChart);
  
    // map the data for all series
    var firstSeriesData = dataSet.mapAs({x: 0, value: 1});
  
    // create a line chart
    var chart = anychart.line();
    chart.yAxis().enabled(false);
    chart.background().fill("transparent");
  
    // create the series and name them
    var firstSeries = chart.spline(firstSeriesData);
    if (!numberOfDays) {
        const gr = firstSeries.name("").stroke('5 #ff950a').tooltip()
        if (property == "time") {
            gr.format(function (e){
                return convert(this.value)
            });
        } else {
            gr.format("{%value}");
        }
        
    } else if (numberOfDays && percentage > 0){
        const gr = firstSeries.name("").stroke('5 #0af570').tooltip()
        if (property == "time") {
            gr.format(function (e){
                return convert(this.value)
            });
        } else if (property == "pace") {
            gr.format(function (e){
                return convert(this.value, 2)
            });
        } else {
            gr.format("{%value}");
        }
        
    } else {
        const gr = firstSeries.name("").stroke('5 #0a95ff').tooltip()
        if (property == "time") {
            gr.format(function (e){
                return convert(this.value)
            });
        } else if (property == "pace") {
            gr.format(function (e){
                return convert(this.value, 2)
            });
        } else {
            gr.format("{%value}");
        }
    }
    
    // specify where to display the chart
    chart.container(divName + "-graphHolder");
    
    // draw the resulting chart
    chart.draw();
}

function convertToDays(seconds) {
    let resultantString = "";
    if (seconds >= 86400) {
        resultantString += Math.floor(seconds / 86400) + "d "
        resultantString += convertToDays (seconds % 86400);
    } else if (seconds >= 3600) {
        resultantString += Math.floor(seconds / 3600) + "hr "
        resultantString += convertToDays (seconds % 3600);
    } else if (seconds >= 60) {
        resultantString += Math.floor(seconds / 60) + "min "
        resultantString += convertToDays (seconds % 60);
    } else {
        resultantString += seconds + "s";
    }

    return resultantString;
}

