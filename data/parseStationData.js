'use strict';

const fs = require("fs");

var stationsByBorough = [
    {
        "Borough": "Bx", 
        "BoroughName": "Bronx", 
        'stations':[]
    },
    {
        "Borough": "M", 
        "BoroughName": "New York, Manhattan", 
        'stations':[]
    },
    {
        "Borough": "Q", 
        "BoroughName": "Queens", 
        'stations':[]
    },
    {
        "Borough": "Bk", 
        "BoroughName": "Brooklyn", 
        'stations':[]
    },
    {
        "Borough": "SI", 
        "BoroughName": "Staten Island", 
        'stations':[]
    }
];

fs.readFile('./stations.json', (err, data) => {
    if (err) throw err;
    let stations = JSON.parse(data);
    stations.forEach(element => {
        let boroughId = element.Borough;
        stationsByBorough.forEach(borough => {
            if(borough.Borough === boroughId){
                borough.stations.push(element);
            }
        })
    });

    let stationsData = JSON.stringify(stationsByBorough, null, '\t');
    
    fs.writeFile('./stations-by-borough.json', stationsData, (err) => {
        if (err) throw err;
        console.log('Complete');
    });
})