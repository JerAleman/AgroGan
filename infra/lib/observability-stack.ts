import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as budgets from 'aws-cdk-lib/aws-budgets';

interface ObservabilityStackProps extends cdk.StackProps {
  alertEmail: string;
}

export class ObservabilityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
    super(scope, id, props);

    // Dashboard operativo
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: 'agro360-ops',
    });

    dashboard.addWidgets(
      new cloudwatch.TextWidget({ markdown: '# Agro360 Cloud — Operaciones', width: 24 }),
    );

    // Alarma de costos mensuales
    new budgets.CfnBudget(this, 'MonthlyBudget', {
      budget: {
        budgetName: 'agro360-monthly',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: { amount: 2000, unit: 'USD' },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            comparisonOperator: 'GREATER_THAN',
            notificationType: 'ACTUAL',
            threshold: 80,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [{ subscriptionType: 'EMAIL', address: props.alertEmail }],
        },
      ],
    });
  }
}
