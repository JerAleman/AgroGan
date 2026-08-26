# Infra — Agro360 Cloud (AWS CDK, TypeScript)

Infraestructura como código con **AWS CDK**. Provisiona la plataforma multi-tenant descrita en [docs/03-architecture.md](../docs/03-architecture.md).

## Estructura

```
infra/
├── bin/
│   └── app.ts                  # entrypoint CDK (envs dev/staging/prod)
├── lib/
│   ├── network-stack.ts        # VPC, subnets, security groups
│   ├── auth-stack.ts           # Cognito User/Identity Pools, MFA
│   ├── data-stack.ts           # Aurora Serverless v2, RLS bootstrap, DynamoDB
│   ├── compute-stack.ts        # ECS Fargate (backend NestJS), ALB
│   ├── frontend-stack.ts       # S3 + CloudFront + WAF (Next.js estático)
│   ├── ai-stack.ts             # Bedrock Knowledge Base, vector store
│   ├── events-stack.ts         # EventBridge, SQS, SNS/SES, Lambda
│   └── observability-stack.ts  # CloudWatch, X-Ray, CloudTrail, alarms/budgets
├── openapi.yaml                # contrato de API (fuente de verdad)
├── cdk.json
└── package.json
```

## Comandos
```bash
npm install
npm run build
npx cdk synth --context env=dev
npx cdk diff  --context env=staging
npx cdk deploy --all --context env=prod   # con aprobación manual en prod
```

## Notas
- **Entornos** separados por cuenta AWS (dev/staging/prod).
- **Multi-tenancy pooled** por defecto; el `data-stack` deja preparado el bootstrap de RLS.
- **Costos**: pgvector en Aurora en MVP (evita OpenSearch Serverless); budgets y cost allocation tags por tenant.
- **CI/CD**: GitHub Actions ejecuta `cdk diff` en PR y `cdk deploy` en merge (con aprobación en prod).
