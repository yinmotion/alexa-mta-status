const request = require("request");
const _ = require("lodash");

const AWS = require("aws-sdk");

var tableName = process.env.userStationsTableName;

const localCredentials = {
    region: 'us-east-1',
    accessKeyId: 'local',
    secretAccessKey: 'local'
};
const localURL = 'http://localhost:8000';
var localDynasty = require('dynasty')(localCredentials, localURL);
var dynasty = localDynasty;

var userStationsTable;

var devDeviceId = 'dev-12345';
/*
const dynamodb = new AWS.DynamoDB.DocumentClient({
    
  region: "localhost",
  endpoint: "http://localhost:8000"
});
*/

var DBhelper = {
  getStationsById: function(deviceId) {
    let stations = [];

    return stations;
  },

  testRead: function() {
    userStationsTable = dynasty.table(tableName);

    userStationsTable.find(testUserId)
    .then(function(result){
        console.log('station distance = ' + result.stations.length);
        //console.log('user stations = ' + JSON.stringify(result.stations, null, '\t'));
        return result;
    })
    .catch(function(error){
        console.log(error);
    })
  },

  testPut: function() {
    userStationsTable = dynasty.table(tableName);
    
    let aStations = [{"stopID": "R20", "stopName": "14 St - Union Sq", "lines": "N Q R W", "distance": "0.2", "duration": "5 mins"}]
    
    userStationsTable.insert({
        userId: devDeviceId,
        stations: aStations
    }).catch(function(error){
        console.log(error);
    })
  }
};

module.exports = DBhelper;
