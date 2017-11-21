const request = require("request");
const _ = require("lodash");
const Promise = require('bluebird');
const AlexaDeviceAddressClient = require('./alexa-device-address-client');

const AWS = require("aws-sdk");

var tableName = process.env.userStationsTableName;

const localCredentials = {
  region: 'us-east-1',
  accessKeyId: 'local',
  secretAccessKey: 'local'
};

const awsCredentials = {
  region: 'us-east-1',
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey
};

const localURL = 'http://localhost:8000';
var localDynasty = require('dynasty')(localCredentials, localURL);

var awsDynasty = require('dynasty')(awsCredentials);

var dynasty = localDynasty;

var userStationsTable;

var devDeviceId = 'dev-12345';

const ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address";

const PERMISSIONS = [ALL_ADDRESS_PERMISSION];
/*
const dynamodb = new AWS.DynamoDB.DocumentClient({
    
  region: "localhost",
  endpoint: "http://localhost:8000"
});
*/

var appDataObj;

const DBhelper = {
  getStationsById: function (appObj) {
    appDataObj = appObj;
    let stations = [];

    readUserRecord(appObj.deviceId)
      .then((result) => {
        if(result && result.stations){
          return Promise.resolve(stations);
        }else{
          //TODO
        }
        
      })
      .then(() => {

      })
      .catch(function (error) {
        return Promise.reject('error');
      })
  },

  setDynasty: function () {
    console.log('setDynasty stage = ' + process.env.stage);
    if (process.env.stage === 'dev' || process.env.stage === 'prd') {

      dynasty = awsDynasty;
    }
  },

  readUserRecord: function (deviceId) {
    DBhelper.setDynasty();
    userStationsTable = dynasty.table(tableName);

    userStationsTable.find(deviceId)
      .then(function (result) {
        console.log('station distance = ' + result.stations.length);
        //console.log('user stations = ' + JSON.stringify(result.stations, null, '\t'));
        return Promise.resolve(result);
      })
      .catch(function (error) {
        console.log(error);
        return Promise.reject(error);
      })
  },

  testPut: function () {
    DBhelper.setDynasty();
    userStationsTable = dynasty.table(tableName);

    console.log('testPut : ' + userStationsTable);

    let aStations = [{
      "stopID": "R20",
      "distance": "0.2",
      "duration": "5 mins"
    }]

    userStationsTable.insert({
      userId: devDeviceId,
      stations: aStations
    }).catch(function (error) {
      console.log('testPut: error = ' + error);
    })

    return
  }
};

module.exports = DBhelper;