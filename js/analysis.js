function runAnalysis() {
    const data = processAllActivitiesByDayAndProperty(allActivities, "elevation").data
    const analyzedData = [];
    // sort by week.

    let sum = 0;
    let numberOfDaysActive = 0;
    let subData = [];
    for (let i = 0; i < data.length; i++) {
        
        let date = new Date(data[i].date)
        if (date.getDay() === 1) {
            // if it's monday
            analyzedData.push({title: "Week of x ", value: sum, daysActive: numberOfDaysActive, activities: subData})
            
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
}