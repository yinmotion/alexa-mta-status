# alexa-mta-status

An Alexa Skill that provides real-time MTA subway schedule status retrieved from MTA Realtime API.
- Skill Name: MTA  
- Example utterance: 
- * User: "Alex, ask MTA, when is the next downtown 5 train?" 
- * Alexa: "The next downtown 5 train will arrive in 6 mins at 14 street Union Square station"

## Alexa Skill
Create the Alexa Skill in Amazon Developer Console.
- Configure skill name and invocation phrase in Skill Information 
- Set intents and slot types in Interaction Model Builder
- Select AWS Lambda ARN as the service endpoint in Configuration  

## Serverless Framework
The project uses Serverless Framework for developing and deploying AWS Lambda functions. The framework provides scaffolding, workflow automation and best practices for developing serverless architecture.  

- [Serverless Github](https://github.com/serverless/serverless)

- [Serverless Node Alexa Skill example](https://github.com/serverless/examples/tree/master/aws-node-alexa-skill)

- [Serverless AWS Doc](https://serverless.com/framework/docs/providers/aws/)

#### serverless.yml 
Configure settings and properties for AWS services, including user profile, Lambda functions, and resources(DynamoDB, S3, etc.)

## AWS Lambda
Serverless Framework deploys functions listed in serverless.yml to AWS Lambda using CloudFormation.

NOTE: After the function deployed for the first time, login to AWS Console, and add Alexa Skill Kit trigger to the function in AWS Lambda > Functions > functionName > Triggers.

## AWS DynamoDB
The skill uses AWS DynamoDB to store list of subway stations close to the Echo device's address, the device's unique id is the hash key for the table. Properties of the DB are specified under resources in the serverless.yml.

## Serverless DynamoDB Local
In local dev environment, serverless-dynamodb-local plugin is used to store user stations list.

[Serverless DynamoDB Local plug-in](https://www.npmjs.com/package/serverless-dynamodb-local)

- Install DynamoDB Local
```javascript
sls dynamodb install
```

- Start DynamoDB Local
```javascript
sls dynamodb start
```

## Deploy 
The Serverless Framework translates syntax in serverless.yml to a AWS CloudFormation template, the functions are packaged into zip files and deployed to AWS via CloudFormation.

[Serverless AWS Deploying Reference](https://serverless.com/framework/docs/providers/aws/guide/deploying/)

- Deploy All

```javascript
sls deploy
```
- Deploy a Function

```javascript
sls deploy function --function functionName
```

## External APIs
- #### MTA Realtime API

- #### Google Maps Distance Matrix API

