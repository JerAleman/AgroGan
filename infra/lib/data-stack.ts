import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

interface DataStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class DataStack extends cdk.Stack {
  public readonly cluster: rds.DatabaseCluster;
  public readonly dbSecret: secretsmanager.ISecret;
  public readonly syncTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSg', {
      vpc: props.vpc,
      description: 'Aurora PostgreSQL',
    });

    this.cluster = new rds.DatabaseCluster(this, 'Aurora', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_4,
      }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 8,
      writer: rds.ClusterInstance.serverlessV2('writer'),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      defaultDatabaseName: 'agro360',
      storageEncrypted: true,
      backup: { retention: cdk.Duration.days(14) },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.dbSecret = this.cluster.secret!;

    // DynamoDB para sync offline, IoT y notificaciones
    this.syncTable = new dynamodb.Table(this, 'SyncTable', {
      tableName: 'agro360-sync',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new cdk.CfnOutput(this, 'AuroraEndpoint', { value: this.cluster.clusterEndpoint.hostname });
    new cdk.CfnOutput(this, 'AuroraSecretArn', { value: this.dbSecret.secretArn });
  }
}
