'use strict';


const NOTIFY_MISSING_PERMISSIONS = "Please enable Location permissions in the Amazon Alexa app.";

const NO_ADDRESS = "It looks like you don't have an address set. You can set your address in the Alexa app.";

const LOCATION_FAILURE = "There was an error with the Device Address API. Please try again.";

module.exports = {
    "NOTIFY_MISSING_PERMISSIONS": NOTIFY_MISSING_PERMISSIONS,
    "NO_ADDRESS": NO_ADDRESS,
    "LOCATION_FAILURE": LOCATION_FAILURE
};