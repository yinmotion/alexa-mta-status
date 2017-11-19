'use strict';

const App = require('./app');

const Alexa = require('alexa-sdk');

const welcomeOutput = "I have the real time MTA status";
const welcomeReprompt = "Which train and what direction do you want to check";

var $event = null;
var $alexa = null;
var $context = null;


module.exports.myFunction = (event, context, callback) => {

  var alexa = Alexa.handler(event, context);

  $event = event;
  $alexa = alexa;
  $context = context;

  alexa.registerHandlers(handlers);
  alexa.execute();
};

const handlers = {
  'LaunchRequest': function () {
    this.response.speak(welcomeOutput).listen(welcomeReprompt);
    this.emit(':responseReady');
  },

  'CheckMTAStatus': function () {
    //delegateSlotCollection();

    console.log("CheckMTAStatus : direction = " + $event.request.intent.slots.direction.value);
    console.log("CheckMTAStatus : dialogState = " + $event.request.dialogState);

    let line = $event.request.intent.slots.subwaylineName.value;
    let dir = $event.request.intent.slots.direction.value;
    let deviceId = $context.System.device.deviceId;
    
    let line_dir = {'line' : line, 'direction' : dir, 'deviceId' : deviceId};

    let arrivalObj = App.getNextArrivalTime(line_dir);
    
    this.response.speak(`The next ` + $event.request.intent.slots.direction.value + ' ' + $event.request.intent.slots.subwaylineName.value + ' will arrive in ' + arrivalObj.arrivalTime + ' at ' + arrivalObj.stationName + ' station');
    this.emit(":responseReady");

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