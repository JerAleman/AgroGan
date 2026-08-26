# Deploy a AWS — Guía paso a paso

## Prerequisitos

1. **Cuenta AWS** (idealmente bajo una Organization con cuentas separadas dev/prod)
2. **AWS CLI** instalado y configurado (`aws configure`)
3. **Node.js 22+**
4. **Docker** instalado (para build de la imagen del backend)
5. **CDK bootstrapped** en tu cuenta:
   ```bash
   npm install -g aws-cdk
   cdk bootstrap aws://TU_ACCOUNT_ID/us-east-1
   ```

## Secrets en GitHub (para CI/CD)

Configurá estos secrets en tu repo (`Settings > Secrets and variables > Actions`):

| Secret | Valor |
|--------|-------|
| `AWS_DEPLOY_ROLE_ARN` | ARN del IAM Role que GitHub Actions asume (OIDC) |

### Crear el IAM Role para GitHub Actions (OIDC)
```bash
# 1. Crear el identity provider de GitHub en IAM
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com

# 2. Crear role con trust policy para tu repo
# (usá la policy de ejemplo en infra/github-oidc-trust.json)
```

## Deploy manual (primera vez)

```bash
# 1. Compilar infra
cd infra
npm install
npm run build

# 2. Revisar lo que se va a crear
npx cdk diff

# 3. Desplegar todo
npx cdk deploy --all

# Outputs:
# - Agro360-Auth.UserPoolId = us-east-1_XXXXX
# - Agro360-Auth.UserPoolClientId = XXXXX
# - Agro360-Compute.AlbDns = agro360-XXXX.us-east-1.elb.amazonaws.com
# - Agro360-Frontend.CloudFrontUrl = https://dXXX.cloudfront.net
# - Agro360-Data.AuroraEndpoint = agro360-XXXX.cluster-XXXX.us-east-1.rds.amazonaws.com
```

## Post-deploy (una vez)

### 4. Migrar la base de datos
```bash
cd backend
# Setear DATABASE_URL con el endpoint de Aurora (está en Secrets Manager)
DATABASE_URL="postgresql://postgres:PASSWORD@AURORA_ENDPOINT:5432/agro360" \
  npx prisma migrate deploy

# Aplicar Row Level Security
psql "$DATABASE_URL" -f prisma/postgres-rls.sql
```

### 5. Habilitar Bedrock
- Ir a la consola de Amazon Bedrock > Model access
- Habilitar: `anthropic.claude-3-5-sonnet` (o el modelo que elijas)

### 6. DNS (opcional pero recomendado)
- Crear un hosted zone en Route 53 para tu dominio (ej. `agro360.cloud`)
- Crear un record CNAME/alias apuntando al ALB (API) y al CloudFront (frontend)
- Crear un certificado en ACM (us-east-1) y adjuntarlo al CloudFront/ALB

## Arquitectura desplegada

```
Internet → CloudFront (frontend) → S3
         → ALB → ECS Fargate (backend NestJS, 2-10 tasks autoscaled)
                   → Aurora PostgreSQL Serverless v2 (RLS)
                   → DynamoDB (sync/IoT)
                   → Amazon Bedrock (Copiloto AI)
                   → EventBridge → SQS (alertas, IoT)
         → Cognito (auth, MFA, tenant claims)
```

## Costos estimados (MVP, 20-50 tenants)

| Servicio | Rango mensual |
|----------|---------------|
| Aurora Serverless v2 | $150–500 |
| ECS Fargate (2-4 tasks) | $100–300 |
| CloudFront + S3 + WAF | $50–150 |
| Cognito | $0–50 |
| Bedrock (IA) | $100–600 |
| DynamoDB, EventBridge, SQS, SNS | $30–100 |
| CloudWatch, Secrets, KMS | $30–100 |
| **Total** | **$500–1.800/mes** |

## CI/CD automático

Cada push a `main` ejecuta:
1. Tests (unit + e2e)
2. `cdk deploy --all` (infra + backend image → ECR → ECS rolling update)
3. Frontend build y sync a S3 + invalidación de CloudFront

## Rollback
```bash
# Rollback de ECS (vuelve al task definition anterior)
aws ecs update-service --cluster agro360 --service api --task-definition TASK_DEF_ANTERIOR

# Rollback de infra
cdk deploy --all --context rollback=true  # o revertir el commit y re-deploy
```

## Checklist pre-producción

- [ ] Dominio configurado con HTTPS
- [ ] MFA habilitado para roles admin
- [ ] Backups de Aurora verificados (PITR 14 días)
- [ ] Alarmas de presupuesto configuradas ($2000/mes)
- [ ] WAF rules activas (OWASP Top 10)
- [ ] Bedrock model access habilitado
- [ ] Prueba de aislamiento de tenants ejecutada contra Aurora real
- [ ] Secretos rotados (DB password, JWT en Cognito)
- [ ] Rate limiting configurado en ALB/WAF
