import {Construct} from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as node from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import {generateBatch} from "../shared/util";
import {movies, movieCasts, movieReviews} from "../seed/movies";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as iam from 'aws-cdk-lib/aws-iam';

type AppApiProps = {
    userPoolId: string;
    userPoolClientId: string;
};

export class AppApi extends Construct {
    constructor(scope: Construct, id: string, props: AppApiProps) {
        super(scope, id);

        // Tables
        const moviesTable = new dynamodb.Table(this, "MoviesTable", {
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            partitionKey: {name: "id", type: dynamodb.AttributeType.NUMBER},
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            tableName: "Movies",
        });
        const movieCastsTable = new dynamodb.Table(this, "MovieCastTable", {
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            partitionKey: {name: "movieId", type: dynamodb.AttributeType.NUMBER},
            sortKey: {name: "actorName", type: dynamodb.AttributeType.STRING},
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            tableName: "MovieCast",
        });

        movieCastsTable.addLocalSecondaryIndex({
            indexName: "roleIx",
            sortKey: {name: "roleName", type: dynamodb.AttributeType.STRING},
        });
        const movieReviewsTable = new dynamodb.Table(this, 'MovieReviewsTable', {
            partitionKey: {name: 'MovieId', type: dynamodb.AttributeType.NUMBER},
            sortKey: {name: 'ReviewDate', type: dynamodb.AttributeType.STRING},
            tableName: 'MovieReviews',
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        movieReviewsTable.addGlobalSecondaryIndex({
            indexName: 'ReviewerNameIndex',
            partitionKey: {name: 'ReviewerName', type: dynamodb.AttributeType.STRING},
            sortKey: {name: 'MovieId', type: dynamodb.AttributeType.NUMBER},
            projectionType: dynamodb.ProjectionType.ALL,
        });

        const appApi = new apig.RestApi(this, "AppApi", {
            description: "App RestApi",
            endpointTypes: [apig.EndpointType.REGIONAL],
            defaultCorsPreflightOptions: {
                allowOrigins: apig.Cors.ALL_ORIGINS,
            },
            deployOptions: {
                stageName: "dev",
            },
        });

        const appCommonFnProps = {
            architecture: lambda.Architecture.ARM_64,
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: "handler",
            environment: {
                USER_POOL_ID: props.userPoolId,
                CLIENT_ID: props.userPoolClientId,
                REGION: cdk.Aws.REGION,
            },
        };
        // Functions
        const getTranslatedReviewFn = new lambdanode.NodejsFunction(
            this,
            "GetTranslatedReviewFn",
            {
                ...appCommonFnProps,
                entry: `${__dirname}/../lambdas/getTranslatedReview.ts`,
                environment: {
                    ...appCommonFnProps.environment,
                    TABLE_NAME: movieReviewsTable.tableName
                },
            }
        );

        const getMovieReviewsByNameFn = new lambdanode.NodejsFunction(
            this,
            "GetMovieReviewsByNameFn",
            {
                ...appCommonFnProps,
                entry: `${__dirname}/../lambdas/getMovieReviewsByName.ts`,
                environment: {
                    ...appCommonFnProps.environment,
                    TABLE_NAME: movieReviewsTable.tableName
                },
            }
        );

        const getMovieReviewsByIdFn = new lambdanode.NodejsFunction(
            this,
            "GetMovieReviewsByIdFn",
            {
                ...appCommonFnProps,
                entry: `${__dirname}/../lambdas/getMovieReviewsById.ts`,
                environment: {
                    ...appCommonFnProps.environment,
                    TABLE_NAME: movieReviewsTable.tableName,
                },
            }
        );

        const getMovieByIdFn = new lambdanode.NodejsFunction(
            this,
            "GetMovieByIdFn",
            {
                ...appCommonFnProps,
                entry: `${__dirname}/../lambdas/getMovieById.ts`,
                environment: {
                    ...appCommonFnProps.environment,
                    TABLE_NAME: moviesTable.tableName,
                    MOVIE_CAST_TABLE: movieCastsTable.tableName,
                },
            }
        );
        const addMovieReviewFn = new lambdanode.NodejsFunction(this, "AddMovieReviewFn", {
            ...appCommonFnProps,
            entry: `${__dirname}/../lambdas/addMovieReview.ts`,
            environment: {
                ...appCommonFnProps.environment,
                TABLE_NAME: movieReviewsTable.tableName,
            },
        });
        const updateReviewFn = new lambdanode.NodejsFunction(this, "UpdateReviewFn", {
            ...appCommonFnProps,
            entry: `${__dirname}/../lambdas/updateReview.ts`,
            environment: {
                ...appCommonFnProps.environment,
                TABLE_NAME: movieReviewsTable.tableName,
            },
        });
        const getAllMoviesFn = new lambdanode.NodejsFunction(
            this,
            "GetAllMoviesFn",
            {
                ...appCommonFnProps,
                entry: `${__dirname}/../lambdas/getAllMovies.ts`,
                environment: {
                    ...appCommonFnProps.environment,
                    TABLE_NAME: moviesTable.tableName,
                },
            }
        );
        const newMovieFn = new lambdanode.NodejsFunction(this, "AddMovieFn", {
            ...appCommonFnProps,
            entry: `${__dirname}/../lambdas/addMovie.ts`,
            environment: {
                ...appCommonFnProps.environment,
                TABLE_NAME: moviesTable.tableName,
            },
        });

        const deleteMovieFn = new lambdanode.NodejsFunction(this, "DeleteMovieFn", {
            ...appCommonFnProps,
            entry: `${__dirname}/../lambdas/deleteMovie.ts`,
            environment: {
                ...appCommonFnProps.environment,
                TABLE_NAME: moviesTable.tableName,
            },
        });
        const getMovieCastMembersFn = new lambdanode.NodejsFunction(
            this,
            "GetCastMemberFn",
            {
                ...appCommonFnProps,
                entry: `${__dirname}/../lambdas/getMovieCastMember.ts`,
                environment: {
                    ...appCommonFnProps.environment,
                    TABLE_NAME: movieCastsTable.tableName,
                },
            }
        );
        new custom.AwsCustomResource(this, "moviesddbInitData", {
            onCreate: {
                service: "DynamoDB",
                action: "batchWriteItem",
                parameters: {
                    RequestItems: {
                        [moviesTable.tableName]: generateBatch(movies),
                        [movieCastsTable.tableName]: generateBatch(movieCasts),
                        [movieReviewsTable.tableName]: generateBatch(movieReviews)
                    },
                },
                physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"), //.of(Date.now().toString()),
            },
            policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
                resources: [moviesTable.tableArn, movieCastsTable.tableArn, movieReviewsTable.tableArn],
            }),
        });

        // Permissions
        moviesTable.grantReadData(getMovieByIdFn)
        moviesTable.grantReadData(getAllMoviesFn)
        moviesTable.grantReadWriteData(newMovieFn)
        moviesTable.grantReadWriteData(deleteMovieFn)
        movieCastsTable.grantReadData(getMovieCastMembersFn);
        movieCastsTable.grantReadData(getMovieByIdFn);
        movieReviewsTable.grantReadData(getMovieReviewsByIdFn);
        movieReviewsTable.grantReadWriteData(addMovieReviewFn);
        movieReviewsTable.grantReadWriteData(updateReviewFn);
        movieReviewsTable.grantReadData(getMovieReviewsByNameFn);
        movieReviewsTable.grantReadData(getTranslatedReviewFn);

        const translatePolicy = new iam.PolicyStatement({
            actions: ["translate:TranslateText"],
            resources: ["*"],
        });

        getTranslatedReviewFn.addToRolePolicy(translatePolicy);
        // Rest api

        const authorizerFn = new node.NodejsFunction(this, "AuthorizerFn", {
            ...appCommonFnProps,
            entry: "./lambdas/auth/authorizer.ts",
        });

        const requestAuthorizer = new apig.RequestAuthorizer(
            this,
            "RequestAuthorizer",
            {
                identitySources: [apig.IdentitySource.header("cookie")],
                handler: authorizerFn,
                resultsCacheTtl: cdk.Duration.minutes(0),
            }
        );

        const moviesEndpoint = appApi.root.addResource("movies");
        moviesEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getAllMoviesFn, {proxy: true})
        );

        const movieEndpoint = moviesEndpoint.addResource("{movieId}");
        movieEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getMovieByIdFn, {proxy: true})
        );

        moviesEndpoint.addMethod(
            "POST",
            new apig.LambdaIntegration(newMovieFn, {proxy: true})
        );
        movieEndpoint.addMethod(
            "DELETE",
            new apig.LambdaIntegration(deleteMovieFn, {proxy: true})
        );
        const movieCastEndpoint = moviesEndpoint.addResource("cast");
        movieCastEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getMovieCastMembersFn, {proxy: true})
        );
        const movieReviewsEndpoint = movieEndpoint.addResource("reviews");
        movieReviewsEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getMovieReviewsByIdFn, {proxy: true})
        );
        const parameterEndpoint = movieReviewsEndpoint.addResource("{parameter}");
        parameterEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getMovieReviewsByIdFn, {proxy: true})
        )
        parameterEndpoint.addMethod(
            "PUT",
            new apig.LambdaIntegration(updateReviewFn, {proxy: true}), {
                authorizer: requestAuthorizer,
                authorizationType: apig.AuthorizationType.CUSTOM,
            }
        );
        const reviewEndpoint = moviesEndpoint.addResource("reviews");
        reviewEndpoint.addMethod(
            "POST",
            new apig.LambdaIntegration(addMovieReviewFn, {proxy: true}), {
                authorizer: requestAuthorizer,
                authorizationType: apig.AuthorizationType.CUSTOM,
            }
        );
        const reviewsEndpoint = appApi.root.addResource("reviews");
        const reviewerNameEndpoint = reviewsEndpoint.addResource("{reviewerName}");
        reviewerNameEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getMovieReviewsByNameFn, {proxy: true})
        );
        const movieIdEndpoint = reviewerNameEndpoint.addResource("{movieId}");
        const translationEndpoint = movieIdEndpoint.addResource("translation");
        translationEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getTranslatedReviewFn, {proxy: true})
        );
    }
}