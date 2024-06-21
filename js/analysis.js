function runAnalysis() {
    let variableToAnalyze = document.getElementsByName('analysisVariable')[0].value
    let calculationMethod = document.getElementsByName('analysisVariableSetting')[0].value
    let data;
    if (calculationMethod === "cumulative") {
        data = processAllActivitiesByDayAndProperty(allActivities, variableToAnalyze).data
    } else {
        data = processAllActivitiesByDayAndProperty(allActivities, variableToAnalyze, 10000, true).data
    }
    
    const analyzedData = [];
    // sort by week.

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

    let sum = 0;
    let numberOfDaysActive = 0;
    let subData = [];
    for (let i = 0; i < data.length; i++) {
        
        let date = new Date(data[i].date)
        if (date.getDay() === 1) {
            // if it's monday

            // get the current numerical date
            let dateOneDayAgo = new Date(Date.parse(date) - 86400000)
            const currentNumericalDate = (dateOneDayAgo.getMonth()+1) + "/" + dateOneDayAgo.getDate() + "/" + dateOneDayAgo.getFullYear().toString().substring(2) 
            // get the date one week ago
            let prevDate = new Date(Date.parse(date) - 604800000)
            const prevNumericalDate = (prevDate.getMonth()+1) + "/" + prevDate.getDate() + "/" + prevDate.getFullYear().toString().substring(2)

            if (calculationMethod === "cumulative") {
                // add the cumulative.
                analyzedData.push({title: prevNumericalDate + "-" + currentNumericalDate, value: sum, daysActive: numberOfDaysActive, activities: subData})
            } else {
                // add the average per day.
                if (numberOfDaysActive == 0) {
                    analyzedData.push({title: prevNumericalDate + "-" + currentNumericalDate, value: 0, daysActive: numberOfDaysActive, activities: subData})
                } else {
                    analyzedData.push({title: prevNumericalDate + "-" + currentNumericalDate, value: (sum/numberOfDaysActive), daysActive: numberOfDaysActive, activities: subData})
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
    createBreakdown(analyzedData)
}

function createBreakdown(array) {
    var paras = document.getElementsByClassName('analysisVerticalOuterContainer');

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
        const maxArrayLength = 25;
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
            verticalHolderStat.innerHTML = array[i].value.toFixed(2);
        }else{
            verticalHolderStat.innerHTML = array[i].value.toFixed(2);
            verticalHolderStat.style.fontSize = "0px";
            //creating overflow text on the top of the
            var verticalHolderStatTop = document.createElement("p");
            verticalHolderStatTop.className = "analysisVerticalHolderStatTop";
            verticalHolderStatTop.innerHTML = array[i].value.toFixed(2);
            verticalHolderStatTop.style.bottom = ((array[i].value / maximum) * (window.innerHeight * 0.3)) + "px"
            document.getElementsByClassName("analysisVerticalHolder")[i].appendChild(verticalHolderStatTop);
        }
        
        verticalHolderStat.style.backgroundColor = "seagreen"
        verticalHolderStat.style.height = ((array[i].value / maximum) * (window.innerHeight * 0.3)) + "px";
        verticalHolderStat.style.marginTop = (((maximum - array[i].value) / maximum) * (window.innerHeight * 0.3)) + "px";
        verticalHolderStat.style.width = "100%";
        document.getElementsByClassName("analysisVerticalHolder")[i].appendChild(verticalHolderStat);
    }
}
