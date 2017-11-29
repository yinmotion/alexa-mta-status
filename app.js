const GtfsRealtimeBindings = require("gtfs-realtime-bindings");
const request = require("request");
const _ = require("lodash");
const Promise = require("bluebird");

const feedIDs = require("./data/feedid.json");

const ALL_STATIONS = require("./data/stations-by-borough.json");

const GeocodingUtil = require("./geocoding-util");

const DBhelper = require("./database-helper");

const Values = require("./res/values");

var mtaURL;
var mtaAPIkey;

var feedId = 1;
var trainLine;
var direction;

var stationName;

var deviceId;
var accessToken;
var apiEndpoint;

var requestSettings = {
  method: "GET",
  encoding: null
};

var trainNumber;

var App = {
  getNextArrivalTime: function(appObj, resolve, reject) {
    trainLine = appObj.line;
    direction = appObj.direction;
    deviceId = appObj.deviceId;
    accessToken = appObj.accessToken;
    apiEndpoint = appObj.apiEndpoint;

    trainNumber = trainLine.split(" ")[0];

    if(isNaN(trainNumber)){
      trainNumber = trainNumber.toLowerCase();
    }

    let getStation = new Promise((resolve, reject) => {
      console.log("App.getNextArrivalTime : deviceId = " + appObj.deviceId);
      DBhelper.getStationsById(appObj, resolve, reject);
    });

    getStation
      .then((stations) => {
        /*
        console.log("App.getNextArrivalTime : stations = " + stations[0].duration);
        */
        let stationID = App.getUserStationByTrainLine(stations);
        
        console.log('stationID = ' + stationID);
        return new Promise((resolve, reject) => {
          App.getFeed(stationID, resolve, reject);
        })
      })
      .then((aArrivals) => {
        console.log('App.getStation : aArrivals = ' + aArrivals);
        console.log('App.getStation : stationName = ' + stationName);
        let arrivalTime = Math.round(aArrivals[0]) + ' minutes';
        let arrivalObj = {
          'arrivalTime': arrivalTime,
          'stationName' : stationName
        }
        resolve(arrivalObj);
      })
      .catch((error) => {
        console.log("App.getStation.getStationsById : error = " + error);
        reject(error);
      });

    /*******************
     * Test data start *
     *******************/
    // let arrivalInMins = "6 minutes";
    // let stationName = "14 street union square";

    // let obj = { arrivalTime: arrivalInMins, stationName: stationName };
    /** Test data end **/

    /*
    if(obj){
      return Promise.resolve(obj)
    }else{
      return Promise.reject('error : ')
    }
    */
  },

  getUserStationByTrainLine: function(userStations) {
    let userStationId;
    let station;
    //console.log('ALL_STATIONS : ' + ALL_STATIONS);
    /**
     * Filter through all stations to find station that match the train line(e.g. 4 train) user spoken
     */
    for (var i = 0; i < userStations.length; i++) {
      var stopId = userStations[i].stopID;
      console.log("getUserStationByTrainLine : stopId = " + stopId);
      _.filter(ALL_STATIONS, function(borough) {
        let obj = _.filter(borough.stations, ["GTFS Stop ID", stopId])[0];
        console.log("getUserStationByTrainLine : obj = " + obj);
        if (obj !== undefined) {
          console.log("getUserStationByTrainLine : obj = " + JSON.stringify(obj));
          let lines = obj["Daytime Routes"].toString().toLowerCase();
          console.log('getUserStationByTrainLine : lines = ' + lines);
          
          if (lines.indexOf(trainNumber) >= 0) {
            console.log("getUserStationByTrainLine : station = " + JSON.stringify(obj));
            console.log("getUserStationByTrainLine : lines : " + lines);
            station = obj;
          }
        }
      });
      
      if(station !== undefined && station!==""){
        //console.log('!!! station = ' + station["GTFS Stop ID"]);
        break;
      }
    }

    console.log('getUserStationByTrainLine : station = ' + JSON.stringify(station));
    userStationId = station["GTFS Stop ID"];

    stationName = station["Stop Name"];

    console.log("stationObj : stationName = " + stationName);
    console.log(
      "---------------------------------------------------------------------"
    );

    let dirLetter;

    switch (direction) {
      case Values.DIR_DOWNTOWN:
        dirLetter = Values.DIRECTION_SOUTH;
        break;

      case Values.DIR_UPTOWN:
        dirLetter = Values.DIRECTION_NORTH;
        break;

      default:
        dirLetter = Values.DIRECTION_NORTH;
    }

    userStationId = userStationId + dirLetter;

    return userStationId;
  },

  getFeed: function(stationID, resolve, reject) {
    console.log("App.getFeed : line = " + trainLine);
    console.log("App.getFeed : direction = " + direction);

    
    /** 
     * Get MTA Feed id based on trainline 
     * 
     */
    for (var idObj of feedIDs) {
      let lines = idObj.trainLines.toLowerCase();
      if (lines.includes(trainNumber)) {
        feedId = idObj.id;
        break;
      }
    }
    console.log("App getFeed : feed_id = " + feedId);

    mtaURL = process.env.mtaAPIURL;  
    mtaAPIkey = process.env.mtaAPIkey;

    requestSettings.url = mtaURL + "?key=" + mtaAPIkey + "&feed_id=" + feedId;
    
    console.log('mta url = ' + requestSettings.url);

    request(requestSettings, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
        //console.log('feed = ' + body);
        var aArrivals = [];
        feed.entity.forEach(function(entity) {
          // console.log(entity.trip_update);
          if (entity.trip_update) {

            entity.trip_update.stop_time_update.forEach(function(update,index) {
              var route_id = entity.trip_update.trip.route_id;
              if(isNaN(route_id)){
                route_id = route_id.toLowerCase();
              }
              // console.log('update.stop_id = ' + update.stop_id);
              // console.log('stationID = ' + stationID);
              // console.log('route_id = ' + route_id);
              // console.log('trainNumber = ' + trainNumber);

              if (update.stop_id === stationID && route_id === trainNumber) {
                console.log("App.getFeed : stop ID = " + update.stop_id);
                var date = new Date(0);
                var curDate = new Date();
                if (update.arrival) {
                  date.setUTCSeconds(update.arrival.time);
                  console.log("arrival | " + date);
                  var arrivalInMins = (date.getTime() - curDate.getTime()) / 60000;
                  console.log("time diff = " + arrivalInMins);
                  
                  if(arrivalInMins>0){
                    aArrivals.push(arrivalInMins);
                  }
                }
                /* 
                date = new Date(0);
                if(update.departure){
                  date.setUTCSeconds(update.departure.time);

                  console.log("departure | " + date);
                }
                console.log(
                  "===================================================================="
                );
                 */
              }
            });
          }
        });
        aArrivals = aArrivals.sort(function(a, b) {
          return a - b;
        });
        //console.log(aArrivals);
        resolve(aArrivals);
      } else {
        //console.log(error);
        //console.log(response);
        reject(error);
      }
    });
  }
};

module.exports = App;
