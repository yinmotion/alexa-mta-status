const request = require("request");
const _ = require("lodash");
const Promise = require('bluebird');
const AlexaDeviceAddressClient = require('./alexa-device-address-client');
const GeoCodingUtil = require('./geocoding-util');
const Messages = require('./Messages');

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

const ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address";

const PERMISSIONS = [ALL_ADDRESS_PERMISSION];

var appDataObj;

const DBhelper = {
  getStationsById: function (appObj, resolve, reject) {
    appDataObj = appObj;
    let stations = [];

    let readUserRecordPromise = new Promise((resolve, reject) => {
      DBhelper.readUserRecord(appObj.deviceId, resolve, reject);
    });

    readUserRecordPromise
      .then((result) => {
        if (result && result.stations) {
          console.log('!!! readUserRecordPromise : ' + JSON.stringify(result.stations));
          resolve(result.stations);
        } else {
          /** */
          deviceAddressRequest = new AlexaDeviceAddressClient(appObj.apiEndpoint, appObj.deviceId, appObj.accessToken).getFullAddress();

          deviceAddressRequest.then((addressResponse) => {
            switch (addressResponse.statusCode) {
              case 200:
                console.log("Address successfully retrieved");
                let address = addressResponse.address;

                DBhelper.onGetUserAddress(address, appDataObj.deviceId, resolve, reject);

                break;
              case 204:
                // This likely means that the user didn't have their address set via the companion app.
                console.log("Successfully requested from the device address API, but no address was returned.");
                this.emit(":tell", Messages.NO_ADDRESS);
                break;
              case 403:
                console.log("The consent token we had wasn't authorized to access the user's address.");
                this.emit(":tellWithPermissionCard", Messages.NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);
                break;
              default:
                this.emit(":ask", Messages.LOCATION_FAILURE, Messages.LOCATION_FAILURE);
            }
          })
        }

      })
      .catch(function (error) {
        return Promise.reject(error);
      })
  },

  onGetUserAddress: function (address, deviceId, resolve, reject) {
    console.log('onGetUserAddress deviceId = ' + this);

    let getUserStationsPromise = new Promise((resolve, reject) => {
      console.log("getUserStationsPromise : ");
      GeoCodingUtil.getUserStations(address, deviceId, resolve, reject)
    });

    getUserStationsPromise
      .then((userStations) => {
        DBhelper.putUserStation(userStations, deviceId, resolve, reject);
      })
      .catch((error) => {
        reject(error);
      })
  },

  setDynasty: function () {
    console.log('setDynasty stage = ' + process.env.stage);
    if (process.env.stage === 'dev' || process.env.stage === 'prd') {

      dynasty = awsDynasty;
    }
  },

  readUserRecord: function (deviceId, resolve, reject) {
    console.log('readUserRecord : deviceId = ' + deviceId);
    DBhelper.setDynasty();
    userStationsTable = dynasty.table(tableName);

    //console.log('userStationsTable = ' + userStationsTable);

    userStationsTable.find(deviceId)
      .then((result) => {
        console.log('station distance = ' + result);
        //console.log('user stations = ' + JSON.stringify(result.stations, null, '\t'));
        resolve(result);
      })
      .catch(function (error) {
        console.log(error);
        reject(error);
      })

  },

  putUserStation: function (aStations, deviceId, resolve, reject) {
    DBhelper.setDynasty();
    userStationsTable = dynasty.table(tableName);

    console.log('putUserStation  : ' + userStationsTable);

    userStationsTable.insert({
        userId: deviceId,
        stations: aStations
      })
      .then((response) => {
        console.log('aStations = ' + aStations.length);
        resolve(aStations);
      })
      .catch(function (error) {
        reject(error);
        console.log('putUserStation: error = ' + error);
      })
  }
};

module.exports = DBhelper;