
const CLIENT_ID = 107318
const CLIENT_SECRET = '1bac185421708876ddd639fcef0a319d5896d3b1'

function init(){
    window.location = `http://www.strava.com/oauth/authorize?client_id=107318&response_type=code&redirect_uri=${window.location.href}&approval_prompt=force&scope=activity:read_all`
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
const index = window.location.href.indexOf('&code=')
if (index == -1) {
    // when the user hasn't connected the Strava account yet.
} else {
    // when the user is redirected from the authorization page
    const cut = window.location.href.substring(index + 6)
    const accessCode = cut.substring(0, cut.indexOf('&'))
    console.log(accessCode)

    fetch(`https://www.strava.com/api/v3/oauth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${accessCode}&grant_type=authorization_code`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    }).then((response) => response.json())
    .then((json) => {
        console.log(json)
        const refreshToken = json.refresh_token
        document.getElementById('welcomeMsg').innerHTML = 'Welcome, <b>' + json.athlete.firstname + ' ' + json.athlete.lastname + '! </b>'
        document.getElementById('welcomeMsg').style.display = 'block'

        fetch(`https://www.strava.com/api/v3/oauth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&refresh_token=${refreshToken}&grant_type=refresh_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        }).then((res) => res.json())
        .then((j) => {
            const accessKey = j.access_token
            getStravaData(1, accessKey);
            getStravaData(2, accessKey);
            getStravaData(3, accessKey);
            getStravaData(4, accessKey);
        })
    })
}