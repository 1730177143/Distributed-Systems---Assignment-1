import {APIGatewayProxyHandlerV2} from "aws-lambda";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, UpdateCommand, QueryCommand} from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();
ajv.addFormat("date", {
    validate: (dateStr) => {
        return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    }
});
const isValidBodyParams = ajv.compile(schema.definitions["MovieReviewUpdate"] || {});

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log("Event: ", event);
        const parameters = event?.pathParameters;
        const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
        const reviewerName = parameters?.parameter;
        const body = event.body ? JSON.parse(event.body) : undefined;


        if (!body || !body.Content) {
            return {
                statusCode: 400,
                body: JSON.stringify({message: "Missing or invalid request body"}),
            };
        }

        if (!isValidBodyParams(body)) {
            return {
                statusCode: 400,
                body: JSON.stringify({message: "Request body does not match MovieReviewUpdate schema"}),
            };
        }
        const queryCommand = new QueryCommand({
            TableName: process.env.TABLE_NAME,
            IndexName: 'ReviewerNameIndex',
            KeyConditionExpression: 'ReviewerName = :reviewerName and MovieId = :movieId',
            ExpressionAttributeValues: {
                ':reviewerName': reviewerName,
                ':movieId': movieId
            }
        });

        const queryResult = await ddbDocClient.send(queryCommand);
        if (queryResult.Items.length === 0) {
            return 'Review not found.';
        }
        const reviewDate = queryResult.Items[0].ReviewDate;

        await ddbDocClient.send(new UpdateCommand({
            TableName: process.env.TABLE_NAME,
            Key: {
                MovieId: movieId,
                ReviewDate: reviewDate,
                // ReviewerName: reviewerName,
            },
            UpdateExpression: "SET Content = :c, Rating = :r",
            ExpressionAttributeValues: {
                ":c": body.Content,
                ":r": body.Rating
            }
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({message: "Review updated successfully"}),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({error: "Failed to update review"}),
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
