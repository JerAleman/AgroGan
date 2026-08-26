#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { AuthStack } from '../lib/auth-stack';
import { DataStack } from '../lib/data-stack';
import { ComputeStack } from '../lib/compute-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { EventsStack } from '../lib/events-stack';
import { ObservabilityStack } from '../lib/observability-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const alertEmail = app.node.tryGetContext('alertEmail') ?? 'ops@agro360.cloud';

const network = new NetworkStack(app, 'Agro360-Network', { env });
const auth = new AuthStack(app, 'Agro360-Auth', { env });
const data = new DataStack(app, 'Agro360-Data', { env, vpc: network.vpc });
const events = new EventsStack(app, 'Agro360-Events', { env });

const compute = new ComputeStack(app, 'Agro360-Compute', {
  env,
  vpc: network.vpc,
  dbCluster: data.cluster,
  dbSecret: data.dbSecret,
  cognitoUserPoolId: auth.userPool.userPoolId,
  cognitoClientId: auth.userPoolClient.userPoolClientId,
});

new FrontendStack(app, 'Agro360-Frontend', { env });
new ObservabilityStack(app, 'Agro360-Observability', { env, alertEmail });

app.synth();
