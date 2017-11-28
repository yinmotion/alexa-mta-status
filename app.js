const GtfsRealtimeBindings = require("gtfs-realtime-bindings");
const request = require("request");
const _ = require("lodash");
const Promise = require("bluebird");

const mtaURL = "http://datamine.mta.info/mta_esi.php";

const feedIDs = require("./data/feedid.json");

const ALL_STATIONS = require("./data/stations-by-borough.json");

const GeocodingUtil = require("./geocoding-util");

const DBhelper = require("./database-helper");

const Values = require("./Values");

var mtaAPIkey;

var feedId = "1";
var trainLine = "4";
var direction = "uptown";

var stationName;

const testAddress = {
  stateOrRegion: "NY",
  city: "New York",
  countryCode: "US",
  postalCode: "10011",
  addressLine1: "114 5th Avenue",
  addressLine2: "",
  addressLine3: "",
  districtOrCounty: ""
};
var deviceId = "dev-12345";
var accessToken;
var apiEndpoint;

var requestSettings = {
  method: "GET",
  encoding: null
};

var myRes;
var myRej;

var App = {
  getNextArrivalTime: function(appObj, resolve, reject) {
    trainLine = appObj.line;
    direction = appObj.dir;
    deviceId = appObj.deviceId;
    accessToken = appObj.accessToken;
    apiEndpoint = appObj.apiEndpoint;

    let getStation = new Promise((resolve, reject) => {
      console.log("getNextArrivalTime appObj.deviceId = " + appObj.deviceId);
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
        console.log('getStation : aArrivals = ' + aArrivals);
        console.log('stationName = ' + stationName);
        let arrivalObj = {
          'arrivalTime': aArrivals[0],
          'stationName' : stationName
        }
        return Promise.resolve(arrivalObj);
      })
      .catch((error) => {
        console.log("DBhelper.getStationsById : error = " + error);
        return Promise.reject(error);
      });

    /*******************
     * Test data start *
     *******************/
    let arrivalInMins = "6 minutes";
    let stationName = "14 street union square";

    let obj = { arrivalTime: arrivalInMins, stationName: stationName };
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
     * Filter through all stations to find station that match the train line user spoken
     */
    for (var i = 0; i < userStations.length; i++) {
      var stopId = userStations[i].stopID;
      console.log("getUserStationByTrainLine : stopId = " + stopId);
      _.filter(ALL_STATIONS, function(borough) {
        let obj = _.filter(borough.stations, ["GTFS Stop ID", stopId])[0];
        console.log("getUserStationByTrainLine : obj = " + obj);
        if (obj !== undefined) {
          let lines = obj["Daytime Routes"].toString();
          if (lines.indexOf(trainLine) >= 0) {
            console.log("lines : " + lines);
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

    console.log("stationObj : station id = " + userStationId);
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
    console.log("line = " + trainLine);
    console.log("direction = " + direction);

    /** Get MTA Feed id based on trainline */
    for (var idObj of feedIDs) {
      if (idObj.trainLines.includes(trainLine)) {
        feedId = idObj.id;
        break;
      }
    }
    console.log("getFeed : feed_id = " + feedId);

    mtaAPIkey = process.env.mtaAPIkey;

    requestSettings.url = mtaURL + "?key=" + mtaAPIkey + "&feed_id=" + feedId;

    request(requestSettings, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
        var aArrivals = [];
        feed.entity.forEach(function(entity) {
          if (entity.trip_update) {
            //console.log(entity.trip_update.trip.route_id);

            entity.trip_update.stop_time_update.forEach(function(
              update,
              index
            ) {
              var route_id = entity.trip_update.trip.route_id;

              if (update.stop_id === stationID && route_id === trainLine) {
                //console.log("stop ID = " + update.stop_id);
                var date = new Date(0);
                var curDate = new Date();
                if (update.arrival) {
                  date.setUTCSeconds(update.arrival.time);
                  //console.log("arrival | " + date);
                  var arrivalInMins = (date.getTime() - curDate.getTime()) / 60000;
                  //console.log("time diff = " + arrivalInMins);
                  
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
