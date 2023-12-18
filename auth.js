//file for all the misc. operations, such as hiding and showing elements of the UI, updating the date, etc...
let loadingBarFrame = 0;

function init(){
    window.location = `http://www.strava.com/oauth/authorize?client_id=107318&response_type=code&redirect_uri=${window.location.href}&approval_prompt=auto&scope=activity:read_all`
}

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
        allActivitiesRef.forEach(a => {
            console.log(a.startDate);
            if (Date.parse(a.startDate)/1000 >= startDate && Date.parse(a.startDate)/1000 <= endDate) {
                allActivities.push(a);
            }
        })
        renderGraph();
        renderScatterplot(allActivities, 'distance', 'pace')
        document.getElementById("displayNumRuns").innerHTML = "Displaying <b>" + allActivities.length + "</b> runs from (timestamp " + startDate + " to " + endDate + ")"
    }catch (err){
        alert("Invalid date! " + err)
    }
}

console.log(localStorage)

const indexOfAuthorization = window.location.href.indexOf('&code=')
const indexOfRandom = window.location.href.indexOf('?random=true')

if (indexOfAuthorization == -1) {
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
                allActivitiesRef.push(d);
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
        generateRandomData();
    } else {
        // if new user and not logged in.
        if(indexOfRandom == -1){
            // if user is on the home page.
            document.getElementById('applicationBody').style.display = 'none';
            document.getElementById('transition').style.display = 'none';
        }else{
            // if user wants to generate random data
            setTimeout (generateRandomData, 100)
        }
    }
} else {
    // when the user is redirected from the authorization page
    const cut = window.location.href.substring(indexOfAuthorization + 6)
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

function generateRandomData(){
    for (let i = 0; i < 100; i++){
        const generatedDistance = (Math.random()*42195) + 1000;
        const generatedPace = Math.random()*3.25 + 2.5
        const elapsedPaceDifferencePercent = Math.random()*35
        const generatedTime = generatedDistance / generatedPace
        allActivities.push({
            distance: generatedDistance,
            pace: generatedPace,
            time: generatedTime,
            elapsedTime: generatedTime * (1+elapsedPaceDifferencePercent/100),
            elevation: Math.random()*158,
            kudos: Math.round(Math.random()*15),
            maxPace: generatedPace * (1 + ((Math.random() * 50) / 100)),
            id: -1,
            startDate: "2021-07-21T16:20:13Z",
            name: "Run " + i
        })
    }
    document.getElementById('applicationBody').style.display = 'block';
    renderGraph(); //histograms
    renderScatterplot(allActivities, 'distance', 'pace'); //scatterplot
}

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