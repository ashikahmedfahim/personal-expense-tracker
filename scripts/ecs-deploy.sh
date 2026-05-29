#!/usr/bin/env bash
# Register a new ECS task definition revision with an updated image and roll out the service.
set -euo pipefail

if [[ $# -ne 4 ]]; then
  echo "Usage: $0 <cluster> <service> <task-family> <image-uri>" >&2
  exit 1
fi

CLUSTER="$1"
SERVICE="$2"
TASK_FAMILY="$3"
IMAGE="$4"
AWS_REGION="${AWS_REGION:-eu-north-1}"

echo "Fetching current task definition: ${TASK_FAMILY}"
TASK_DEF_JSON="$(aws ecs describe-task-definition \
  --task-definition "${TASK_FAMILY}" \
  --region "${AWS_REGION}" \
  --query 'taskDefinition' \
  --output json)"

NEW_TASK_DEF_JSON="$(echo "${TASK_DEF_JSON}" | jq \
  --arg IMAGE "${IMAGE}" \
  '.containerDefinitions[0].image = $IMAGE
   | del(
     .taskDefinitionArn,
     .revision,
     .status,
     .requiresAttributes,
     .compatibilities,
     .registeredAt,
     .registeredBy
   )')"

echo "Registering task definition with image: ${IMAGE}"
NEW_TASK_ARN="$(aws ecs register-task-definition \
  --region "${AWS_REGION}" \
  --cli-input-json "${NEW_TASK_DEF_JSON}" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)"

echo "Updating service ${SERVICE} on cluster ${CLUSTER}"
aws ecs update-service \
  --region "${AWS_REGION}" \
  --cluster "${CLUSTER}" \
  --service "${SERVICE}" \
  --task-definition "${NEW_TASK_ARN}" \
  --force-new-deployment \
  --query 'service.serviceName' \
  --output text

echo "Waiting for service to stabilize..."
aws ecs wait services-stable \
  --region "${AWS_REGION}" \
  --cluster "${CLUSTER}" \
  --services "${SERVICE}"

echo "Deployment complete."
