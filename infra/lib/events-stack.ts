import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class EventsStack extends cdk.Stack {
  public readonly bus: events.EventBus;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.bus = new events.EventBus(this, 'Agro360Bus', {
      eventBusName: 'agro360-events',
    });

    // Cola DLQ para eventos fallidos
    const dlq = new sqs.Queue(this, 'DLQ', {
      queueName: 'agro360-dlq',
      retentionPeriod: cdk.Duration.days(14),
    });

    // Cola de alertas
    const alertsQueue = new sqs.Queue(this, 'AlertsQueue', {
      queueName: 'agro360-alerts',
      deadLetterQueue: { queue: dlq, maxReceiveCount: 3 },
      visibilityTimeout: cdk.Duration.seconds(60),
    });

    // Cola de sync/IoT
    const iotQueue = new sqs.Queue(this, 'IoTQueue', {
      queueName: 'agro360-iot-ingest',
      deadLetterQueue: { queue: dlq, maxReceiveCount: 3 },
    });

    // SNS para notificaciones email
    const notifTopic = new sns.Topic(this, 'NotifTopic', {
      topicName: 'agro360-notifications',
    });

    new cdk.CfnOutput(this, 'EventBusArn', { value: this.bus.eventBusArn });
    new cdk.CfnOutput(this, 'AlertsQueueUrl', { value: alertsQueue.queueUrl });
    new cdk.CfnOutput(this, 'IoTQueueUrl', { value: iotQueue.queueUrl });
  }
}
