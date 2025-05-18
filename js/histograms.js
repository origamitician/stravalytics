//all variables + bargraph info is here;

var startDate = Math.floor(Date.parse("01-01-2023") / 1000)
var endDate = Math.floor(Date.now() / 1000);
let scrub;


if (window.innerWidth > window.innerHeight) {
    // landscape mode
    scrub = {
        pace: {left: 260, right: 600, increment: 20, leftOutlier: true, rightOutlier: true, totalBars: null, color: "#149c1f", color2: "#6e2aad", unit: "seconds/mi", abbrUnit: "/mi"},
        uptime: {left: 60, right: 100, increment: 2, leftOutlier: true, rightOutlier: false, totalBars: null, color: "#b33bad", color2: "#2aad76", unit: "%", abbrUnit: "%"},
        distance: {left: 0, right: 15, increment: 1, leftOutlier: false, rightOutlier: true, totalBars: null, color: "#1688b5", color2: '#ad2a3e', unit: "miles", abbrUnit: "mi"},
        elevation: {left: 10, right: 510, increment: 25, leftOutlier: true, rightOutlier: true, totalBars: null, color: "#ff8400", color2: '#b80000', unit: "feet", abbrUnit: "ft"},
    }
} else {
    // portrait mode
    scrub = {
        pace: {left: 260, right: 600, increment: 34, leftOutlier: true, rightOutlier: true, totalBars: null, color: "#149c1f", color2: "#6e2aad", unit: "seconds/mi", abbrUnit: ""},
        uptime: {left: 60, right: 100, increment: 4, leftOutlier: true, rightOutlier: false, totalBars: null, color: "#b33bad", color2: "#2aad76", unit: "%", abbrUnit: "%"},
        distance: {left: 0, right: 15, increment: 1.5, leftOutlier: false, rightOutlier: true, totalBars: null, color: "#1688b5", color2: '#ad2a3e', unit: "miles", abbrUnit: "mi"},
        elevation: {left: 10, right: 510, increment: 50, leftOutlier: true, rightOutlier: true, totalBars: null, color: "#ff8400", color2: '#b80000', unit: "feet", abbrUnit: "ft"},
    }
}

// to establish gradients. Totally didn't copy this from StackOverflow
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
  
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

//variables for graph
var dist_distribution = []
var pace_distribution = [];
var elev_distribution = [];
var elapsed_distribution = [];

//helper function to convert seconds to m:ss

function convert(seconds, decimalPlaces){
    let numOfDecimals;
    if (!decimalPlaces) {
        numOfDecimals = 0;
    } else {
        numOfDecimals = decimalPlaces;
    }

    if(seconds >= 3600){
        if(seconds % 3600 >= 600) {
            return Math.floor(seconds / 3600) + ":" +convert(seconds % 3600)
        }else{
            return Math.floor(seconds / 3600) + ":0" +convert(seconds % 3600)
        }
        
    }
    if(seconds % 60 >= 10){
        return Math.floor(seconds / 60) + ":" + (seconds % 60).toFixed(numOfDecimals);
    }else{
        return Math.floor(seconds / 60) + ":0" + (seconds % 60).toFixed(numOfDecimals);
    }
}

function revertToDefaultStatistics(array){
    for(var i = 0; i < array.length; i++){
        array[i].count = 0
        array[i].total_elevation_gain = 0;
        array[i].most_elevation_gain = -1;
        array[i].least_elevation_gain = 2147483687;
        array[i].total_miles = 0;
        array[i].most_miles = -1;
        array[i].least_miles = 2147483687;
        array[i].total_time = 0;
        array[i].most_time = -1;
        array[i].least_time = 2147483647;
        array[i].total_elapsed_time = 0;
        array[i].list_of_activities = [];
    }
}

function updateDefaultStatistics(array, index, inputObject){
    //update these regardless of index
    array[index].count++;
    array[index].total_elevation_gain+=inputObject.elevation
    array[index].total_miles+=inputObject.distance;
    array[index].total_time+=inputObject.time;
    array[index].total_elapsed_time+=inputObject.elapsedTime;
    array[index].list_of_activities.push(inputObject);

    if(inputObject.elevation > array[index].most_elevation_gain){
        array[index].most_elevation_gain = inputObject.elevation;
    }

    if (inputObject.elevation < array[index].least_elevation_gain){
        array[index].least_elevation_gain = inputObject.elevation;
    }

    if(inputObject.distance> array[index].most_miles){
        array[index].most_miles = inputObject.distance
    }

    if(inputObject.distance < array[index].least_miles){
        array[index].least_miles = inputObject.distance
    }
}

function showMoreStats(){
    //process - get index and graph type from the id that was clicked.
    var processed = this.id.split("-");
    for(let i = 0; i <  document.getElementById(processed[1]).getElementsByClassName("verticalHolder").length; i++){
        document.getElementById(processed[1]).getElementsByClassName("verticalHolder")[i].style.border = "0px solid black";
        //document.getElementById(processed[1]).getElementsByClassName("verticalHolder")[i].addEventListener("mouseover", () => {this.style.border = "2px solid black"})
        //console.log("removing all borders")
    }
    
    this.style.border = "2px dotted black";
    document.getElementById(processed[1] + "_wrapper").style.display = "block";
    document.getElementById(processed[1] + "_wrapper").style.display = "flex";
    if(processed[1] == "dist_distribution"){
        showStatsOnHTML(dist_distribution, processed[1], parseInt(processed[0]), processed[2])
    }else if(processed[1] == "pace_distribution"){
        showStatsOnHTML(pace_distribution, processed[1], parseInt(processed[0]), processed[2])
    }else if(processed[1] == "elev_distribution"){
        showStatsOnHTML(elev_distribution, processed[1], parseInt(processed[0]), processed[2])
    }else if(processed[1] == "time_distribution"){
        showStatsOnHTML(elapsed_distribution, processed[1], parseInt(processed[0]), processed[2])
    }
    let span1 = document.getElementById(processed[1] + "_counter").getElementsByTagName("span")[0]
    let span2 = document.getElementById(processed[1] + "_counter").getElementsByTagName("span")[1]

    span1.innerHTML = document.getElementById(processed[1]).getElementsByClassName("verticalHolderStat")[processed[0]].innerHTML;
    span1.style.color = processed[2];
    span1.parentElement.style.borderLeft = "5px solid " + processed[2];
    span1.style.fontWeight = "bold";

    span2.innerHTML = document.getElementById(processed[1]).getElementsByClassName("verticalHolderBelow")[processed[0]].innerHTML;
    span2.style.color = processed[2];
    span2.style.fontWeight = "bold";
}

function disableStats(){
    var processed = this.id.split("-");
    document.getElementById(processed[1] + "_info").innerHTML = "Hover over graph to show more details!"
}

function showStatsOnHTML(array, location, id, color){
    var convertedMileTime = convert(array[id].total_time / array[id].total_miles, 2)
    var convertedKmTime = convert((array[id].total_time / array[id].total_miles) / 1.609, 2)
    //console.log(convertedMileTime)
    //console.log(convertedKmTime);
    try{
        document.getElementById(location + "_info").innerHTML = "<b> Average pace: </b>" + convertedMileTime + "/mi (" + convertedKmTime +  "/km) <br><br>" +

        "<b> Average distance: </b>" + (array[id].total_miles / array[id].count).toFixed(3) + " mi <br> (shortest " + array[id].least_miles.toFixed(3) + " mi; longest " + array[id].most_miles.toFixed(3) + " mi) <br><br>" + 

        "<b> Average elev gain: </b>" +  (array[id].total_elevation_gain / array[id].count).toFixed(2) + " ft <br>(highest " + array[id].most_elevation_gain.toFixed(2) + " ft) <br><br>" + 

        "<b> Average % uptime: </b>" + ((array[id].total_time / array[id].total_elapsed_time)*100).toFixed(2) + " %"
    }catch{
        //do nothing here since its buggy
    }

    var chartRows = document.getElementById(location + "_wrapper").getElementsByClassName('outerDiv');

    while(chartRows[0]) {
        chartRows[0].parentNode.removeChild(chartRows[0]);
    }

    if((document.getElementById(location + "_wrapper").getElementsByClassName("headerDiv")[0])){
        document.getElementById(location + "_wrapper").getElementsByClassName("headerDiv")[0].remove()
    }

    //render the chart
    for (var i = -1; i < array[id].list_of_activities.length; i++){
        var outerDiv = document.createElement("div");
        

        if(i >= 0){
            outerDiv.className = "outerDiv";
            document.getElementById(location + "_wrapper").getElementsByClassName("infoWrapperRight")[0].appendChild(outerDiv);
        }else {
                outerDiv.className = "headerDiv"
                document.getElementById(location + "_wrapper").getElementsByClassName("infoWrapperRight")[0].appendChild(outerDiv);
            
        }

        document.getElementById(location + "_wrapper").getElementsByClassName("infoWrapperRight")[0].style.height = window.innerHeight/2 + "px"

        let span;
        span = document.createElement("span");
        span.className = "indivGrid";
        //span.id = "date";
        span.style.width = "15%"
        span.style.textAlign = "left";
        if(i == -1){
            span.innerHTML = "Date"
            document.getElementById(location + "_wrapper").getElementsByClassName("headerDiv")[0].appendChild(span)
        }else{
            let date = array[id].list_of_activities[i].startDate.split("T")[0].split("-")
            span.innerHTML = date[1] + "/" + date[2] + "/" +date[0].substring(2, 4)
            document.getElementById(location + "_wrapper").getElementsByClassName("outerDiv")[i].appendChild(span)
        }
        
        span = document.createElement("span");
        span.className = "indivGrid";
        span.style.width = "25%"
        span.style.textAlign = "left";
        span.id = "runLookupLink";
        //span.id = "title";
        if(i == -1){
            span.innerHTML = "Title"
            document.getElementById(location + "_wrapper").getElementsByClassName("headerDiv")[0].appendChild(span)
        }else{
            /*if(array[id].list_of_activities[i].name.length > 30){
                var innerLink = document.createTextNode(array[id].list_of_activities[i].name.substring(0, 30) + "...");
            }else{
                var innerLink = document.createTextNode(array[id].list_of_activities[i].name);
            }
            span.appendChild(innerLink)
            span.style.color = "darkblue"
            span.setAttribute("href", "https://strava.com/activities/" + array[id].list_of_activities[i].id);
            span.setAttribute("target", "_blank");*/

            if(array[id].list_of_activities[i].name.length > 30){
                span.innerHTML = array[id].list_of_activities[i].name.substring(0, 30) + "...";
            }else{
                span.innerHTML  = array[id].list_of_activities[i].name;
            }
            span.style.color = 'darkblue';
            span.style.textDecoration = 'underline';
            span.addEventListener('click', createRunLookup.bind(this, array[id].list_of_activities[i].id))
            document.getElementById(location + "_wrapper").getElementsByClassName("outerDiv")[i].appendChild(span)
        }

        span = document.createElement("span");
        span.className = "indivGrid";
        span.style.width = "15%"
        if(location == "dist_distribution"){
            span.style.fontWeight = "bold";
            span.style.color = color;
        }
        if(i == -1){
            span.innerHTML = "Distance"
            document.getElementById(location + "_wrapper").getElementsByClassName("headerDiv")[0].appendChild(span)
        }else{
            span.innerHTML = (array[id].list_of_activities[i].distance).toFixed(3) + "mi"
            document.getElementById(location + "_wrapper").getElementsByClassName("outerDiv")[i].appendChild(span)
        }

        span = document.createElement("span");
        span.className = "indivGrid";
        span.style.width = "15%"
        if(location == "pace_distribution"){
            span.style.fontWeight = "bold";
            span.style.color = color;
        }
        if(i == -1){
            span.innerHTML = "Pace /mi"
            document.getElementById(location + "_wrapper").getElementsByClassName("headerDiv")[0].appendChild(span)
        }else{
            if(array[id].list_of_activities[i].pace == 0){
                span.innerHTML = "[INVALID]"
            }else{
                let convertedTime = (array[id].list_of_activities[i].pace)
                span.innerHTML = convert(convertedTime, 2)
            }
            
            document.getElementById(location + "_wrapper").getElementsByClassName("outerDiv")[i].appendChild(span)
        }

        span = document.createElement("span");
        span.className = "indivGrid";
        span.style.width = "15%"
        if(location == "time_distribution"){
            span.style.fontWeight = "bold";
            span.style.color = color;
        }
        if(i == -1){
            span.innerHTML = "% Uptime"
            document.getElementById(location + "_wrapper").getElementsByClassName("headerDiv")[0].appendChild(span)
        }else{
            span.innerHTML = ((array[id].list_of_activities[i].time / array[id].list_of_activities[i].elapsedTime)*100).toFixed(2) + "%";
            document.getElementById(location + "_wrapper").getElementsByClassName("outerDiv")[i].appendChild(span)
        }

        span = document.createElement("span");
        span.className = "indivGrid";
        span.style.width = "15%"
        if(location == "elev_distribution"){
            span.style.fontWeight = "bold";
            span.style.color = color;
        }
        if(i == -1){
            span.innerHTML = "Elev. gain"
            document.getElementById(location + "_wrapper").getElementsByClassName("headerDiv")[0].appendChild(span)
        }else{
            span.innerHTML = (array[id].list_of_activities[i].elevation).toFixed(2) + "ft"
            document.getElementById(location + "_wrapper").getElementsByClassName("outerDiv")[i].appendChild(span)
        }
    }
}

var totalMileage =0
var totalElevGain =0
var totalPace=0
var totalMovingTime=0
var totalElapsedTime=0

function getNumberOfBars(distribution, objectName){
    let numBars = Number(scrub[objectName].leftOutlier) + Number(scrub[objectName].rightOutlier) + (scrub[objectName].right - scrub[objectName].left) / scrub[objectName].increment
    scrub[objectName].totalBars = numBars

    for(var i = 0; i < numBars; i++){
        distribution[i] = {}
    }
}

function establishIncrements(item, value, scrubProperty, distributionToUpdate){
    // item is one individual object returned from the Strava API.
    // value is object's value in question
    if(value >= scrub[scrubProperty].right || value <= scrub[scrubProperty].left){
        //if left outlier is out
        if((scrub[scrubProperty].rightOutlier && value >= scrub[scrubProperty].right) || (!scrub[scrubProperty].rightOutlier && value == scrub[scrubProperty].right)){
            updateDefaultStatistics(distributionToUpdate, scrub[scrubProperty].totalBars-1, item);
        }      

        if((scrub[scrubProperty].leftOutlier && value <= scrub[scrubProperty].left) || (!scrub[scrubProperty].leftOutlier && value == scrub[scrubProperty].left)){
            updateDefaultStatistics(distributionToUpdate, 0, item);
        }
    }else if (value < scrub[scrubProperty].right && value > scrub[scrubProperty].left){
        if(scrub[scrubProperty].leftOutlier){
            updateDefaultStatistics(distributionToUpdate, Math.floor((value - scrub[scrubProperty].left)/ scrub[scrubProperty].increment) + 1, item);
        }else{
            if(value != scrub[scrubProperty].right && value != scrub[scrubProperty].right){
                updateDefaultStatistics(distributionToUpdate, Math.floor((value - scrub[scrubProperty].left) / scrub[scrubProperty].increment), item);
            }
        }
    }
}

function renderGraph(){
    totalMileage=0;
    totalElevGain=0;
    totalPace=0;
    totalMovingTime=0;
    totalElapsedTime=0;
     //resetting pace distributions

    getNumberOfBars(dist_distribution, "distance")
    getNumberOfBars(pace_distribution, "pace")
    getNumberOfBars(elev_distribution, "elevation")
    getNumberOfBars(elapsed_distribution, "uptime")

    revertToDefaultStatistics(dist_distribution);
    revertToDefaultStatistics(pace_distribution);
    revertToDefaultStatistics(elev_distribution);
    revertToDefaultStatistics(elapsed_distribution);
    
    var paras = document.getElementsByClassName('verticalOuterContainer');

    while(paras[0]) {
        paras[0].parentNode.removeChild(paras[0]);
    }

    //console.log(JSON.stringify(dist_distribution[0]))
    /*allActivities.forEach(e => {
        //sorts everything.
        establishIncrements(e, e.distance, "distance", dist_distribution)
        establishIncrements(e, e.pace, "pace", pace_distribution)
        establishIncrements(e, e.elevation, "elevation", elev_distribution)
        establishIncrements(e, e.uptime, "uptime", elapsed_distribution)
    })*/

    renderTypeGraph(dist_distribution, "dist_distribution", scrub.distance.color, scrub.distance.color2, "distance");
    renderTypeGraph(pace_distribution, "pace_distribution", scrub.pace.color, scrub.pace.color2, "pace");
    renderTypeGraph(elev_distribution, "elev_distribution", scrub.elevation.color, scrub.elevation.color2, "elevation");
    renderTypeGraph(elapsed_distribution, "time_distribution", scrub.uptime.color, scrub.uptime.color2, "uptime");

    console.log(dist_distribution)
}
//render

//helper method

function getBarTitles(i, scrubName, unit){
    //i is the index
    if(i == 0 && scrub[scrubName].leftOutlier){
        if(scrubName == "pace"){
            return "<" + convert(scrub[scrubName].left) + unit;
        }else{
            return "<" + (scrub[scrubName].left) + unit;
        }
        
    }else if (i == scrub[scrubName].totalBars - 1 && scrub[scrubName].rightOutlier){
        if(scrubName == "pace"){
            return  ">" + convert(scrub[scrubName].right) + unit;
        }else{
            return  ">" + (scrub[scrubName].right) + unit;
        }
        
    }else{
        if(scrubName == "pace"){
            if(!scrub[scrubName].leftOutlier){
                return (convert(scrub[scrubName].left + (i*scrub[scrubName].increment)) + "-" + convert(scrub[scrubName].left + ((i+1)*scrub[scrubName].increment)) + unit);
            }else{
                return (convert(scrub[scrubName].left + ((i-1)*scrub[scrubName].increment)) + "-" + convert(scrub[scrubName].left + ((i)*scrub[scrubName].increment)) + unit);
            }
        }else{
            if(!scrub[scrubName].leftOutlier){
                return ((scrub[scrubName].left + (i*scrub[scrubName].increment)) + "-" + (scrub[scrubName].left + ((i+1)*scrub[scrubName].increment)) + unit);
            }else{
                return ((scrub[scrubName].left + ((i-1)*scrub[scrubName].increment)) + "-" + (scrub[scrubName].left + ((i)*scrub[scrubName].increment)) + unit);
            }
        }
    }
}
var currentField = null;
function showIncrementMenu(field){
    currentField = field;
    document.getElementById("settingsTitle").innerHTML = "Edit " + field + " increments"
    document.getElementById("settingsTitle").style.color = scrub[field].color
    document.getElementById("settings").style.display = "block";
    document.getElementById("settings").style.border = "4px solid " + scrub[field].color

    document.getElementsByName("leftOutlier")[0].value = scrub[field].left;
    document.getElementsByName("rightOutlier")[0].value = scrub[field].right;
    document.getElementsByName("increment")[0].value = scrub[field].increment;

    document.getElementById("leftOutlier").innerHTML = "Include values less than " + document.getElementsByName("leftOutlier")[0].value + " " + scrub[currentField].unit + "?"

    document.getElementById("rightOutlier").innerHTML = "Include values more than " + document.getElementsByName("rightOutlier")[0].value + " " + scrub[currentField].unit + "?"

    if(scrub[field].leftOutlier){
        document.getElementsByName("leftOutlierCheck")[0].checked = true
    }else{
        document.getElementsByName("leftOutlierCheck")[0].checked = false
    }

    if(scrub[field].rightOutlier){
        document.getElementsByName("rightOutlierCheck")[0].checked = true
    }else{
        document.getElementsByName("rightOutlierCheck")[0].checked = false
    }
    
    document.getElementsByName("distributionColor")[0].value = scrub[field].color;
    document.getElementsByName("distributionColor2")[0].value = scrub[field].color2;
}

function closeSettingsMenu(){
    document.getElementById("settings").style.display = "none";
}

function applySettings(){
    const diff = Math.round((document.getElementsByName("rightOutlier")[0].value - document.getElementsByName("leftOutlier")[0].value) / document.getElementsByName("increment")[0].value)

    document.getElementsByName("rightOutlier")[0].value = parseFloat(document.getElementsByName("leftOutlier")[0].value) + (diff * parseFloat(document.getElementsByName("increment")[0].value))

    let key = currentField;
    scrub[key].left =  parseFloat(document.getElementsByName("leftOutlier")[0].value);
    scrub[key].right =  parseFloat(document.getElementsByName("rightOutlier")[0].value);
    scrub[key].increment = parseFloat(document.getElementsByName("increment")[0].value);

    scrub[key].leftOutlier = document.getElementsByName("leftOutlierCheck")[0].checked;
    scrub[key].rightOutlier = document.getElementsByName("rightOutlierCheck")[0].checked;
    scrub[key].color = document.getElementsByName("distributionColor")[0].value;
    scrub[key].color2 = document.getElementsByName("distributionColor2")[0].value;
    document.getElementById("settings").style.display = "none";

    pace_distribution = [];
    elev_distribution = [];
    dist_distribution = [];
    elapsed_distribution = [];
    renderGraph()
}

function realtimeUpdateLeft(){
    document.getElementById("leftOutlier").innerHTML = "Include values less than " + document.getElementsByName("leftOutlier")[0].value + " " + scrub[currentField].unit + "?"
}

function realtimeUpdateRight(){
    document.getElementById("rightOutlier").innerHTML = "Include values more than " + document.getElementsByName("rightOutlier")[0].value + " " + scrub[currentField].unit + "?"
}

function showPercentiles(){
    const idBreakdown = this.id.split("-");
    const displayInQuestion = document.getElementById("percentileMarkersDisplay-" + idBreakdown[1])
    displayInQuestion.style.display = "block";
    /*if (displayInQuestion.style.display == "block") {
        displayInQuestion.style.display = "none";
    } else {
        displayInQuestion.style.display = "block";
    }*/
}

function hidePercentiles() {
    const idBreakdown = this.id.split("-");
    const displayInQuestion = document.getElementById("percentileMarkersDisplay-" + idBreakdown[1])
    displayInQuestion.style.display = "none";
}

function renderTypeGraph(array, type, color, color2, sortBy){
    if(document.getElementById(type + "_breakdown").getElementsByClassName("percentileSpectrum")[0]) {
        document.getElementById(type + "_breakdown").getElementsByClassName("percentileSpectrum")[0].remove();
    }
    
    totalMileage=0;
    totalElevGain=0;
    totalPace=0;
    totalMovingTime=0;
    totalElapsedTime=0;

    const clr1 = hexToRgb(color)
    const clr2 = hexToRgb(color2)

    //array is the array that is getting iterated over
    //type is the destination where the graph is getting added
    //color is the bar color
    //sortBy is the property in question

    // sort allActivities by property in question
    for (let i = 1; i < allActivities.length; i++) {
        let currentElement = allActivities[i];
        let lastIndex = i - 1;
    
        while (lastIndex >= 0 && allActivities[lastIndex][sortBy] > currentElement[sortBy]) {
            allActivities[lastIndex + 1] = allActivities[lastIndex];
            lastIndex--;
        }
        allActivities[lastIndex + 1] = currentElement;
    }
    
    allActivities.forEach(e => {
        establishIncrements(e, e[sortBy], sortBy, array)
    })

    /* create the spectrum */
    const percentageSpectrum = document.createElement('div');
    percentageSpectrum.style.background = 'linear-gradient(to right, ' + color + ', ' + color2 + ')'
    percentageSpectrum.className = "percentileSpectrum"
    percentageSpectrum.id = type + "_spectrum"
    document.getElementById(type + "_breakdown").appendChild (percentageSpectrum);

    /* place visual percentiles */
    const percentilesOfInterest = [5, 25, 50, 75, 95];
    
    // set the minimum and maximum values
    let minValue = scrub[sortBy].left
    let maxValue = scrub[sortBy].right
    if (scrub[sortBy].leftOutlier) {
        minValue = scrub[sortBy].left - scrub[sortBy].increment;
    }

    if (scrub[sortBy].rightOutlier) {
        maxValue = scrub[sortBy].right + scrub[sortBy].increment;
    }

    const len = allActivities.length;
    for (let i = 0; i < percentilesOfInterest.length; i++) {
        let calculatedPosition = ((allActivities[Math.floor(len*(percentilesOfInterest[i]/100))][sortBy] - minValue) / (maxValue - minValue)) * 100
        if (calculatedPosition < 0) {
            calculatedPosition = 0;
        }
        if (calculatedPosition > 100) {
            calculatedPosition = 100;
        }
        const percentageInfo = document.createElement('div');
        /*percentageInfo.innerHTML = percentilesOfInterest[i] + "%: " + allActivities[Math.floor(len*(percentilesOfInterest[i]/100))][sortBy] */
        percentageInfo.className = "percentileMarkers"
        percentageInfo.style.height = "100%";
        percentageInfo.style.width = "0.35%";
        percentageInfo.style.backgroundColor = "white"
        percentageInfo.style.position = "absolute";
        percentageInfo.style.left = calculatedPosition + "%";
        document.getElementById(type + "_spectrum").appendChild (percentageInfo);

        const percentageHoverHitbox = document.createElement('div');
        percentageHoverHitbox.className = 'percentileMarkersHoverFlex';
        percentageHoverHitbox.id = 'percentileMarkersHover-' + type + "_" + i;
        percentageHoverHitbox.style.height = (window.innerHeight*0.07)*0.8 + "px";
        percentageHoverHitbox.style.width = (window.innerHeight*0.07)*0.8 + "px";
        percentageHoverHitbox.style.left = calculatedPosition + "%";
        percentageHoverHitbox.addEventListener("mouseover", showPercentiles);
        percentageHoverHitbox.addEventListener("mouseout", hidePercentiles);
        document.getElementById(type + "_spectrum").appendChild (percentageHoverHitbox);

        const percentageHoverHitboxText = document.createElement("p");
        percentageHoverHitboxText.className = 'percentileMarkersHoverText';
        percentageHoverHitboxText.innerHTML = percentilesOfInterest[i] + "%";
        document.getElementById('percentileMarkersHover-' + type + "_" + i).appendChild (percentageHoverHitboxText);

        const r = (clr1.r + (clr2.r - clr1.r) * (calculatedPosition / 100))
        const g = (clr1.g + (clr2.g - clr1.g) * (calculatedPosition / 100))
        const b = (clr1.b + (clr2.b - clr1.b) * (calculatedPosition / 100))
        const percentileDisplayClr = 'rgb(' + r + ', ' + g + ', ' + b + ')';

        const percentageDisplay = document.createElement('div');
        percentageDisplay.className = 'percentileMarkersDisplay';
        percentageDisplay.id = 'percentileMarkersDisplay-' + type + "_" + i;
        percentageDisplay.style.color = percentileDisplayClr;
        percentageDisplay.style.border = "2px solid " + percentileDisplayClr;
        let percentileValue = (allActivities[Math.floor(len*(percentilesOfInterest[i]/100))][sortBy]).toFixed(2);
        if (type == "pace_distribution") {
            // percentileValue = parseFloat(convert(percentileValue)).toFixed(2);
            percentileValue = convert(percentileValue, 2);
        }
        percentageDisplay.innerHTML = percentileValue + " " + scrub[sortBy].abbrUnit + "<br>(" + percentilesOfInterest[i] + "th percentile)";
        percentageDisplay.style.left = calculatedPosition + "%";

        document.getElementById(type + "_spectrum").appendChild (percentageDisplay);

    }

    if(array != undefined){
        //console.log("array is: " + array)
        let greatest = -1;
        
        //get the greatest element in the array
        for (var j = 0; j< array.length; j++){
            if(array[j].count > greatest){
                greatest = array[j].count;
            }
        }

        //draw graph + bars
        let i = 0;
        while(i < array.length){
            const red = (clr1.r + (clr2.r - clr1.r) * (i / array.length))
            const green = (clr1.g + (clr2.g - clr1.g) * (i / array.length))
            const blue = (clr1.b + (clr2.b - clr1.b) * (i / array.length))
            const gradientClr = 'rgb(' + red + ', ' + green + ', ' + blue + ')'
            var o = document.createElement("div");
            o.className = "verticalOuterContainer";
            o.style.width = 100/array.length + "%";
            document.getElementById(type).appendChild(o);

            var verticalHolder = document.createElement("div");
            verticalHolder.className = "verticalHolder";
            verticalHolder.id = i + "-" + type + "-" + rgbToHex(Math.round(red), Math.round(green), Math.round(blue))
            verticalHolder.style.height = window.innerHeight / 4 + "px";
            verticalHolder.addEventListener("click", showMoreStats);
            //verticalHolder.addEventListener("mouseout", disableStats);
            //verticalHolder.style.height = window.innerHeight / 3 + "px";
            document.getElementById(type).getElementsByClassName("verticalOuterContainer")[i].appendChild(verticalHolder);

            var verticalHolderBelow = document.createElement("p");
            verticalHolderBelow.className = "verticalHolderBelow";
            if(type == "pace_distribution"){
                verticalHolderBelow.innerHTML = getBarTitles(i, "pace", "/mi")
                
            }else if(type == "dist_distribution"){
                verticalHolderBelow.innerHTML = getBarTitles(i, "distance", "mi")
        
            }else if (type == "elev_distribution"){
                verticalHolderBelow.innerHTML = getBarTitles(i, "elevation", "ft")
            }else{
                verticalHolderBelow.innerHTML = getBarTitles(i, "uptime", "%")
            }
            document.getElementById(type).getElementsByClassName("verticalOuterContainer")[i].appendChild(verticalHolderBelow);

            //draw bars
            var verticalHolderStat = document.createElement("p");
            verticalHolderStat.className= "verticalHolderStat";
            if(array[i].count / greatest > 0.2){
                verticalHolderStat.innerHTML = array[i].count;
            }else{
                verticalHolderStat.innerHTML = array[i].count;
                verticalHolderStat.style.fontSize = "0px";
                //creating overflow text on the top of the
                var verticalHolderStatTop = document.createElement("p");
                verticalHolderStatTop.className = "verticalHolderStatTop";
                verticalHolderStatTop.innerHTML = array[i].count;
                verticalHolderStatTop.style.bottom = ((array[i].count / greatest) * (window.innerHeight / 4)) + "px"
                document.getElementById(type).getElementsByClassName("verticalHolder")[i].appendChild(verticalHolderStatTop);
            }
            
            verticalHolderStat.style.backgroundColor = gradientClr;
            verticalHolderStat.style.height = ((array[i].count / greatest) * (window.innerHeight / 4)) + "px";
            verticalHolderStat.style.marginTop = (((greatest - array[i].count) / greatest) * (window.innerHeight / 4)) + "px";
            verticalHolderStat.style.width = "100%";
            document.getElementById(type).getElementsByClassName("verticalHolder")[i].appendChild(verticalHolderStat);

            //console.log(array);
            totalMileage += array[i].total_miles;
            totalElevGain +=array[i].total_elevation_gain;
            totalMovingTime +=array[i].total_time;
            totalElapsedTime +=array[i].total_elapsed_time;

            document.getElementById(type + "_overview").style.color = color;
            i++;
        }

        try{
            let calculatedMile = convert(totalMovingTime / totalMileage, 2).split(".");
            let calculatedKm = convert((totalMovingTime / totalMileage) / 1.609, 2).split(".")
            document.getElementById("pace_distribution_overview").innerHTML = "Average pace: " + calculatedMile[0] + "." + calculatedMile[1].substring(0, 2) +"/mi (" + calculatedKm[0] + "." + calculatedKm[1].substring(0, 2) + "/km) <br> " + (3600 / (totalMovingTime / totalMileage)).toFixed(3) + "mi/h (" + (3600 / ((totalMovingTime / totalMileage) / 1.609)).toFixed(3) + "km/h)"

            document.getElementById("elev_distribution_overview").innerHTML = "Total elevation: " + (totalElevGain.toFixed(2)) + " ft (" + (totalElevGain / 3.28).toFixed(2) + " m) <br> Avg per run: " + ((totalElevGain/allActivities.length).toFixed(2)) + " ft (" + ((totalElevGain/allActivities.length) / 3.28).toFixed(2) + "m)"

            document.getElementById("dist_distribution_overview").innerHTML = "Total mileage: " + (totalMileage.toFixed(2)) + " mi (" + (totalMileage*1.609).toFixed(2) + " km) <br> Avg per run: " + ((totalMileage/allActivities.length).toFixed(3)) + " mi (" + ((totalMileage/allActivities.length)*1.609).toFixed(3) + " km)"

            let minutes = Math.floor(totalMovingTime % 3600)
            document.getElementById("time_distribution_overview").innerHTML = "<b>*Note: Uptime = (Moving time / Elapsed time) * 100</b><br>Total moving time: " + /*Math.floor(totalMovingTime / 3600) + " hours, " + Math.floor(minutes / 60) + " minutes, " + (minutes % 60)*/ convertToDays(totalMovingTime) + "<br> Avg. % moving overall: " + (totalMovingTime / totalElapsedTime*100).toFixed(3) + "%"
        }catch{
            
        }
    }
}

function createRunLookup (id) {

    console.log(id);
    
    const propertiesToParse = [{display: 'mi', property: 'distance', decimalPlaces: 3, min: 'Shorter', max: 'Longer'}, {display: '/mi', property: 'pace', decimalPlaces: 2, min: 'Faster', max: 'Slower'}, {display: 'ft gain', property: 'elevation', decimalPlaces: 2, min: 'Less', max: 'More'}, {display: '% uptime', property: 'uptime', decimalPlaces: 2, min: 'Less', max: 'More'}, {display: 'moving time', property: 'time', decimalPlaces: 0, min: 'Shorter', max: 'Longer'}, {display: 'elapsed time', property: 'elapsedTime', decimalPlaces: 0, min: 'Shorter', max: 'Longer'}, {display: "% incline", property: 'incline' , decimalPlaces: 2, min: 'Gentler', max: 'Steeper'}, {display: 'kudos', property: 'kudos', decimalPlaces: 0, min: 'Less', max: 'More'}, {display: 'steps/min', property: 'cadence', decimalPlaces: 2, min: 'Lower', max: 'Higher'}, {display: 'steps/mile', property: 'stepsPerMile', decimalPlaces: 0, min: 'Less', max: 'More'}, {display: 'ft/stride', property: 'strideLength', decimalPlaces: 3, min: 'Shorter', max: 'Longer'}]

    const runObject = allActivities[allActivities.map(e => e.id).indexOf(id)]

    document.getElementById("runLookupDiv").style.display = "block";
    document.getElementById("runLookupDivTitle").innerHTML = runObject.name
    const info = document.getElementsByClassName('indivRunLookupDiv');
    while(info[0]) {
        info[0].parentNode.removeChild(info[0]);
    }
    document.getElementById("runLookupStravaLink").setAttribute('href', 'https://strava.com/activities/' + id)

    for (let i = 0; i < propertiesToParse.length; i++) {
        // sort all activities and rank them.
        if (runObject[propertiesToParse[i].property] != null) {
            for (let inner = 1; inner < allActivities.length; inner++) {
                let currentElement = allActivities[inner];
                let lastIndex = inner - 1;
            
                while (lastIndex >= 0 && allActivities[lastIndex][propertiesToParse[i].property] > currentElement[propertiesToParse[i].property]) {
                    allActivities[lastIndex + 1] = allActivities[lastIndex];
                    lastIndex--;
                }
                allActivities[lastIndex + 1] = currentElement;
            }

            let rank;
            // calculate ranks
            if (runObject[propertiesToParse[i].property] == 0) {
                rank = 0 //first
            } else if (propertiesToParse[i].property == "uptime" && runObject[propertiesToParse[i].property] == 100) {
                rank = allActivities.length - 1; //last
            } else {
                rank = allActivities.map(e => e.id).indexOf(id);
            }

            let textColor = "black";
            if (scrub[propertiesToParse[i].property]) {
                const clr1 = hexToRgb(scrub[propertiesToParse[i].property].color)
                const clr2 = hexToRgb(scrub[propertiesToParse[i].property].color2);
                const calculatedPosition = rank / allActivities.length;
                const r = (clr1.r + (clr2.r - clr1.r) * (calculatedPosition))
                const g = (clr1.g + (clr2.g - clr1.g) * (calculatedPosition))
                const b = (clr1.b + (clr2.b - clr1.b) * (calculatedPosition))
                textColor = 'rgb(' + r + ', ' + g + ', ' + b + ')';
            }

            // the big number.
            const statDiv = document.createElement('div');
            statDiv.className = 'indivRunLookupDiv';
            
            const mainDisplay = document.createElement('p');
            mainDisplay.className = 'runLookupDivMainText'
            if (propertiesToParse[i].property === "pace" || propertiesToParse[i].property === "time" || propertiesToParse[i].property === "elapsedTime") {
                mainDisplay.innerHTML = '<b>' + convert(runObject[propertiesToParse[i].property], propertiesToParse[i].decimalPlaces)+ '</b> <span>' + propertiesToParse[i].display + '</span>'
            } else {
                mainDisplay.innerHTML = '<b>' + runObject[propertiesToParse[i].property].toFixed(propertiesToParse[i].decimalPlaces) + '</b> <span>' + propertiesToParse[i].display + '</span>'
            }
            mainDisplay.style.color = textColor
            statDiv.appendChild(mainDisplay);

            // create the references on the bars
            const underBar = document.createElement('div');
            underBar.className = 'runLookupSpectrumBarReference'

            const underBarLeft = document.createElement('p');
            underBarLeft.className = 'runLookupSpectrumBarReferenceLeft';
            underBarLeft.innerHTML = "[<-- " + propertiesToParse[i].min + "]";
            underBar.appendChild(underBarLeft);

            const underBarRight = document.createElement('p');
            underBarRight.className = 'runLookupSpectrumBarReferenceRight';
            underBarRight.innerHTML = "[" + propertiesToParse[i].max + " -->]";
            underBar.appendChild(underBarRight);

            statDiv.appendChild(underBar);

            // create spectrum
            const spectrum = document.createElement('div');
            spectrum.className = 'runLookupSpectrum';
            if (scrub[propertiesToParse[i].property]) {
                spectrum.style.background = 'linear-gradient(to right, ' + scrub[propertiesToParse[i].property].color + ', ' + scrub[propertiesToParse[i].property].color2 + ')'
            } else {
                spectrum.style.backgroundColor = "orange";
            }

            const bar = document.createElement('div');
            bar.className = 'runLookupSpectrumBar';
            bar.style.position = 'absolute';
            bar.style.left = "0%";
            bar.style.transition = 'transition: 0.5s';
            bar.style.left = ((rank / allActivities.length)*100) + "%";
            spectrum.appendChild(bar)
            statDiv.appendChild(spectrum);

            

            // create ranking info
            const rankDisplay = document.createElement('p');
            rankDisplay.className = 'runLookupDivRank';
            if (propertiesToParse[i].property === "pace") {
                rankDisplay.innerHTML = propertiesToParse[i].min + ' than <b>' + (allActivities.length - rank) + "</b> of <b> " + allActivities.length + "</b> runs" + " (" + (((allActivities.length - rank)  / allActivities.length)*100).toFixed(2) + "%)";
            } else {
                rankDisplay.innerHTML = propertiesToParse[i].max + ' than <b>' + rank + "</b> of <b> " + allActivities.length + "</b> runs" + " (" + ((rank / allActivities.length)*100).toFixed(2) + "%)";
            }

            statDiv.appendChild(rankDisplay);
            document.getElementById('runLookupDivContainer').appendChild(statDiv);
        }
    }
}

function closeRunLookup() {
    document.getElementById('runLookupDiv').style.display = "none";
}



