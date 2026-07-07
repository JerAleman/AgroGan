import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as path from 'path';

interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  dbCluster: rds.DatabaseCluster;
  dbSecret: secretsmanager.ISecret;
  cognitoUserPoolId: string;
  cognitoClientId: string;
}

export class ComputeStack extends cdk.Stack {
  public readonly albDns: string;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      containerInsights: true,
    });

    const image = new ecr_assets.DockerImageAsset(this, 'BackendImage', {
      directory: path.join(__dirname, '../../backend'),
    });

    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
    });

    props.dbSecret.grantRead(taskDef.taskRole);

    const container = taskDef.addContainer('api', {
      image: ecs.ContainerImage.fromDockerImageAsset(image),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'agro360-api',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        AUTH_MODE: 'cognito',
        COGNITO_USER_POOL_ID: props.cognitoUserPoolId,
        COGNITO_CLIENT_ID: props.cognitoClientId,
        AI_MODE: 'bedrock',
        AWS_REGION: cdk.Stack.of(this).region,
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(props.dbSecret, 'connectionString'),
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/v1/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        retries: 3,
      },
    });
    container.addPortMappings({ containerPort: 3000 });

    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 2,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Permitir conexión del servicio a Aurora
    service.connections.allowTo(props.dbCluster, ec2.Port.tcp(5432));

    // ALB público
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
    });

    const listener = alb.addListener('Http', { port: 80 });
    listener.addTargets('ApiTarget', {
      port: 3000,
      targets: [service],
      healthCheck: { path: '/v1/health', interval: cdk.Duration.seconds(30) },
    });

    // Auto-scaling
    const scaling = service.autoScaleTaskCount({ minCapacity: 2, maxCapacity: 10 });
    scaling.scaleOnCpuUtilization('CpuScale', { targetUtilizationPercent: 70 });

    this.albDns = alb.loadBalancerDnsName;
    new cdk.CfnOutput(this, 'AlbDns', { value: alb.loadBalancerDnsName });
  }
}
