const request = require('request');
const _=require('lodash');

const AWS = require('aws-sdk');  
const dynamo = new AWS.DynamoDB.DocumentClient();