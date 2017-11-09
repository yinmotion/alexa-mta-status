'use strict';

const fs = require("fs");
const request = require('request');

const mapsAPIurl = 'https://maps.googleapis.com/maps/api/geocode/json';
const mapsAPIkey = 'AIzaSyBVqsCgzlFaE8wxWXMtkC5gzJ7Wb1KgsUE';

var stations;
var newStations = [];

var index = 0;

var requestSettings = {
    method: 'GET',
    encoding: null
};

fs.readFile('./stationlocation.json', (err, data) => {
    if(err) throw err;
    stations = JSON.parse(data);

    readStationData();
    /*
    stations.forEach(element => {
        let latlng = element['GTFS Latitude']+','+element['GTFS Longitude'];
        //console.log('GTFS Latitude '+ element['GTFS Latitude']);
        //requestSettings.url = mapsAPIurl + '?key=' + mapsAPIkey + "&latlng="+ latlng;
        var reqSettings = requestSettings;
        reqSettings.url = mapsAPIurl + '?key=' + mapsAPIkey + "&latlng="+ latlng;
        getAddress(element, reqSettings);

        
        //aStations.push(element);
        //console.log(element['GTFS Latitude']);
    });
    /*
    let newStations = JSON.stringify(aStations);
    fs.writeFile('./stations.json', newStations, (err)=>{
        if(err) throw err;
        console.log('written to file');
    });
    */
});

var readStationData = function(){
    if(index<stations.length){
        var element = stations[index];
        let latlng = element['GTFS Latitude']+','+element['GTFS Longitude'];
        var reqSettings = requestSettings;
        reqSettings.url = mapsAPIurl + '?key=' + mapsAPIkey + "&latlng="+ latlng;
        getAddress(element, reqSettings);
    }else{
        let data = JSON.stringify(newStations);
        fs.writeFile('./stations.json', data, (err)=>{
            if(err) throw err;
            console.log('written to file');
        });
        console.log('Complete');
    }
};

var getAddress = function(element, reqSettings){
    request(reqSettings, function(error, response, body) {
        let obj = JSON.parse(body);
        if (!error && response.statusCode == 200) {
            let status = obj.status;
            console.log('status = '+status);
            if(status !== 'OK')
            return;

            let result = obj.results[0];
            console.log('result = '+result);
            
            if(result!=null && result!=undefined){
                element['address']=result.formatted_address;
                newStations.push(element);

                let data = JSON.stringify(newStations, null, '\t');
                
                console.log(data);
                console.log('------------------------------------------------------------------------');      
            }else{
                console.log('!!! Latitude : ' + element['GTFS Latitude'] + " | no result !!!");       
            }
            index++;
            setTimeout(readStationData, 300);
        }
    })
}




