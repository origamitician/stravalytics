

function init(){
    window.location = `http://www.strava.com/oauth/authorize?client_id=107318&response_type=code&redirect_uri=${window.location.href}&approval_prompt=auto&scope=activity:read_all`
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

console.log(localStorage)

const index = window.location.href.indexOf('&code=')

if (index == -1) {
    if(localStorage.isLoggedIn == 'true'){
        // when the user is logged in.
        const loadingBarInterval = setInterval(updateLoadingBar, 10)
        document.getElementById('notLoggedInBody').style.display = 'none';
        document.getElementById('applicationBody').style.display = 'none';
        document.getElementById('transition').style.display = 'block';
        fetch('/api/activities/' + localStorage.getItem('accountID'))
        .then((response) => response.json()).then((data) => {
            data.forEach(d => {
                allActivities.push(d)
            })

            renderGraph(); //histograms
            renderScatterplot(allActivities, 'distance', 'pace'); //scatterplot
            
            document.getElementById("displayNumRuns").innerHTML = "Displaying <b>" + allActivities.length + "</b> runs from (timestamp " + startDate + " to " + endDate + ")"
            document.getElementById('applicationBody').style.display = 'block';
            clearInterval(loadingBarInterval)
            document.getElementById('transition').style.display = 'none';
            document.getElementById('welcomeText').innerHTML = 'Welcome, ' + '<b>' + localStorage.getItem('stravaName') + '!</b>'
            document.getElementById('welcomeMsg').style.display = 'block';
            document.getElementById('welcomeMsg').style.display = 'flex';
        })
    } else {
        // if new user and not logged in.
        document.getElementById('applicationBody').style.display = 'none';
    }
} else {
    // when the user is redirected from the authorization page
    const cut = window.location.href.substring(index + 6)
    const accessCode = cut.substring(0, cut.indexOf('&'))
    
    const loadingBarInterval = setInterval(updateLoadingBar, 10)
    document.getElementById('notLoggedInBody').style.display = 'none';
    document.getElementById('transition').style.display = 'block';
    document.getElementById('statusMsg').innerHTML = 'Redirecting...'
    fetch('/api/token/' + accessCode)
    .then((res)=> res.json()).then(json => {
        console.log(json)
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('accountID', json.accountID)
        localStorage.setItem('stravaName', json.stravaName)
        clearInterval(loadingBarInterval)
        window.location = '/'
    })
    .catch(err => {console.log(err)})
}

let loadingBarFrame = 0;

function updateLoadingBar(){
    document.getElementById("loadingBar").style.background = 'linear-gradient(to right, gold, #ff2200 ' + loadingBarFrame + '%, gold ' + (loadingBarFrame + 15) +'%)';
    loadingBarFrame++;
    if(loadingBarFrame >= 100) {
        loadingBarFrame = 0;
    }
}

function logout() {
    localStorage.setItem('isLoggedIn', 'false');
    localStorage.removeItem('accountID');
    localStorage.removeItem('stravaName')
    window.location = '/'
}