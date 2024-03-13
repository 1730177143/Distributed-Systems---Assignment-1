import {APIGatewayProxyHandlerV2} from "aws-lambda";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, QueryCommand} from "@aws-sdk/lib-dynamodb";
import * as AWS from 'aws-sdk';
import {Translate} from "aws-sdk";

const ddbDocClient = createDDbDocClient();
const translate = new AWS.Translate();
export const handler: APIGatewayProxyHandlerV2 = async (event) => {

    const reviewerName = event.pathParameters?.reviewerName;
    const movieId = event.pathParameters?.movieId;
    const languageCode = event.queryStringParameters?.language;

    if (!reviewerName || !movieId || !languageCode) {
        return {
            statusCode: 400,
            body: JSON.stringify({message: "Missing parameters"}),
        };
    }

    let queryInput = {
        TableName: process.env.TABLE_NAME,
        IndexName: 'ReviewerNameIndex',
        KeyConditionExpression: 'ReviewerName = :reviewerName and MovieId = :movieId',
        ExpressionAttributeValues: {
            ":reviewerName": reviewerName,
            ":movieId": parseInt(movieId),
        },
    };


    const commandOutput = await ddbDocClient.send(new QueryCommand(queryInput));


    if (!commandOutput.Items || commandOutput.Items.length === 0) {
        return {
            statusCode: 404,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({message: "No reviews found for the given reviewerName"}),
        };
    }

    const text = commandOutput.Items[0].Content
    const translateParams: Translate.Types.TranslateTextRequest = {
        SourceLanguageCode: 'en',
        TargetLanguageCode: languageCode,
        Text: text
    };
    try {
        const translatedMessage = await translate.translateText(translateParams).promise();
        return {
            statusCode: 200,
            headers: {"content-type": "application/json"},
            body: JSON.stringify({translatedMessage}),
        };
    } catch (error) {
        console.error("Error: ", error);
        return {
            statusCode: 500,
            body: JSON.stringify({error: "Failed to translate review"}),
        };
    }
};

function createDDbDocClient() {
    const ddbClient = new DynamoDBClient({region: process.env.REGION});
    const marshallOptions = {
        convertEmptyValues: true,
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
        wrapNumbers: false,
    };
    const translateConfig = {marshallOptions, unmarshallOptions};
    return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
