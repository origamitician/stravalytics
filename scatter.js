let refArray = [];
function renderScatterplot(arr, prop1, prop2){
    refArray = [];
    var paras = document.getElementsByClassName('plot');

    while(paras[0]) {
        paras[0].parentNode.removeChild(paras[0]);
    }

    const array = [];
    arr.forEach(item => {
        if(item.distance < 30000){
            array.push({...item});
        }
        
    })
    array.forEach(item => {
        item.distance /= 1609
        item.elevation *= 3.28;
        item.pace = 1609 / item.pace;
        refArray.push({...item})
    })

    console.log("running!")
    let minX = 2147483647
    let minY = 2147483647
    let maxX = -1
    let maxY = -1
    const fixedArray = [];
    const regressionArray = [];
    array.forEach(item => {
        fixedArray.push({x: item[prop1], y: item[prop2]})
        regressionArray.push([item[prop1], item[prop2]])
        if(item[prop1] < minX){
            minX = item[prop1]
        }
        if(item[prop1] > maxX){
            maxX = item[prop1]
        }
        if(item[prop2] < minY){
            minY= item[prop2]
        }
        if(item[prop2] > maxY){
            maxY = item[prop2]
        }
    })
    console.log(regressionArray);
    for(var i = 0; i < fixedArray.length; i++){
        var plot = document.createElement('p');
        plot.className = 'plot';
        plot.style.left = ((fixedArray[i].x - minX) / (maxX - minX))*100 + '%';
        plot.style.bottom = ((fixedArray[i].y - minY) / (maxY- minY))*100 + '%';
        plot.id = i;
        plot.addEventListener('click', show)
        document.getElementById('scatterPlot').appendChild(plot)
    }


    

}

function show(){
    console.log(JSON.stringify(refArray[this.id]))
}
