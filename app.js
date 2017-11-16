const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const request = require('request');
const _=require('lodash');
const mtaURL = 'http://datamine.mta.info/mta_esi.php';

const feedIDs = require('./data/feedid.json');

const GeocodingUtil = require('./geocoding-util');

var mtaAPIkey;

var feedId = '1';
var trainLine = '4';
var direction = 'uptown'

const testAddress = {
  "stateOrRegion": "NY",
  "city": "New York",
  "countryCode": "US",
  "postalCode": "10011",
  "addressLine1": "114 5th Avenue",
  "addressLine2": "",
  "addressLine3": "",
  "districtOrCounty": ""
};
const devideId = 'dev-12345';

var requestSettings = {
  method: 'GET',
  encoding: null
};


var App = {
  getNextArrivalTime: function(){
    let arrivalInMins = '6 minutes';
    let stationName = '14 street union square'
    
    let obj = {'arrivalTime' : arrivalInMins, 'stationName' : stationName};
    //TODO

    return obj;
  },

  checkStation: function (line_dir) {
    console.log("path = "+ process.env.path);

    //return;

    trainLine = line_dir.line.toUpperCase();
    direction = line_dir.direction;

    console.log('device id = ' + line_dir.deviceId);

    console.log("line = " + trainLine);
    console.log("direction = " + direction);

    for (var idObj of feedIDs) {
      if (idObj.trainLines.includes(trainLine)) {
        feedId = idObj.id;
        break;
      }
    }

    mtaAPIkey = process.env.mtaAPIkey;

    requestSettings.url = mtaURL + '?key=' + mtaAPIkey + '&feed_id=' + feedId;

    console.log("feed_id = " + feedId);
    console.log("requestSettings.url = " + requestSettings.url);
    //console.log("requestSettings.method = " + requestSettings.method);
    //console.log("googleMapsAPIkey = " + process.env.googleMapsAPIkey);
    //console.log("requestSettings.url = " + requestSettings.url);

    GeocodingUtil.getGeoCode(testAddress, deviceId);
    //this.getFeed();
  },

  getFeed: function () {
    request(requestSettings, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
        var aArrivals = [];
        feed.entity.forEach(function (entity) {
          if (entity.trip_update) {
            //console.log(entity.trip_update.trip.route_id);

            entity.trip_update.stop_time_update.forEach(function (update, index) {
              var route_id = entity.trip_update.trip.route_id;

              if (update.stop_id === '635S' && route_id === trainLine) {
                console.log("stop ID = " + update.stop_id);
                var date = new Date(0);
                var curDate = new Date();
                if (update.arrival) {
                  date.setUTCSeconds(update.arrival.time);



                  console.log("arrival | " + date);
                  var arrivalInMins = (date.getTime() - curDate.getTime()) / 60000;
                  console.log("time diff = " + arrivalInMins);

                  aArrivals.push(arrivalInMins);

                }
                /*
                date = new Date(0);
                if(update.departure){
                  date.setUTCSeconds(update.departure.time);

                  console.log("departure | " + date);
                }
                */
                console.log("====================================================================")
              };

            })
          }


        });
        aArrivals = aArrivals.sort(function (a, b) {
          return a - b;
        });
        console.log(aArrivals);
      } else {
        console.log(error);
        console.log(response)
      }
    })
  }

};

module.exports = App;

//GTFSrealtimeService.getFeed();