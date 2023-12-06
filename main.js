//all variables + bargraph info is here;
var allActivities = []; // actual, dynamically changing activities list upon filtering.
const allActivitiesRef = []; // FIXED activities list. All lifetime activities are stored in here so that 
var startDate = Math.floor(Date.parse("01-01-2023") / 1000)
var endDate = Math.floor(Date.now() / 1000);
let scrub;

if (window.innerWidth > window.innerHeight) {

    // landscape mode
    scrub = {
        pace: {left: 260, right: 600, increment: 20, leftOutlier: true, rightOutlier: true, totalBars: null, color: "#149c1f", color2: "#32a893", unit: "seconds/mi"},
        uptime: {left: 60, right: 100, increment: 2, leftOutlier: true, rightOutlier: false, totalBars: null, color: "#b33bad", color2: "#db25a2", unit: "%"},
        distance: {left: 0, right: 15, increment: 1, leftOutlier: false, rightOutlier: true, totalBars: null, color: "#1688b5", color2: '#221980', unit: "miles"},
        elevation: {left: 10, right: 510, increment: 25, leftOutlier: true, rightOutlier: true, totalBars: null, color: "#ff8400", color2: '#b8a44d', unit: "feet"},
    }
} else {
    // portrait mode
    scrub = {
        pace: {left: 260, right: 600, increment: 34, leftOutlier: true, rightOutlier: true, totalBars: null, color: "#149c1f", color2: "#32a893", unit: "seconds/mi"},
        uptime: {left: 60, right: 100, increment: 4, leftOutlier: true, rightOutlier: false, totalBars: null, color: "#b33bad", color2: "#db25a2", unit: "%"},
        distance: {left: 0, right: 15, increment: 1.5, leftOutlier: false, rightOutlier: true, totalBars: null, color: "#1688b5", color2: '#221980', unit: "miles"},
        elevation: {left: 10, right: 510, increment: 50, leftOutlier: true, rightOutlier: true, totalBars: null, color: "#ff8400", color2: '#b8a44d', unit: "feet"},
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

function convert(seconds){
    if(seconds >= 3600){
        if(seconds % 3600 >= 600) {
            return Math.floor(seconds / 3600) + ":" +convert(seconds % 3600)
        }else{
            return Math.floor(seconds / 3600) + ":0" +convert(seconds % 3600)
        }
        
    }
    if(seconds % 60 >= 10){
        return Math.floor(seconds / 60) + ":" + (seconds % 60);
    }else{
        return Math.floor(seconds / 60) + ":0" + (seconds % 60);
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
    array[index].total_elevation_gain+=inputObject.elevation *3.28;
    array[index].total_miles+=inputObject.distance / 1609;
    array[index].total_time+=inputObject.time;
    array[index].total_elapsed_time+=inputObject.elapsedTime;
    array[index].list_of_activities.push(inputObject);

    if(inputObject.elevation *3.28 > array[index].most_elevation_gain){
        array[index].most_elevation_gain = inputObject.elevation *3.28;
    }

    if (inputObject.elevation *3.28 < array[index].least_elevation_gain){
        array[index].least_elevation_gain = inputObject.elevation *3.28;
    }

    if(inputObject.distance / 1609 > array[index].most_miles){
        array[index].most_miles = inputObject.distance / 1609
    }

    if(inputObject.distance / 1609 < array[index].least_miles){
        array[index].least_miles = inputObject.distance / 1609
    }
}

/*function showMoreStats(arr, index, type){
    console.log("Graph index is: " + index + " and type is: " + type)
}*/


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
    var convertedMileTime = convert(array[id].total_time / array[id].total_miles).split(".")
    var convertedKmTime = convert((array[id].total_time / array[id].total_miles) / 1.609).split('.')
    //console.log(convertedMileTime)
    //console.log(convertedKmTime);
    try{
        document.getElementById(location + "_info").innerHTML = "<b> Average pace: </b>" + convertedMileTime[0] + "." + convertedMileTime[1].substring(0, 2) + "/mi (" + convertedKmTime[0] + "." + convertedKmTime[1].substring(0, 2) + "/km) <br><br>" +

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
        
        span = document.createElement("a");
        span.className = "indivGrid";
        span.style.width = "25%"
        span.style.textAlign = "left";
        //span.id = "title";
        if(i == -1){
            span.innerHTML = "Title"
            document.getElementById(location + "_wrapper").getElementsByClassName("headerDiv")[0].appendChild(span)
        }else{
            if(array[id].list_of_activities[i].name.length > 30){
                var innerLink = document.createTextNode(array[id].list_of_activities[i].name.substring(0, 30) + "...");
            }else{
                var innerLink = document.createTextNode(array[id].list_of_activities[i].name);
            }
            span.appendChild(innerLink)
            span.style.color = "darkblue"
            span.setAttribute("href", "https://strava.com/activities/" + array[id].list_of_activities[i].id);
            span.setAttribute("target", "_blank");
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
            span.innerHTML = (array[id].list_of_activities[i].distance / 1609).toFixed(3) + "mi"
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
                let convertedTime = (1609 / array[id].list_of_activities[i].pace).toString().split(".")
                span.innerHTML = convert(convertedTime[0]) + "." + convertedTime[1].toString().substring(0, 2);
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
            span.innerHTML = (array[id].list_of_activities[i].elevation*3.28).toFixed(2) + "ft"
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
    //item is one individual object returned from the Strava API.
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
    allActivities.forEach(e => {
        //console.log(e);
        establishIncrements(e, e.distance/1609, "distance", dist_distribution)
        establishIncrements(e, 1609/e.pace, "pace", pace_distribution)
        establishIncrements(e, e.elevation*3.28, "elevation", elev_distribution)
        establishIncrements(e, (e.time / e.elapsedTime)*100, "uptime", elapsed_distribution)
    })

    renderTypeGraph(dist_distribution, "dist_distribution", scrub.distance.color, scrub.distance.color2);
    renderTypeGraph(pace_distribution, "pace_distribution", scrub.pace.color, scrub.pace.color2);
    renderTypeGraph(elev_distribution, "elev_distribution", scrub.elevation.color, scrub.elevation.color2);
    renderTypeGraph(elapsed_distribution, "time_distribution", scrub.uptime.color, scrub.uptime.color2);
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

function renderTypeGraph(array, type, color, color2){
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
            let calculatedMile = convert(totalMovingTime / totalMileage).split(".");
            let calculatedKm = convert((totalMovingTime / totalMileage) / 1.609).split(".")
            document.getElementById("pace_distribution_overview").innerHTML = "Average pace: " + calculatedMile[0] + "." + calculatedMile[1].substring(0, 2) +"/mi (" + calculatedKm[0] + "." + calculatedKm[1].substring(0, 2) + "/km) <br> " + (3600 / (totalMovingTime / totalMileage)).toFixed(3) + "mi/h (" + (3600 / ((totalMovingTime / totalMileage) / 1.609)).toFixed(3) + "km/h)"

            document.getElementById("elev_distribution_overview").innerHTML = "Total elevation: " + (totalElevGain.toFixed(2)) + " ft (" + (totalElevGain / 3.28).toFixed(2) + " m) <br> Avg per run: " + ((totalElevGain/allActivities.length).toFixed(2)) + " ft (" + ((totalElevGain/allActivities.length) / 3.28).toFixed(2) + "m)"

            document.getElementById("dist_distribution_overview").innerHTML = "Total mileage: " + (totalMileage.toFixed(2)) + " mi (" + (totalMileage*1.609).toFixed(2) + " km) <br> Avg per run: " + ((totalMileage/allActivities.length).toFixed(3)) + " mi (" + ((totalMileage/allActivities.length)*1.609).toFixed(3) + " km)"

            let minutes = Math.floor(totalMovingTime % 3600)
            document.getElementById("time_distribution_overview").innerHTML = "<b>*Note: Uptime = (Moving time / Elapsed time) * 100</b><br>Total moving time: " + Math.floor(totalMovingTime / 3600) + " hours, " + Math.floor(minutes / 60) + " minutes, " + (minutes % 60) + " seconds <br> Avg. % moving overall: " + (totalMovingTime / totalElapsedTime*100).toFixed(3) + "%"
        }catch{
            
        }
    }
}



