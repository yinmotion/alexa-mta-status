const request = require("request");
const _ = require("lodash");

const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: "localhost",
  endpoint: "http://localhost:8000"
});

var DBhelper = {
  getStationsById: function(deviceId) {
    let stations = [];

    return stations;
  },

  testPut: function() {
    var params = {
      Item: {
        userId: {
          S: "test-1234"
        },
        stations: {
          S:
            '[{"stopID": "R20", "stopName": "14 St - Union Sq", "lines": "N Q R W", "distance": "0.2", "duration": "5 mins"}]'
        },
        ReturnConsumedCapacity: "TOTAL",
        TableName: "userStationsTable"
      }
    };

    dynamodb.putItem(params, function(err, data) {
      if (err)
        console.log(err, err.stack); // an error occurred
      else console.log(data); // successful response
      /*
        data = {
         ConsumedCapacity: {
          CapacityUnits: 1, 
          TableName: "Music"
         }
        }
        */
    });
  }
};

module.exports = DBhelper;
