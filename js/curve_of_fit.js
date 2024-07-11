/***********************************************
This is nonfunctional. Paste towards the end of scatter.js.
 */

// find the best way of regression by finding the greatest r squared values
let maxRSquared = -2;
let calib;

calib = regression.linear(regressionArray);
if(calib.r2 >= maxRSquared) {
    regressionType = 'linear';
    maxRSquared = calib.r2;
    calibCoefficients = calib.equation
}

calib = regression.polynomial(regressionArray, { order: 2 });
if(calib.r2 >= maxRSquared) {
    regressionType = 'parabolic';
    maxRSquared = calib.r2;
    calibCoefficients = calib.equation
}

calib = regression.exponential(regressionArray);
if(calib.r2 >= maxRSquared) {
    regressionType = 'exponential';
    maxRSquared = calib.r2;
    calibCoefficients = calib.equation
}

calib = regression.logarithmic(regressionArray);
if(calib.r2 >= maxRSquared) {
    regressionType = 'logarithmic';
    maxRSquared = calib.r2;
    calibCoefficients = calib.equation
}

calib = regression.power(regressionArray);
if(calib.r2 >= maxRSquared) {
    regressionType = 'power';
    maxRSquared = calib.r2;
    calibCoefficients = calib.equation
}

let canvHeight;
if(myCanvas.getBoundingClientRect().width == 0) {
    canvWidth = window.innerWidth *0.8;
    canvHeight = window.innerHeight *0.8
} else {
    canvWidth = myCanvas.getBoundingClientRect().width;
    canvHeight = myCanvas.getBoundingClientRect().height;
}

c.beginPath();
c.lineWidth = 4;
c.strokeStyle = "orange";
const scrubbingRate = 201

c.moveTo(0, canvHeight)

const coefficientArray = []; // to house negative coefficents, if needed
for (let i = 0; i < calibCoefficients.length; i++) {
    if(calibCoefficients[i] < 0 || i == 0) {
        coefficientArray[i] = calibCoefficients[i].toFixed(2)
    } else {
        // never put a "+" before the first term.
        coefficientArray[i] = "+" + calibCoefficients[i].toFixed(2)
    }
}

const equation = document.getElementById("curveEquation")
if(regressionType == 'linear') {
    equation.innerHTML = "y=" + coefficientArray[0]  + "x" + coefficientArray[1]
}else if (regressionType == 'parabolic') {
    equation.innerHTML =  "y=" + coefficientArray[0] + "x<sup>2</sup>" + coefficientArray[1] + "x" + coefficientArray[2]
} else if (regressionType == 'cubic') {
    equation.innerHTML =  "y=" + coefficientArray[0] + "x<sup>3</sup>" + coefficientArray[1] + "x<sup>2</sup>+" + coefficientArray[2] + "x" + coefficientArray[3]
} else if (regressionType == 'exponential') {
    equation.innerHTML = "y=" + coefficientArray[0] + "e<sup>" + coefficientArray[1] + "x</sup>"
} else if (regressionType == 'logarithmic') {
    equation.innerHTML = "y=" + coefficientArray[0] + coefficientArray[1] + "log(x)"
} else if (regressionType == 'power') {
    equation.innerHTML = "y=" + coefficientArray[0] + "x<sup>" + coefficientArray[1] + "</sup>"
}

// console.log("MaxX: " + maxX + " MinX: " +  minX + " MaxY: " + maxY + " MinY: " + minY)
for (let i = 0; i < scrubbingRate; i++) {
    const calculatedX = i * ((topX - bottomX) / scrubbingRate) + bottomX
    const calculatedY = calculatePrediction(calculatedX, regressionType, calibCoefficients);
    c.fillStyle = 'orange';

    const plot = document.createElement('p');
    plot.className = 'plot';
    const left = ((calculatedX - bottomX) / (topX - bottomX))*100
    plot.style.left = left + '%';
    const bot = ((calculatedY - bottomY) / (topY- bottomY))*100 
    plot.style.bottom = bot + '%';
    
    if(bot <= 100 && bot >= 0) {
        const newID = "prediction_" + calculatedX + '_' + calculatedY + '_' + left.toFixed(2) + '_' + bot.toFixed(2);
        plot.id = newID
        plot.style.backgroundColor = document.getElementsByName('curveColor')[0].value
        plot.style.height = document.getElementsByName('curveSize')[0].value + "px";
        plot.style.width = document.getElementsByName('curveSize')[0].value + "px";
        plot.addEventListener('mouseover', () => showPrediction(prop1, prop2, newID))
        plot.addEventListener('mouseout', hidePrediction)
        document.getElementById('scatterPlot').appendChild(plot)
    }
}