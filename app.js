const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const request = require('request');
const mtaURL = 'http://datamine.mta.info/mta_esi.php';

const feedIDs = require('./data/feedid.json');
const stationlocation = require('./data/stationlocation.json');

const apiKey = '6c2cdead4118f35fe1ed1a3604e37ffb';

var feedId = '1';

var requestSettings = {
  method: 'GET',
  url: 'http://datamine.mta.info/mta_esi.php?key=6c2cdead4118f35fe1ed1a3604e37ffb&feed_id=1',
  encoding: null
};

var GTFSrealtimeService = {
  checkStation: function(line, direction){
    line = line.toUpperCase();
    console.log("line = " + line);
    console.log("direction = " + direction);

    for(var idObj of feedIDs){
      if(idObj.trainLines.includes(line)){
        feedId = idObj.id;
        break;
      }
    }

    console.log("feedId = " + feedId);
  },

  getFeed : function(){

    request(requestSettings, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
        var aArrivals = [];
        feed.entity.forEach(function(entity) {
          if (entity.trip_update) {
            //console.log(entity.trip_update.trip.route_id);

             entity.trip_update.stop_time_update.forEach(function(update, index) {
              var route_id = entity.trip_update.trip.route_id;

              if(update.stop_id === '635N' && route_id === "6"){
                console.log("stop ID = " + update.stop_id);
                var date = new Date(0);
                var curDate = new Date();
                if(update.arrival){
                date.setUTCSeconds(update.arrival.time);



                console.log("arrival | " + date);
                var arrivalInMins = (date.getTime()-curDate.getTime())/60000;
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
          aArrivals = aArrivals.sort(function (a, b) {  return a - b;  });
          console.log(aArrivals);
      }else{
        console.log(error);
        console.log(response)
      }
    })
  }

};

/*
request(requestSettings, function(error, response, body) {
  if (!error && response.statusCode == 200) {
    var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
    var aArrivals = [];
    feed.entity.forEach(function(entity) {
      if (entity.trip_update) {
        //console.log(entity.trip_update.trip.route_id);

         entity.trip_update.stop_time_update.forEach(function(update, index) {
          var route_id = entity.trip_update.trip.route_id;

          if(update.stop_id === '635N' && route_id === "6"){
            console.log("stop ID = " + update.stop_id);
            var date = new Date(0);
            var curDate = new Date();
            if(update.arrival){
            date.setUTCSeconds(update.arrival.time);



            console.log("arrival | " + date);
            var arrivalInMins = (date.getTime()-curDate.getTime())/60000;
            console.log("time diff = " + arrivalInMins);

            aArrivals.push(arrivalInMins);

          }
          /*
          date = new Date(0);
          if(update.departure){
            date.setUTCSeconds(update.departure.time);

            console.log("departure | " + date);
          }

          console.log("====================================================================")
          };

        })
      }


    });
      aArrivals = aArrivals.sort(function (a, b) {  return a - b;  });
      console.log(aArrivals);
  }else{
    console.log(error);
    console.log(response)
  }
});
*/

module.exports = GTFSrealtimeService;

//GTFSrealtimeService.checkStation(process.argv[2], process.argv[3]);
GTFSrealtimeService.getFeed();

