'use strict';

const App = require('./app');
const Messages = require('./Messages');

const Alexa = require('alexa-sdk');

const Promise = require('bluebird');

var $event = null;
var $alexa = null;
var $context = null;


module.exports.myFunction = (event, context, callback) => {

  var alexa = Alexa.handler(event, context);

  $event = event;
  $alexa = alexa;
  $context = $event.context;

  alexa.registerHandlers(handlers);
  alexa.execute();
};

const handlers = {
  'LaunchRequest': function () {
    this.response.speak(Messages.WELCOME_OUTPUT).listen(Messages.WELCOME_REPROMPT);
    this.emit(':responseReady');
  },

  'CheckMTAStatus': function (obj) {
    //delegateSlotCollection();

    if(process.env.stage === 'local'){
      var line = obj.line;
      var dir = obj.dir;
      
      var deviceId = obj.deviceId;
      var accessToken = obj.accessToken;
      var apiEndpoint = obj.apiEndpoint;
    }else{
      
      
      line = $event.request.intent.slots.subwaylineName.value;
      dir = $event.request.intent.slots.direction.value;
      
      deviceId = $context.System.device.deviceId;
      accessToken = $context.System.apiAccessToken;
      apiEndpoint = $context.System.apiEndpoint;

      console.log('CheckMTAStatus : stage = ' + process.env.stage);
      console.log('CheckMTAStatus : subwaylineName = ' + line);
      console.log('CheckMTAStatus : direction = ' + dir);
    };

    if(deviceId == null || deviceId == undefined){
      deviceId = 'dev-1234567';
    };

    if(apiEndpoint == null || apiEndpoint == undefined){
      apiEndpoint = 'https://api.amazonalexa.com';
    }
    
    console.log("CheckMTAStatus : deviceId = " + deviceId);
    console.log("CheckMTAStatus : accessToken = " + accessToken);
    console.log("CheckMTAStatus : apiEndpoint = " + apiEndpoint);
    console.log("CheckMTAStatus : line = " + line);
    console.log("CheckMTAStatus : dir = " + dir);

    let appObj = {
      'line' : line, 
      'direction' : dir, 
      'deviceId' : deviceId, 
      'accessToken' : accessToken, 
      'apiEndpoint' : apiEndpoint
    };

    let getNextArrivalTimePromise = new Promise((resolve, reject) => {
      App.getNextArrivalTime(appObj, resolve, reject);
    });

    getNextArrivalTimePromise
    .then((arrivalObj) => {
      console.log('arrivalObj.arrivalTime = ' + arrivalObj.arrivalTime);
      this.response.speak(`The next ` + $event.request.intent.slots.direction.value + ' ' + $event.request.intent.slots.subwaylineName.value + ' will arrive in ' + arrivalObj.arrivalTime + ' at ' + arrivalObj.stationName + ' station');
      this.emit(":responseReady");
    })
    .catch((error) => {
      console.log('App.getNextArrivalTime : error = ' + error);
    });

    //callback(null, response);

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
  },



  'AMAZON.HelpIntent': function () {
    speechOutput = "";
    reprompt = "";
    this.response.speak(speechOutput).listen(reprompt);
    this.emit(':responseReady');
  },
  'AMAZON.CancelIntent': function () {
    speechOutput = "";
    this.response.speak(speechOutput);
    this.emit(':responseReady');
  },
  'AMAZON.StopIntent': function () {
    speechOutput = "";
    this.response.speak(speechOutput);
    this.emit(':responseReady');
  },
  'SessionEndedRequest': function () {
    var speechOutput = "";
    this.response.speak(speechOutput);
    this.emit(':responseReady');
  },
}

function delegateSlotCollection() {
  console.log("in delegateSlotCollection");
  console.log("!! current direction: " + $event.request.intent.slots.direction.value);
  console.log("current dialogState: " + $event.request.dialogState);
  if ($event.request.dialogState === "STARTED") {
    console.log("in Beginning");
    var updatedIntent = $event.request.intent;
    //optionally pre-fill slots: update the intent object with slot values for which
    //you have defaults, then return Dialog.Delegate with this updated intent
    // in the updatedIntent property
    $alexa.emit(":delegate", updatedIntent);
  } else if ($event.request.dialogState !== "COMPLETED") {
    console.log("in not completed");
    // return a Dialog.Delegate directive with no updatedIntent property.
    $alexa.emit(":delegate");
  } else {
    console.log("in completed");
    console.log("returning: " + JSON.stringify($event.request.intent));
    // Dialog is now complete and all required slots should be filled,
    // so call your normal intent handler.
    return $event.request.intent;
  }
}