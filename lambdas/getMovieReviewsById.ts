import {APIGatewayProxyHandlerV2} from "aws-lambda";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, QueryCommand} from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log("Event: ", event);
        const movieId = event.pathParameters?.movieId;
        const minRating = event.queryStringParameters?.minRating;
        const parameter = event.pathParameters?.parameter;

        if (!movieId) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({message: "Missing or invalid movieId"}),
            };
        }

        let queryInput = {
            TableName: process.env.TABLE_NAME,
            KeyConditionExpression: "MovieId = :movieId",
            ExpressionAttributeValues: {
                ":movieId": parseInt(movieId),
            },
        };

        if (minRating) {
            queryInput.FilterExpression = "Rating > :minRating";
            queryInput.ExpressionAttributeValues[":minRating"] = parseInt(minRating);
        }

        if (parameter) {
            if (/^\d{4}$/.test(parameter)) {
                const startDate = `${parameter}-01-01`;
                const endDate = `${parameter}-12-31`;
                queryInput.KeyConditionExpression += " and ReviewDate BETWEEN :start and :end";
                queryInput.ExpressionAttributeValues[":start"] = startDate;
                queryInput.ExpressionAttributeValues[":end"] = endDate;
            } else {
                queryInput.IndexName = "ReviewerNameIndex";
                queryInput.KeyConditionExpression = "ReviewerName = :reviewerName and MovieId = :movieId";
                queryInput.ExpressionAttributeValues[":reviewerName"] = parameter;
            }
        }

        const commandOutput = await ddbDocClient.send(new QueryCommand(queryInput));


        if (!commandOutput.Items || commandOutput.Items.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({message: "No reviews found for the given movieId"}),
            };
        }

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({reviews: commandOutput.Items}),
        };
    } catch (error: any) {
        console.error("Error: ", JSON.stringify(error));
        return {
            statusCode: 500,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({error: error.message}),
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
