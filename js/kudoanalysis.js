let accessToken;
const semester1 = [{name:"Matthew C.",totalKudos:10},{name:"Myndee D.",totalKudos:11},{name:"Bobby T.",totalKudos:9},{name:"Peter L.",totalKudos:99},{name:"Gavin K.",totalKudos:58},{name:"Marcus R.",totalKudos:33},{name:"George L.",totalKudos:118},{name:"Izzy L.",totalKudos:94},{name:"Tony S.",totalKudos:83},{name:"Laurynn A.",totalKudos:94},{name:"Isaac P.",totalKudos:69},{name:"Nicolas A.",totalKudos:40},{name:"Dot C.",totalKudos:40},{name:"Savannah S.",totalKudos:4},{name:"Charlotte D.",totalKudos:38},{name:"Malachi C.",totalKudos:23},{name:"Jullien B.",totalKudos:2},{name:"Chris C.",totalKudos:19},{name:"jonathan F.",totalKudos:3},{name:"Ryan S.",totalKudos:2},{name:"Austin C.",totalKudos:33},{name:"Lainey F.",totalKudos:1},{name:"Christopher M.",totalKudos:3},{name:"Andrew M.",totalKudos:2},{name:"Ethan K.",totalKudos:4},{name:"Jai C.",totalKudos:16},{name:"Josh T.",totalKudos:4},{name:"Theresa L.",totalKudos:1},{name:"Ashten A.",totalKudos:1},{name:"reece K.",totalKudos:1},{name:"Andrea M.",totalKudos:2},{name:"Christian K.",totalKudos:1},{name:"Conor U.",totalKudos:6},{name:"Tobias P.",totalKudos:1},{name:"Dmitriy E.",totalKudos:1},{name:"Paul H.",totalKudos:1},{name:"Olivier A.",totalKudos:1},{name:"Michael C.",totalKudos:1},{name:"Riley H.",totalKudos:1}]

const semester2 =  [{name:"Ethan K.",totalKudos:12},{name:"Peter L.",totalKudos:91},{name:"Tony S.",totalKudos:41},{name:"Chris C.",totalKudos:25},{name:"Laurynn A.",totalKudos:74},{name:"Caleb M.",totalKudos:13},{name:"George L.",totalKudos:87},{name:"Malachi C.",totalKudos:28},{name:"Ana N.",totalKudos:16},{name:"Isaac P.",totalKudos:34},{name:"Nicolas A.",totalKudos:49},{name:"Izzy L.",totalKudos:70},{name:"Dot C.",totalKudos:62},{name:"Charlotte D.",totalKudos:49},{name:"Matthew C.",totalKudos:7},{name:"Andrea M.",totalKudos:5},{name:"Gavin K.",totalKudos:14},{name:"Mac R.",totalKudos:16},{name:"Conor U.",totalKudos:4},{name:"Brandon R.",totalKudos:8},{name:"Savannah S.",totalKudos:2},{name:"Theresa L.",totalKudos:6},{name:"Marcus R.",totalKudos:2},{name:"Lainey F.",totalKudos:2},{name:"Jai C.",totalKudos:4},{name:"Austin C.",totalKudos:3},{name:"Abraham P.",totalKudos:1},{name:"jonathan F.",totalKudos:1},{name:"Andrew M.",totalKudos:1},{name:"Micah W.",totalKudos:1},{name:"Nicholas P.",totalKudos:1}]

const listOfNames = [] // {name: 'john smith', totalKudos: 5};
const fragmentLength = 35; // the number of activities that will get processed before strava api hits rate limit.
let batchInterval;
let fragmentNum = 0;

console.log(listOfNames);

function runKudoAnalysis() {
    const minIndex = 0;
    const maxIndex = 190;
    console.log('running kudo analysis')
    const numberOfFragments = Math.ceil(allActivities.length / fragmentLength);
    fetch(`https://www.strava.com/api/v3/oauth/token?client_id=107318&client_secret=1bac185421708876ddd639fcef0a319d5896d3b1&refresh_token=d60bedf5f0e7d556687f0f277a02ee0c7a4de16f&grant_type=refresh_token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    }).then((res) => res.json()).then((j) => {
        accessToken = j.access_token
        console.log(`access token is: ${accessToken}`)
        /* getBatchKudos();
        batchInterval = setInterval(getBatchKudos, 900000); */
        for (let index = minIndex; index < maxIndex; index++) {
            const peoplePromise = fetchAPIData(allActivities[index].id);
            peoplePromise.then((res => {
                const people = [...res];
                people.forEach(ppl => {
                    const fullName = `${ppl.firstname} ${ppl.lastname}`;
                    const index = listOfNames.map(a => a.name).indexOf(fullName)
                    if (index == -1) {
                        // if there is no name in the listOfNames.
                        listOfNames.push({name: fullName, totalKudos: 1});
                    } else {
                        listOfNames[index].totalKudos++;
                    }
                })
                console.log("Running total is: " + JSON.stringify(listOfNames));
            }))
        }
        fragmentNum++;
        combine();
    })
}

function getBatchKudos() {
    /* if (fragmentNum > Math.ceil(allActivities.length / fragmentLength)) {
        for (let index = 0; index < fragmentLength; index++) {
            const peoplePromise = fetchAPIData(allActivities[(fragmentNum * fragmentLength) + index].id);
            peoplePromise.then((res => {
                const people = [...res];
                people.forEach(ppl => {
                    const fullName = `${ppl.firstname} ${ppl.lastname}`;
                    const index = listOfNames.map(a => a.name).indexOf(fullName)
                    if (index == -1) {
                        // if there is no name in the listOfNames.
                        listOfNames.push({name: fullName, totalKudos: 1});
                    } else {
                        listOfNames[index].totalKudos++;
                    }
                })
                console.log("Running total is: " + JSON.stringify(listOfNames));
            }))
        }
        fragmentNum++;
    } else {
        clearInterval(batchInterval);
    } */
}

async function fetchAPIData(id) {
    // my refresh token: 64e1cb8497985aef6e9614d0
    console.log("Fetching data for id " + id + ": https://www.strava.com/api/v3/activities/" + id + "/kudos?access_token=" + accessToken)
    // generate an access token
    let toReturn = [];
    await fetch("https://www.strava.com/api/v3/activities/" + id + "/kudos?access_token=" + accessToken).then((response) => response.json()).then((jsonData) => { 
        toReturn = [...jsonData]
    })
    console.log("returned stuff is: " + JSON.stringify(toReturn));
    return toReturn;
}

function combine() {
    const semester1parsed = [...semester1];
    const semester2parsed = [...semester2];
    const combined = [{name:"Ethan K.",totalKudos:5},{name:"Micaiah C.",totalKudos:174},{name:"Kia'i T.",totalKudos:42},{name:"Peter L.",totalKudos:134},{name:"Isaac P.",totalKudos:100},{name:"Theresa L.",totalKudos:7},{name:"Josh T.",totalKudos:2},{name:"Austin C.",totalKudos:17},{name:"Ethan F.",totalKudos:1},{name:"Seita T.",totalKudos:7},{name:"Christian K.",totalKudos:1},{name:"Evan C.",totalKudos:1}]
    /* semester1.forEach(e => {
        semester1parsed.push(JSON.parse(e));
    })
    semester2.forEach(e => {
        semester2parsed.push(JSON.parse(e));
    }) */

    /* for (let i = 0; i < semester1parsed.length; i++) {
        const sem2names = semester2parsed.map(e => e.name)
        const index = sem2names.indexOf(semester1parsed[i].name)
        if (index == -1) {
            // if name was not found in the second semester list.
            combined.push(semester1parsed[i]);
        } else {
            combined.push({name: semester1parsed[i].name, totalKudos: semester1parsed[i].totalKudos + semester2parsed[index].totalKudos});
        }
    }

    for (let i = 0; i < semester2parsed.length; i++) {
        const sem1names = semester1parsed.map(e => e.name)
        if (sem1names.indexOf(semester2parsed[i].name) == -1) {
            // if name was not found in the first semester list.
            combined.push(semester2parsed[i]);
        }
    } */

    // sort allActivities by date.
    for (let i = 1; i < combined.length; i++) {
        let currentElement = combined[i];
        let lastIndex = i - 1;
  
        while (lastIndex >= 0 && combined[lastIndex].totalKudos < currentElement.totalKudos) {
            combined[lastIndex + 1] = combined[lastIndex];
            lastIndex--;
        }
        combined[lastIndex + 1] = currentElement;
    }

    console.log(JSON.stringify(combined));

    const graphColors = ['cornflowerblue', '#fc9003', 'purple', '#3bbf53', '#d12828', 'darkgreen', 'maroon', 'darkblue', 'seagreen', 'gray']
    const maxValue = 190;
    for (let i = 0; i < combined.length; i++) {
        const graphRow = document.createElement('div');
        graphRow.className = 'graphRow';

        const graphText = document.createElement('p');
        graphText.className = 'kudoGraphText';
        graphText.innerHTML = combined[i].name;
        graphRow.appendChild(graphText);

        const graphBarHolder = document.createElement('div');
        graphBarHolder.className = 'kudoGraphBarHolder';

        const graphBar = document.createElement('div');
        graphBar.className = 'kudoGraphBar';
        graphBar.style.backgroundColor = graphColors[i % graphColors.length];
        /* graphBar.style.background = 'linear-gradient(to right, white, ' + graphColors[i % graphColors.length] + ')'; */
        if ((combined[i].totalKudos / maxValue) * 100 > 18) {
            graphBar.innerHTML = combined[i].totalKudos + " (" + ((combined[i].totalKudos / maxValue) * 100).toFixed(1) + "%)";
        } else {
            graphBar.innerHTML = "."
        }
        
        graphBar.style.width = (combined[i].totalKudos / maxValue) * 100 + "%";
        graphBarHolder.appendChild(graphBar);
         
        if ((combined[i].totalKudos / maxValue) * 100 <= 18) {
            const graphTailText = document.createElement('p');
            graphTailText.innerHTML = combined[i].totalKudos + " (" + ((combined[i].totalKudos / maxValue) * 100).toFixed(1) + "%)";
            graphTailText.style.paddingLeft = "2%";
            graphTailText.style.marginTop = "1%";
            graphTailText.style.marginBottom = "1%";
            graphTailText.style.fontSize = "110%";
            graphBarHolder.appendChild(graphTailText);
        }
        
        graphRow.appendChild(graphBarHolder);

        document.getElementById('kudoGraphDiv').appendChild(graphRow);
    }

    const kudoScale = document.createElement('div');
    kudoScale.className = 'kudoGraphScale';

    const increments = 5;
    for (let j = 0; j < increments; j++) {
        const scaleIncrement = document.createElement('div');
        scaleIncrement.className = 'kudoScaleIncrement'
        scaleIncrement.style.width = (100 / increments) + "%";
        scaleIncrement.innerHTML = (maxValue / increments) * (j + 1);
        kudoScale.appendChild(scaleIncrement);
    }

    document.getElementById('kudoGraphDiv').appendChild(kudoScale);

    let sumOfKudos = 0;
    combined.forEach(e => {
        sumOfKudos+=e.totalKudos;
    })

    document.getElementById('kudoGraphSummary').innerHTML = '<b>' + combined.length + '</b> unique people kudoed | <b>' + sumOfKudos + '</b> total kudos'
}

combine();