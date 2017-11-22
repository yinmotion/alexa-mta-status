'use strict';


const _=require('lodash');
const fs = require("fs");
const Promise = require('bluebird');
const rp = require('request-promise');

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
var test_stations_sorted = require('./data/test-user-stations.json');

var requestSettings = {
    method: 'GET',
    encoding: null
};

var GeocodingUtil = {
    getGeoCode: function (address, id, resolve, reject) {
        console.log('GeocodingUtil.getGeoCode : deviceId = ' + id);

        devideId = id;

        var index = 0
        var currStation = {};

        var stations_sorted = [];

        mapsAPIkey = process.env.googleMapsAPIkey;

        formattedAddress = address.addressLine1.split(" ").join("+") + ",+" + address.city.split(" ").join("+") + ",+" + address.stateOrRegion + "+" + address.postalCode + ",+US";
        requestSettings.url = mapsAPIurl + "?address=" + formattedAddress + "&key=" + mapsAPIkey;
        requestSettings.json = true;
        console.log("requestSettings.url = " + requestSettings.url);

        getStationsByBorough(address.city);

        let getDistancePromise = new Promise((resolve, reject) => {
            getDistance(stations, resolve, reject);
        });

        getDistancePromise
        .then((stations) => {
            console.log('getDistancePromise : ' + stations.length);
            resolve(stations);
        });

        /*
        //Get user address' geo code
        //NOT USED
        //use user address directly
        rp(requestSettings)
        .then(function(response){
            
            if (!error && response.statusCode == 200) {
                let status = response.status;
                console.log('status = ' + status);
                if (status !== 'OK')
                    return;
    
                let lat = response.results[0].geometry.location.lat;
                let lng = response.results[0].geometry.location.lng;
                console.log('latLng = ' + lat + ","+lng);
            }
        })
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

            //return Promise.resolve(stations);
            stations = aStations;
        };

        function compare(a, b){
            if(a.distance < b.distance)
                return -1;
            if(a.distance > b.distance)
                return 1;
            return 0;
        }

        function getDistance(aStations, resolve, reject) {
            console.log("getDistance");

            /**
             * Skip getting stations for dev
             */

            resolve(test_stations_sorted);
            return;

            if (index < aStations.length) {
                currStation = aStations[index];
                
                let requestSettings = {
                    method: 'GET',
                    url: distanceAPIurl + "&origins=" + formattedAddress + "&destinations=" + currStation.latLng + "&key=" + mapsAPIkey,
                    json: true,
                    resolveWithFullResponse: true
                };

                console.log(requestSettings.url);
                //return;

                rp(requestSettings)
                .then((response) => {
                    //console.log(response);
                    if(response.statusCode == 200) {
                        let result = response.body.rows[0].elements[0]
                        if (result.status === 'OK') {
                            //distance in miles
                            currStation.distance = result.distance.text.split(' ')[0];
                            currStation.duration = result.duration.text;
                            /**
                             * Pick station within the user station radius
                             * For storing in user station DB
                             */
                            if(currStation.distance<=userStationRadius){
                                let newStation = _.pick(currStation, ['stopID', 'distance', 'duration']);
                                console.log('newStation = ' + JSON.stringify(newStation, null, '\t'));
                                stations_sorted.push(newStation);
                            }
                            index++;
                            getDistance(aStations, resolve, reject);
                        } else {
                            console.log('distance error '+JSON.stringify(result));
                        }
                    }
                })
                .catch((reason) => {
                    console.log(reason);
                })

                /*
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
                */
            }else{
                console.log('get distance completed');
                stations_sorted.sort(compare);
                let stationsJSON =  JSON.stringify(stations_sorted, null, '\t');
                console.log('stations = ' + stationsJSON);

                resolve(stations_sorted);
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
    getUserStations : function(address, deviceId, resolve, reject){
        console.log("geocolding-util > getUserStations");

        //*
        let getGeoCodePromise = new Promise((resolve, reject) => {
            GeocodingUtil.getGeoCode(address, deviceId, resolve, reject);
        });

        getGeoCodePromise
        .then((stations_sorted) => {
            resolve(stations_sorted);
        })
        .catch((error) => {
            console.log(error);
            reject(error);
        })
        //*/
        /*
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
        */
    }
};

module.exports = GeocodingUtil;

//GeocodingUtil.getGeoCode(process.argv[2]);