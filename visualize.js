var accessKey;
var allActivities = [];

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
    fetch("https://www.strava.com/api/v3/athlete/activities?access_token=" + accessKey + "&page=" + page + "&per_page=200").then((response) => response.json()).then((jsonData) => {

        for (var i = 0; i < jsonData.length; i++){
            allActivities.push({
                distance: jsonData[i].distance,
                time: jsonData[i].moving_time,
                elapsedTime: jsonData[i].elapsed_time,
                elevation: jsonData[i].total_elevation_gain,
                pace: jsonData[i].average_speed
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
    }
}



function updateDefaultStatistics(array, index, inputObject){
    //update these regardless of index


    //array and index are self-explanatory. inputObject is the object being added from AllActivities.
    //update at specific index.
    array[index].count++;
    array[index].total_elevation_gain+=inputObject.elevation *3.28;
    array[index].total_miles+=inputObject.distance / 1609;
    array[index].total_time+=inputObject.time;
    array[index].total_elapsed_time+=inputObject.elapsedTime;

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
    if(processed[1] == "dist_distribution"){
        showStatsOnHTML(dist_distribution, processed[1], parseInt(processed[0]))
    }else if(processed[1] == "pace_distribution"){
        showStatsOnHTML(pace_distribution, processed[1], parseInt(processed[0]))
    }else if(processed[1] == "elev_distribution"){
        showStatsOnHTML(elev_distribution, processed[1], parseInt(processed[0]))
    }else if(processed[1] == "time_distribution"){
        showStatsOnHTML(elapsed_distribution, processed[1], parseInt(processed[0]))
    }
}

function disableStats(){
    var processed = this.id.split("-");
    document.getElementById(processed[1] + "_info").innerHTML = "Hover over graph to show more details!"
}

function showStatsOnHTML(array, location, id){
    var convertedMileTime = convert(array[id].total_time / array[id].total_miles).split(".")
    var convertedKmTime = convert((array[id].total_time / array[id].total_miles) / 1.609).split('.')
    //console.log(convertedMileTime)
    //console.log(convertedKmTime);
    try{
        document.getElementById(location + "_info").innerHTML = "Average pace: " + convertedMileTime[0] + "." + convertedMileTime[1].substring(0, 2) + "/mi (" + convertedKmTime[0] + "." + convertedKmTime[1].substring(0, 2) + "/km) <br>" +

        "Average distance: " + (array[id].total_miles / array[id].count).toFixed(3) + " mi (closest " + array[id].least_miles.toFixed(3) + " mi; furthest " + array[id].most_miles.toFixed(3) + " mi) <br>" + 

        "Average elev gain: " +  (array[id].total_elevation_gain / array[id].count).toFixed(2) + " ft (highest " + array[id].most_elevation_gain.toFixed(2) + " ft) <br>" + 

        "Average % moving: " + ((array[id].total_time / array[id].total_elapsed_time)*100).toFixed(2) + " %"
    }catch{
        //do nothing here since its buggy
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

    console.log(JSON.stringify(dist_distribution[0]))
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

    console.log(dist_distribution);
    console.log(pace_distribution);
    console.log(elev_distribution);
    console.log(elapsed_distribution);

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
            verticalHolder.id = i + "-" + type;
            verticalHolder.style.height = window.innerHeight / 4 + "px";
            verticalHolder.addEventListener("mouseover", showMoreStats);
            verticalHolder.addEventListener("mouseout", disableStats);
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
                verticalHolderBelow.innerHTML = (i*2) + "-" + ((i+1)*2) + "%"
            }
            document.getElementById(type).getElementsByClassName("verticalOuterContainer")[i].appendChild(verticalHolderBelow);

            //draw bars
            var verticalHolderStat = document.createElement("p");
            verticalHolderStat.className= "verticalHolderStat";
            if(array[i].count / greatest > 0.2){
                verticalHolderStat.innerHTML = array[i].count;
            }else{

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

            console.log(array);
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



