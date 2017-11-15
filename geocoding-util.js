'use strict';

const request = require('request');
const _=require('lodash');
const fs = require("fs");

const mapsAPIurl = 'https://maps.googleapis.com/maps/api/geocode/json';
const distanceAPIurl = "https://maps.googleapis.com/maps/api/distancematrix/json?mode=walking&units=imperial";
const mapsAPIkey = 'AIzaSyBVqsCgzlFaE8wxWXMtkC5gzJ7Wb1KgsUE';

const stationlocation = require('./data/stations-by-borough.json');

var testAddress = {
    "stateOrRegion": "NY",
    "city": "New York",
    "countryCode": "US",
    "postalCode": "10011",
    "addressLine1": "114 5th Avenue",
    "addressLine2": "",
    "addressLine3": "",
    "districtOrCounty": ""
};

var formattedAddress = "";

var stations;
var stations_sorted = [];

var requestSettings = {
    method: 'GET',
    encoding: null
};

var GeocodingUtil = {
    getGeoCode: function (address) {
        var index = 0
        var currStation = {};

        if (!address) {
            address = testAddress;
        }
        formattedAddress = address.addressLine1.split(" ").join("+") + ",+" + address.city.split(" ").join("+") + ",+" + address.stateOrRegion + "+" + address.postalCode + ",+US";
        requestSettings.url = mapsAPIurl + "?address=" + formattedAddress + "&key=" + mapsAPIkey;
        console.log("formatted address = " + formattedAddress);

        getStationsByBorough(address.city);

        //console.log(stations);
        /*
        request(requestSettings, function (error, response, body) {
            let obj = JSON.parse(body);
            if (!error && response.statusCode == 200) {
                let status = obj.status;
                console.log('status = ' + status);
                if (status !== 'OK')
                    return;
    
                let lat = obj.results[0].geometry.location.lat;
                let lng = obj.results[0].geometry.location.lng;
                console.log('latLng = ' + lat + ","+lng);
            }
        });
        */

        function getStationsByBorough(borough) {
            let aStations = [];
            stationlocation.forEach(element => {
                if (element.BoroughName.indexOf(borough) >= 0) {
                    element.stations.forEach(station => {
                        let objStation = {};
                        objStation.stopID = station["GTFS Stop ID"];
                        objStation.stopName = station["Stop Name"];
                        objStation.lines = station["Daytime Routes"];
                        objStation.latLng = station["GTFS Latitude"] + "," + station["GTFS Longitude"];
                        aStations.push(objStation);
                    })
                }
            });

            stations = aStations;

            getDistance();
        };

        function compare(a, b){
            if(a.distance < b.distance)
                return -1;
            if(a.distance > b.distance)
                return 1;
            return 0;
        }

        function getDistance() {
            if (index < stations.length) {
                currStation = stations[index];
                
                let requestSettings = {
                    method: 'GET',
                    url: distanceAPIurl + "&origins=" + formattedAddress + "&destinations=" + currStation.latLng + "&key=" + mapsAPIkey
                };
                request(requestSettings, function (error, response, body) {
                    let obj = JSON.parse(body);
                    if (!error && response.statusCode == 200) {
                        let status = obj.status;
                        //console.log('status = ' + status);
                        let result = obj.rows[0].elements[0]
                        if (result.status === 'OK') {
                            currStation.distance = result.distance.text.split(' ')[0];
                            currStation.duration = result.duration.text;
                            
                            let newStation = _.pick(currStation, ['stopID', 'stopName', 'lines', 'distance', 'duration']);
                            console.log('newStation = ' + JSON.stringify(newStation, null, '\t'));
                            stations_sorted.push(newStation);
                            index++;
                            getDistance();
                        } else {
                            console.log('distance error '+JSON.stringify(result));
                        }
                    }
                })
            }else{
                console.log('get distance completed');
                stations_sorted.sort(compare);
                let stationsJSON =  JSON.stringify(stations_sorted, null, '\t');
                console.log('stations = ' + stationsJSON);
                /*
                fs.writeFile('./data/stations-sorted.json', stationsJSON, (err) => {
                    if (err) throw err;
                    console.log('Complete');
                });
                */
            }
        }

    }
};

module.exports = GeocodingUtil;

GeocodingUtil.getGeoCode(process.argv[2]);