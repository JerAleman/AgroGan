#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataStack } from '../lib/data-stack';

const app = new cdk.App();
const env = app.node.tryGetContext('env') ?? 'dev';

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION ?? 'us-east-1';
const envConfig = { account, region };
const prefix = `Agro360-${env}`;

// Se agregan progresivamente: NetworkStack, AuthStack, ComputeStack,
// FrontendStack, AiStack, EventsStack, ObservabilityStack.
new DataStack(app, `${prefix}-Data`, { env: envConfig, stage: env });

app.synth();
