let graphDetail;

function createSummaryPage() {
    createQuickStats();
    createCumulativeTrends();
}

function createQuickStats() {
    console.log(processAllActivitiesByDayAndProperty(allActivities, "distance", 30, true))
    const statisticsToIterate = [
        {display: "Days Active", property: null, unit: ' days'}, 
        {display: "Miles", property: "distance", unit: 'mi'},
        {display: "Elevation", property: "elevation", unit: 'ft'},
        {display: "Active Time", property: "time", unit: ''},
        {display: "Total Kudos", property: "kudos", unit: ''},
        {display: "Avg Pace", property: null, unit: '/mi'},
    ]

    const toDelete = document.getElementsByClassName('statisticHolder');
    while(toDelete[0]) {
        toDelete[0].parentNode.removeChild(toDelete[0]);
    }

    const IDsToAddStatisticsTo = ['yearStatistics', 'monthStatistics', 'weekStatistics']
    const numberOfDaysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 31 /*for extra */];

    IDsToAddStatisticsTo.forEach(id => {
        let totalMilesCurrent, totalTimeCurrent, totalMilesPrevious, totalTimePrevious // used to calculate average pace
        for (let i = 0; i < statisticsToIterate.length; i++) {
            const outerStatisticWrapper = document.createElement('div');
            outerStatisticWrapper.className  = 'statisticHolder';
            
            // create the highlighted text
            const innerStatisticText = document.createElement('p');
            innerStatisticText.className = 'quickStatisticHighlight';
            innerStatisticText.innerHTML = '<span>' + statisticsToIterate[i].display + '</span><b></b>'
            outerStatisticWrapper.appendChild(innerStatisticText);

            // create and compute the numbers
            
            let byDays;
            if (statisticsToIterate[i].property){
                byDays = processAllActivitiesByDayAndProperty(allActivities, statisticsToIterate[i].property);
            } else if (statisticsToIterate[i].display == "Days Active") {
                byDays = processAllActivitiesByDayAndProperty(allActivities, "distance");
            } else if (statisticsToIterate[i].display == "Avg Pace") {
                byDays = processAllActivitiesByDayAndProperty(allActivities, "distance");
            }

            const dateArray = byDays.data.map(e => e.date);
            let filterIndex, startPrevious, endPrevious, startDateDisplay, endDateDisplay;

            if (id === "yearStatistics" ) {
                filterIndex = dateArray.indexOf('1-1-' + new Date().getFullYear());
                startPrevious = dateArray.indexOf('1-1-' + (new Date().getFullYear() - 1));
                endPrevious = dateArray.indexOf((new Date().getMonth() + 1) + "-" + new Date().getDate() + "-" + (new Date().getFullYear() - 1))

                startDateDisplay = '1/1/' + (new Date().getFullYear() - 1)
                endDateDisplay = (new Date().getMonth() + 1) + "/" + new Date().getDate() + "/" + (new Date().getFullYear() - 1)

            } else if (id === "monthStatistics") {
                filterIndex = dateArray.indexOf((new Date().getMonth() + 1) + "-1-" + new Date().getFullYear())
                let prevmonth = new Date().getMonth() ; // previous month
                let year = new Date().getFullYear();
                if (prevmonth === 0) {
                    // if the current month is january, then previous month is december of last year.
                    prevmonth = 12;
                    year = new Date().getFullYear() - 1;
                }
                startPrevious = dateArray.indexOf((prevmonth)  + '-1-' + year);
                // to make sure the day of the month doesn't overflow
                if (numberOfDaysPerMonth[prevmonth-1] >= new Date().getDate()) {
                    endPrevious = dateArray.indexOf((prevmonth) + '-' + new Date().getDate() + '-' + year);
                } else {
                    endPrevious = dateArray.indexOf((prevmonth) + '-' + numberOfDaysPerMonth[prevmonth-1]+ '-' + year);
                }

                startDateDisplay = prevmonth + '/1/' + year;
                endDateDisplay = prevmonth + '/' + new Date().getDate() + '/' + year;

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
            let rawCurrentTotal;
            if (statisticsToIterate[i].display == "Days Active") {
                rawCurrentTotal = totalFromDate(byDays.data, filterIndex, null, true);
            } else {
                rawCurrentTotal = totalFromDate(byDays.data, filterIndex, null, false);
            }
            
            let total;
            if (statisticsToIterate[i].property == "time") {
                total = convert(rawCurrentTotal)
                totalTimeCurrent = rawCurrentTotal;
            } else {
                if (statisticsToIterate[i].property == "distance") {
                    totalMilesCurrent = rawCurrentTotal;
                }

                if (statisticsToIterate[i].display == "Avg Pace") {
                    rawCurrentTotal = totalTimeCurrent / totalMilesCurrent;
                    total = convert((totalTimeCurrent / totalMilesCurrent), 2);
                } else {
                    total = rawCurrentTotal;
                }
            }
            
            innerStatisticText.getElementsByTagName('b')[0].innerHTML = total + statisticsToIterate[i].unit ;
            
            // also compute the previous timeframe's cumulatives and create the statistic comparison div
            const sub = document.createElement('p');
            sub.className = 'quickStatisticComparison';

            let rawPreviousTotal;
            if (statisticsToIterate[i].display == "Days Active") {
                rawPreviousTotal = totalFromDate(byDays.data, startPrevious, endPrevious, true);
            } else {
                rawPreviousTotal = totalFromDate(byDays.data, startPrevious, endPrevious, false);
            }
            
            if (statisticsToIterate[i].property == "time") {
                total = convert(rawPreviousTotal)
                totalTimePrevious = rawPreviousTotal;
            } else { 
                if (statisticsToIterate[i].property == "distance") {
                    totalMilesPrevious = rawPreviousTotal;
                }
    
                if (statisticsToIterate[i].display == "Avg Pace") {
                    rawPreviousTotal = totalTimePrevious / totalMilesPrevious;
                    total = convert((totalTimePrevious / totalMilesPrevious), 2);
                } else {
                    total = rawPreviousTotal;
                }
            }

            let percentage;
            if (rawCurrentTotal > rawPreviousTotal) {
                if (statisticsToIterate[i].display == "Avg Pace") {
                    percentage = "▼" + (((rawCurrentTotal / rawPreviousTotal) * 100) - 100).toFixed(2) + "%"
                } else {
                    percentage = "▲" + (((rawCurrentTotal / rawPreviousTotal) * 100) - 100).toFixed(2) + "%"
                }
                
            } else {
                if (statisticsToIterate[i].display == "Avg Pace") {
                    percentage = "▲" + (((rawPreviousTotal - rawCurrentTotal) / rawPreviousTotal) * 100).toFixed(2) + "%"
                } else {
                    percentage = "▼" + (((rawPreviousTotal - rawCurrentTotal) / rawPreviousTotal) * 100).toFixed(2) + "%"
                }
            }
            
            let timeIndicator;
            if (id === 'yearStatistics') {
                timeIndicator = "Last yr"
            } else if (id === 'monthStatistics') {
                timeIndicator = "Last mth"
            } else {
                timeIndicator = "Last wk"
            }
            
            /* sub.innerHTML = 'Totals from <b>' + startDateDisplay + '</b> to <b>' + endDateDisplay + '</b>: ' + total + statisticsToIterate[i].unit + ' (' + percentage + ')';  */
            if (rawPreviousTotal) {
                sub.innerHTML = timeIndicator + ": " + total + statisticsToIterate[i].unit + " (" + percentage + ")"
            } else {
                sub.innerHTML = "No available data for " + timeIndicator
            }
            /* + 'rawCurrentTotal is: ' + rawCurrentTotal + ' ' + 'rawPreviousTotal is: ' + rawPreviousTotal;*/
            outerStatisticWrapper.appendChild(sub);
            
            document.getElementById(id).appendChild(outerStatisticWrapper);
        }
    })
}

function totalFromDate(array, startIndex, endIndex, countingDays) {
    // array is in the form of [<date>, <cumulative>, <statistic that day>]
    // startIndex inclusive, endIndex exclusive.
    // startIndex (required), endIndex is not required. Totals the statistics between startIndex and endIndex of array.
    // countingDays (boolean), if true, the number of active dates are counted. if false, the total cumulative statistics are counted.

    if (startIndex == -1) {
        startIndex = 0;
    }

    if (endIndex == -1) {
        return 0;
    }

    if (!endIndex) {
        endIndex = array.length-1;
    }

    let total = 0;
    for (let i = startIndex; i <= endIndex; i++) {
        if (!countingDays) {
            // add cumulatives
            total+=array[i].statsThatDay;
        } else {
            // add number of days
            if (array[i].statsThatDay > 0) {
                total++;
            }
        }
    }

    if (total.toString().indexOf('.') != -1) {
        total = total.toFixed(2);
    }
    
    return total;
}

function processAllActivitiesByDayAndProperty(array, property, numberOfDays, average) {
    // a function that takes allActivities (array), and process them into the property. numberOfDays (int) and average (boolean) is optional.
    const unitsThatCanBeTotaled = ["kudos", "distance", "elevation", "time", "elapsedTime"]
    const allActivitiesByDay = [];
    const chartData = [];
    // sort allActivities by date.
    for (let i = 1; i < array.length; i++) {
        let currentElement = array[i];
        let lastIndex = i - 1;
  
        while (lastIndex >= 0 && array[lastIndex].parsedNumericalDate > currentElement.parsedNumericalDate) {
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
        // one-day total variables for weighted pace & uptime.
        let currentDistance = 0;
        let currentMovingTime = 0;
        let currentElapsedTime = 0;
        let activitiesThatDay = 0;
        let activityDetailThatDay = [];
        while (activityDateObj.split("-")[0] == refDateObj.getFullYear() && activityDateObj.split("-")[1] - 1 == refDateObj.getMonth() && activityDateObj.split("-")[2] == refDateObj.getDate() && currIndex <= array.length) {
            
            if (array[currIndex][property]) {
                /* if (property === "pace") {
                    currentDistance += array[currIndex].distance
                    currentMovingTime += array[currIndex].time
                } else if (property === "uptime") {
                    currentMovingTime += array[currIndex].time
                    currentElapsedTime += array[currIndex].elapsedTime
                } else {
                    currentVal += array[currIndex][property]
                } */
                    currentVal += array[currIndex][property]
                if (unitsThatCanBeTotaled.includes(property)) {
                    cum += array[currIndex][property]
                }
                activityDetailThatDay.push({activityTitle: array[currIndex].name, activityID: array[currIndex].id, activityIndex: currIndex, activityStat: array[currIndex][property]})
            } else {
                currentVal += 0
                cum += 0
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
            const removedFromMovingCalc = chartData[chartData.length - numberOfDays].statsThatDay
            cum -= removedFromMovingCalc
            if (removedFromMovingCalc > 0) {
                daysActive--;
            }
        }

        if (average) {
            if (daysActive == 0) {
                // chartData.push([refDateString, 0, currentVal])
                chartData.push({date: refDateString, display: 0, statsThatDay: currentVal, dayBreakdown: []})
            } else {
                chartData.push({date: refDateString, display: (cum / daysActive).toFixed(2), statsThatDay: currentVal, dayBreakdown: activityDetailThatDay})
            }
        } else {
            chartData.push({date: refDateString, display: cum.toFixed(2), statsThatDay: currentVal, dayBreakdown: activityDetailThatDay})
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

    /* createCumulativeGraph("distance", "avgMovingDistSummary", "Avg miles per day, past " + dayHistory + " d", dayHistory, true);
    createCumulativeGraph("elevation", "avgMovingElevSummary", "Avg elev gain per day, past " + dayHistory + " days", dayHistory, true);
    createCumulativeGraph("kudos", "avgMovingKudosSummary", "Avg kudos per day, past " + dayHistory + " d", dayHistory, true);
    createCumulativeGraph("uptime", "avgMovingUptimeSummary", "Avg uptime per day, past " + dayHistory + " d", dayHistory, true);
    createCumulativeGraph("time", "avgMovingTimeSummary", "Avg time per day, past " + dayHistory + " d", dayHistory, true);
    createCumulativeGraph("pace", "avgMovingPaceSummary", "Avg pace per day, past " + dayHistory + " d", dayHistory, true);
    createCumulativeGraph("incline", "avgMovingInclineSummary", "Avg incline per day, past " + dayHistory + " d", dayHistory, true); */

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
            prev = chartData[chartData.length - 1 - numberOfDays].display
            percentage = ((chartData[chartData.length - 1][1] - prev) / prev) * 100
        } else {
            prev = chartData[chartData.length - 1 - numberOfDays].display
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
    const trimBy = Math.ceil(chartData.length / graphDetail)
    const trimmedChart = [];
    for (let i = chartData.length - 1; i >= 0; i -= trimBy) {
        trimmedChart.unshift([chartData[i].date, chartData[i].display])
    }
    trimmedChart.unshift([chartData[0].date, chartData[0].display])
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

