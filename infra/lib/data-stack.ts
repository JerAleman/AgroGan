import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

interface DataStackProps extends cdk.StackProps {
  stage: string;
}

/**
 * Capa de datos: Aurora PostgreSQL Serverless v2 (transaccional, con RLS
 * habilitada por migración) + DynamoDB (cola de sync offline / notificaciones).
 * Esqueleto: valores de escala/seguridad se refinan por entorno.
 */
export class DataStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 2, natGateways: props.stage === 'prod' ? 2 : 1 });

    const cluster = new rds.DatabaseCluster(this, 'Aurora', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_4,
      }),
      serverlessV2MinCapacity: props.stage === 'prod' ? 2 : 0.5,
      serverlessV2MaxCapacity: props.stage === 'prod' ? 16 : 4,
      writer: rds.ClusterInstance.serverlessV2('writer'),
      readers: props.stage === 'prod' ? [rds.ClusterInstance.serverlessV2('reader')] : [],
      vpc,
      storageEncrypted: true,
      backup: { retention: cdk.Duration.days(props.stage === 'prod' ? 14 : 7) },
      removalPolicy: props.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Cola de sync offline / notificaciones / IoT liviano.
    new dynamodb.Table(this, 'SyncTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING }, // tenantId#entity
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    new cdk.CfnOutput(this, 'AuroraEndpoint', { value: cluster.clusterEndpoint.hostname });
  }
}
