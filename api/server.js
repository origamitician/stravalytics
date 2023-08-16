const express = require('express');
var cors = require('cors');
const mongoose = require('mongoose');
const path = require('path')

const app = express();
app.use(cors());
app.use(express.json())
app.use(express.static(path.join(__dirname, '../')));

require('dotenv').config();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'index.html'))
})

const port = 3000
app.listen(port, () => {
    console.log("Server is running on port: " + port);
});