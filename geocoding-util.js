'use strict';

const request = require('request');
const _=require('lodash');
const fs = require("fs");
const Promise = require('bluebird');
const DatabaseHelper = require('./database-helper');

const mapsAPIurl = 'https://maps.googleapis.com/maps/api/geocode/json';
const distanceAPIurl = "https://maps.googleapis.com/maps/api/distancematrix/json?mode=walking&units=imperial";

const stationlocation = require('./data/stations-by-borough.json');

/**
 * FOR DEV ONLY
 * static stations list sorted by distance from testAddress to union sq station 
 */
const sortedStationJSON = require('./data/stations-sorted.json'); 

var devideId;

var mapsAPIkey;

/** Max. distance for selecting stations around a user  **/
const userStationRadius = 1;

var formattedAddress = "";

var stations;
var stations_sorted = [];

var requestSettings = {
    method: 'GET',
    encoding: null
};

var GeocodingUtil = {
    getGeoCode: function (address, id) {
        devideId = id;

        var index = 0
        var currStation = {};
        mapsAPIkey = process.env.googleMapsAPIkey;

        formattedAddress = address.addressLine1.split(" ").join("+") + ",+" + address.city.split(" ").join("+") + ",+" + address.stateOrRegion + "+" + address.postalCode + ",+US";
        requestSettings.url = mapsAPIurl + "?address=" + formattedAddress + "&key=" + mapsAPIkey;
        console.log("formatted address = " + formattedAddress);

        getStationsByBorough(address.city);

        getDistance();

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
        };

        function compare(a, b){
            if(a.distance < b.distance)
                return -1;
            if(a.distance > b.distance)
                return 1;
            return 0;
        }

        function getDistance() {
            console.log("getDistance");
            return;

            /*
               
            */

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
                            //distance in miles
                            currStation.distance = result.distance.text.split(' ')[0];
                            currStation.duration = result.duration.text;
                            /**
                             * Pick station within the user station radius
                             * For storing in user station DB
                             */
                            if(distance<=userStationRadius){
                                let newStation = _.pick(currStation, ['stopID', 'distance', 'duration']);
                                console.log('newStation = ' + JSON.stringify(newStation, null, '\t'));
                                stations_sorted.push(newStation);
                            }
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

    },
    /**
     * 
     */
    getUserStations : function(address, id, callback){
        console.log("geocolding-util > getUserStations");

        let aStations = [];
        for(var i = 0; i < sortedStationJSON.length; i++){
            let station = sortedStationJSON[i];
            if(station.distance <= userStationRadius){
                let obj = _.pick(station, ['stopID', 'distance', 'duration']);
                aStations.push(obj);
            }else{
                console.log("geocolding-util > getUserStations : complete");
                break;
            }
        };
        if(aStations.length === 0){
            return Promise.reject('No Stations Found!')
        }else{
            return Promise.resolve(aStations);
        }
    }
};

module.exports = GeocodingUtil;

//GeocodingUtil.getGeoCode(process.argv[2]);