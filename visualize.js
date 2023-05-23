var accessKey;
var allActivities = [];
var startDate = 0;
var endDate = Math.floor(Date.now() / 1000);

function changeDates(){
    try{
        if(document.getElementsByName("startDate")[0].value == ""){
            startDate = 0;
        }else{
            startDate = Math.floor(Date.parse(document.getElementsByName("startDate")[0].value) / 1000)
        }
        
        if(document.getElementsByName("endDate")[0].value == ""){
            endDate = Math.floor(Date.now() / 1000)
        }else{
            endDate = Math.floor(Date.parse(document.getElementsByName("endDate")[0].value) / 1000)
        }
        
        //console.log(Date.parse(document.getElementsByName("startDate")[0].value))
        allActivities = []
        getStravaData(1);
        getStravaData(2)
        getStravaData(3)
    }catch (err){
        alert("Invalid date! " + err)
    }
}

fetch('https://www.strava.com/oauth/token?client_id=107318&client_secret=1bac185421708876ddd639fcef0a319d5896d3b1&refresh_token=48f138733218bdd7c10c586c704b8f104a5221f2&grant_type=refresh_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    }).then((response) => response.json())
    .then((json) => {
        accessKey = json.access_token
        getStravaData(1);
        getStravaData(2);
        getStravaData(3);
    })

function getStravaData(page) {
    fetch("https://www.strava.com/api/v3/athlete/activities?access_token=" + accessKey + "&page=" + page + "&per_page=200&after=" + startDate + "&before=" + endDate).then((response) => response.json()).then((jsonData) => {
        
        for (var i = 0; i < jsonData.length; i++){
            if(jsonData[i].type == "Run")
            allActivities.push({
                distance: jsonData[i].distance,
                time: jsonData[i].moving_time,
                elapsedTime: jsonData[i].elapsed_time,
                elevation: jsonData[i].total_elevation_gain,
                pace: jsonData[i].average_speed,
                name: jsonData[i].name,
                startDate: jsonData[i].start_date_local,
                id:  jsonData[i].id
            });
        }
        
        renderGraph();
    })
}

//variables for graph
var dist_distribution = []
var pace_distribution = [];
var elev_distribution = [];
var elapsed_distribution = [];

//given a 1280 x 600, the dimensions of individual canvas is ~900 x 300.

//cutoffs for pace: <4:20 /mi, 4:20-4:40, 4:40-5:00, 5:00-5:20, 5:20-5:40, 5:40-6:00, 6:00-6:20, 6:20-6:40, 6:40-7:00, 7:00-7:20, 7:20-7:40, 7:40-8:00, 8:00-8:20, 8:20-8:40, 8:40-9:00, 9:00-9:20, 9:20-9:40, 9:40-10:00, 10:00~ (19 total subgraphs with 20 second increments)

//cutoffs for elevation: 0-40, 40-80, 80-120... until 440-480, 480+. 13 subgraphs w/ 40ft increments

//cutoffs for elapsed time: 0-2%, 2-4%, ... until 36+%. 19 subgraphs w/ 2% increments

//helper function to convert seconds to m:ss

function convert(seconds){
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

    console.log(array[id])
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

function renderGraph(){

    totalMileage=0;
    totalElevGain=0;
    totalPace=0;
    totalMovingTime=0;
    totalElapsedTime=0;
     //resetting pace distributions
    for(var i = 0; i < 14; i++){
        dist_distribution[i] = {}
    }

    for(var i = 0; i < 19; i++){
        pace_distribution[i] = {}
    }

    for(var i = 0; i < 13; i++){
        elev_distribution[i] = {}
    }

    for(var i = 0; i < 19; i++){
        elapsed_distribution[i] = {}
    }

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
        if(Math.floor(e.distance/1609) < 13){
            updateDefaultStatistics(dist_distribution, Math.floor(e.distance/1609), e);
        }else{
            updateDefaultStatistics(dist_distribution, 13, e);
        }

        if(1609/e.pace < 260){
            updateDefaultStatistics(pace_distribution, 0, e);
        }else if(1609/e.pace > 600){
            updateDefaultStatistics(pace_distribution, 18, e);
        }else{
            updateDefaultStatistics(pace_distribution, Math.floor((1609/e.pace - 260) / 20) + 1, e);
        }

        if(e.elevation * 3.28 > 480){
            updateDefaultStatistics(elev_distribution, 12, e);
        }else{
            updateDefaultStatistics(elev_distribution, Math.floor((e.elevation*3.28) / 40), e);
        }

        var calcPercent = ((e.elapsedTime - e.time) / e.elapsedTime)*100;
    
        if(calcPercent > 36){
            updateDefaultStatistics(elapsed_distribution, 18, e);
        }else{
            updateDefaultStatistics(elapsed_distribution, Math.floor(calcPercent / 2), e);
        }
    })

    //console.log(dist_distribution);
    //console.log(pace_distribution);
    //console.log(elev_distribution);
    //console.log(elapsed_distribution);

    renderTypeGraph(dist_distribution, "dist_distribution", "purple");
    renderTypeGraph(pace_distribution, "pace_distribution", "darkgreen");
    renderTypeGraph(elev_distribution, "elev_distribution", "#cc0000");
    renderTypeGraph(elapsed_distribution, "time_distribution", "darkblue");


    
    /*convert(Math.trunc(totalPace / allActivities.length)) + "." + (totalPace / allActivities.length).toString().split(".")[1].substring(0, 2) + "/mi"*/ 

}
//render

//helper method
function renderTypeGraph(array, type, color){
    totalMileage=0;
    totalElevGain=0;
    totalPace=0;
    totalMovingTime=0;
    totalElapsedTime=0;

    //array is the array that is getting iterated over
    //type is the destination where the graph is getting added
    //color is the bar color
    if(array != undefined){
        //console.log("array is: " + array)
        let greatest = -1;
        //get the greatest element in the array
        for (var i = 0; i < array.length; i++){
            if(array[i].count > greatest){
                greatest = array[i].count;
            }
        }

        //draw graph + bars
        for (var i = 0; i < array.length; i++){
            var o = document.createElement("div");
            o.className = "verticalOuterContainer";
            o.style.width = 100/array.length + "%";
            document.getElementById(type).appendChild(o);

            var verticalHolder = document.createElement("div");
            verticalHolder.className = "verticalHolder";
            verticalHolder.id = i + "-" + type + "-" + color;
            verticalHolder.style.height = window.innerHeight / 4 + "px";
            verticalHolder.addEventListener("click", showMoreStats);
            //verticalHolder.addEventListener("mouseout", disableStats);
            //verticalHolder.style.height = window.innerHeight / 3 + "px";
            document.getElementById(type).getElementsByClassName("verticalOuterContainer")[i].appendChild(verticalHolder);

            var verticalHolderBelow = document.createElement("p");
            verticalHolderBelow.className = "verticalHolderBelow";
            if(type == "pace_distribution"){
                verticalHolderBelow.innerHTML = convert(240 + (i*20)) + "-" + convert(240 + ((i+1)*20)) + "/mi";
            }else if(type == "dist_distribution"){
                verticalHolderBelow.innerHTML = i + "-" + (i+1) + "mi";
            }else if (type == "elev_distribution"){
                verticalHolderBelow.innerHTML = (i*40) + "-" + ((i+1)*40) + "ft";
            }else{
                verticalHolderBelow.innerHTML = ((50-i-1)*2) + "-" + ((50-i)*2) + "%"
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
            
            verticalHolderStat.style.backgroundColor = color;
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
        }
        let calculatedMile = convert(totalMovingTime / totalMileage).split(".");
        let calculatedKm = convert((totalMovingTime / totalMileage) / 1.609).split(".")
        document.getElementById("pace_distribution_overview").innerHTML = "Average pace: " + calculatedMile[0] + "." + calculatedMile[1].substring(0, 2) +"/mi (" + calculatedKm[0] + "." + calculatedKm[1].substring(0, 2) + "/km)"

        document.getElementById("elev_distribution_overview").innerHTML = "Total elevation: " + (totalElevGain.toFixed(2)) + " ft (" + (totalElevGain / 3.28).toFixed(2) + " m) <br> Avg per run: " + ((totalElevGain/allActivities.length).toFixed(2)) + " ft (" + ((totalElevGain/allActivities.length) / 3.28).toFixed(2) + "m)"

        document.getElementById("dist_distribution_overview").innerHTML = "Total mileage: " + (totalMileage.toFixed(2)) + " mi (" + (totalMileage*1.609).toFixed(2) + " km) <br> Avg per run: " + ((totalMileage/allActivities.length).toFixed(3)) + " mi (" + ((totalMileage/allActivities.length)*1.609).toFixed(3) + " km)"

        let minutes = Math.floor(totalMovingTime % 3600)
        document.getElementById("time_distribution_overview").innerHTML = "Total moving time: " + Math.floor(totalMovingTime / 3600) + " hours, " + Math.floor(minutes / 60) + " minutes, " + (minutes % 60) + " seconds <br> Avg. % moving overall: " + (totalMovingTime / totalElapsedTime*100).toFixed(3) + "%"
    }
}



