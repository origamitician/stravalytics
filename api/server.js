const express = require('express');
var cors = require('cors');
const mongoose = require('mongoose');
const path = require('path')
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json())
app.use(express.static(path.join(__dirname, '../')));

require('dotenv').config();

let allActivities = []

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'index.html'))
})

mongoose.connect("mongodb+srv://micaiahcape22:micaiah05@urlshortener.afsxdo4.mongodb.net/?retryWrites=true&w=majority")

app.get('/api/activities/', (req, res) => {
    allActivities = [];
    // mini callback hell!!!!!!11!11!1!!1!1
    const CLIENT_ID = 107318
    const CLIENT_SECRET = '1bac185421708876ddd639fcef0a319d5896d3b1'
    RefreshTokens.findOne({}).then((err, data) => {
        if (err) {
            console.log(err)
        } else {
            if (data) {
                // if the document found something - start requesting resources.
                
            } else {
                // if no refresh tokens were not found - create a new RefreshToken instance.
                // const token = data.refreshToken

                //  getting the access token using the refresh token
                console.log('no refresh tokens')
                const token = '48f138733218bdd7c10c586c704b8f104a5221f2'
                fetch(`https://www.strava.com/api/v3/oauth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&refresh_token=${token}&grant_type=refresh_token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                }).then((res) => res.json()).then((j) => {
                    // fetching each page of activities using the obtained access token
                    const key = j.access_token
                    
                    //make sure this is an array of Promise objects.
                    Promise.all([
                        getIndividualPaginatedData(1, key), 
                        getIndividualPaginatedData(2, key), 
                        getIndividualPaginatedData(3, key), 
                        getIndividualPaginatedData(4, key)]).then(() => {
                            res.send(allActivities)
                        })
                })
            }
        }
    })
})

// async function getAllPaginatedData(key){
//     const [prom1, prom2, prom3, prom4] = await 
// }

function getIndividualPaginatedData(page, accessKey) {
    return new Promise ((resolve, reject) => {
        // WAIT until this fetch function finishes, then resolve the promise
        fetch("https://www.strava.com/api/v3/athlete/activities?access_token=" + accessKey + "&page=" + page + "&per_page=200&after=" + 0 + "&before=" + Math.round(Date.now()/1000)).then((response) => response.json()).then((jsonData) => {  
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
            resolve("success")
        })
    })
}

const refreshTokenDoc = new mongoose.Schema({
    refreshToken: String,
})

const RefreshTokens = mongoose.model("tokens", refreshTokenDoc);

const port = 3000
app.listen(port, () => {
    console.log("Server is running on port: " + port);
});