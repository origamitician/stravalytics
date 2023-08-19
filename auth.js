
const CLIENT_ID = 107318
const CLIENT_SECRET = '1bac185421708876ddd639fcef0a319d5896d3b1'




function init(){
    window.location = `http://www.strava.com/oauth/authorize?client_id=107318&response_type=code&redirect_uri=${window.location.href}&approval_prompt=auto&scope=activity:read_all`
    /*fetch('/api/activities')
    .then((response) => response.json())
    .then((data) => {
        data.forEach(d => {
            allActivities.push(d)
        })

        renderGraph(); //histograms
        renderScatterplot(allActivities, 'distance', 'pace'); //scatterplot
        
        document.getElementById("displayNumRuns").innerHTML = "Displaying <b>" + allActivities.length + "</b> runs from (timestamp " + startDate + " to " + endDate + ")"
    })*/
}


function getStravaData(page, accessKey) {
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
                id:  jsonData[i].id,
                kudos: jsonData[i].kudos_count,
                maxPace: jsonData[i].max_speed,
                cadence: jsonData[i].average_cadence
            });
        }
        
        renderGraph(); //histograms
        renderScatterplot(allActivities, 'distance', 'pace'); //scatterplot
        
        document.getElementById("displayNumRuns").innerHTML = "Displaying <b>" + allActivities.length + "</b> runs from (timestamp " + startDate + " to " + endDate + ")"
    })
}

//the following runs every time the page loads.

console.log(localStorage.isLoggedIn)
if (!localStorage.isLoggedIn || localStorage.isLoggedIn == 'false'/*|| !localStorage.id*/) {
    document.getElementById('applicationBody').style.display = 'none';
} else {
    document.getElementById('applicationBody').style.display = 'block';
}

const index = window.location.href.indexOf('&code=')

if (index == -1) {
    // when the user hasn't connected the Strava account yet, OR the user has connected the Strava account and has valid localStorage keys.
    if(localStorage.isLoggedIn == 'true'){
        document.getElementById('welcomeMsg').innerHTML = 'Welcome!'
        document.getElementById('welcomeMsg').style.display = 'block'
    }
} else {
    // when the user is redirected from the authorization page
    document.getElementById('loginbtn').style.display = 'none'
    const cut = window.location.href.substring(index + 6)
    const accessCode = cut.substring(0, cut.indexOf('&'))
    console.log('Access code: ' + accessCode)

    fetch('/api/token/' + accessCode)
    .then(response => {
        localStorage.setItem('isLoggedIn', 'true')
        window.location = '/'
    })
    .catch(err => {console.log(err)})
}