function createSummaryPage() {
    // this function generates an object per date.
    createCumulativeGraph("distance", "distSummary", "Total Miles");
    createCumulativeGraph("kudos", "kudosSummary", "Total Kudos");
    createCumulativeGraph("elevation", "elevSummary", "Total Elevation");
    createCumulativeGraph("time", "timeSummary", "Time Active");
}

function createCumulativeGraph(property, divName, subText) {

    // create skeleton
    const summaryDiv = document.createElement("div");
    summaryDiv.className = "indivSummaryDiv";
    summaryDiv.id = divName;
    document.getElementById("summaryDiv").appendChild(summaryDiv);

    const infoDiv = document.createElement("div");
    infoDiv.className = "indivSummaryDivInfo";
    infoDiv.id = divName + "-info"
    document.getElementById(divName).appendChild(infoDiv);

    const allActivitiesByDay = [];
    const chartData = [];

    // sort allActivities by date.
    for (let i = 1; i < allActivities.length; i++) {
        let currentElement = allActivities[i];
        let lastIndex = i - 1;
  
        while (lastIndex >= 0 && allActivities[lastIndex].parsedNumericalDate > currentElement.parsedNumericalDate) {
            allActivities[lastIndex + 1] = allActivities[lastIndex];
            lastIndex--;
        }
        allActivities[lastIndex + 1] = currentElement;
    }

    // process data
    let currIndex = 0;
    let cum = 0;
    for (let start = allActivities[0].parsedNumericalDate; start < Date.now() / 1000; start+=86400) {
        console.log("==============================");
        let refDateObj = new Date(start * 1000);
        console.log("reference date is: " + refDateObj);
        let activityDateObj = allActivities[currIndex].startDate.split("T")[0];
        
        let total = 0;
        while (activityDateObj.split("-")[0] == refDateObj.getFullYear() && activityDateObj.split("-")[1] - 1 == refDateObj.getMonth() && activityDateObj.split("-")[2] == refDateObj.getDate() && currIndex <= allActivities.length) {
            
            total += allActivities[currIndex][property]
            cum += allActivities[currIndex][property]
            console.log("Added " + activityDateObj + " to list")
            if (currIndex < allActivities.length - 1) {
                currIndex++;
                activityDateObj = allActivities[currIndex].startDate.split("T")[0];
                
            } else {
                break;
            }
        }
        allActivitiesByDay.push({date: refDateObj, distance: total, cumulative: cum})
        const refDateString = (refDateObj.getMonth()+1) + "-" + refDateObj.getDate() + "-" + refDateObj.getFullYear()
        chartData.push([refDateString, cum.toFixed(2)])
    }

    const totalText = document.createElement("p");
    if (property == "time") {
        totalText.innerHTML = convert(Math.trunc(cum));
    } else {
        totalText.innerHTML = cum.toFixed(2);
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

    // create the graph
    // create a data set
    var dataSet = anychart.data.set(chartData);
  
    // map the data for all series
    var firstSeriesData = dataSet.mapAs({x: 0, value: 1});
  
    // create a line chart
    var chart = anychart.line();
    chart.yAxis().enabled(false);
    chart.background().fill("transparent");
  
    // create the series and name them
    var firstSeries = chart.spline(firstSeriesData);
    firstSeries.name("Total Miles")
    .stroke('5 #f49595')
    .tooltip()
    .format("Total miles: {%value}");
    
    // specify where to display the chart
    chart.container(divName + "-graphHolder");
    
    // draw the resulting chart
    chart.draw();
}