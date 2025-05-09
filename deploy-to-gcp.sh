#!/bin/bash

# Exit on any error
set -e

# Set variables
PROJECT_ID="YOUR_GCP_PROJECT_ID"  # Replace with your actual GCP project ID
REGION="us-central1"              # Replace with your preferred region
CLUSTER_NAME="calculator-cluster"
IMAGE_NAME="calculator-app"
IMAGE_TAG="latest"

# Log in to GCP
echo "Logging in to Google Cloud..."
gcloud auth login

# Set the project
gcloud config set project $PROJECT_ID

# Enable necessary APIs
echo "Enabling necessary APIs..."
gcloud services enable container.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com

# Create a GKE cluster if it doesn't exist
echo "Creating GKE cluster if it doesn't exist..."
if ! gcloud container clusters describe $CLUSTER_NAME --region=$REGION &> /dev/null; then
  gcloud container clusters create $CLUSTER_NAME \
    --region=$REGION \
    --num-nodes=2 \
    --machine-type=e2-medium \
    --enable-stackdriver-kubernetes \
    --enable-autoscaling \
    --min-nodes=1 \
    --max-nodes=3
else
  echo "Cluster $CLUSTER_NAME already exists."
fi

# Get credentials for kubectl
echo "Getting cluster credentials..."
gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION

# Build and push the Docker image
echo "Building and pushing Docker image..."
docker build -t $IMAGE_NAME:$IMAGE_TAG .
docker tag $IMAGE_NAME:$IMAGE_TAG gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG
gcloud auth configure-docker
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG

# Update image in deployment files
echo "Updating deployment files..."
sed -i "s|gcr.io/PROJECT_ID/calculator-app:latest|gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG|g" k8s/deployment.yaml
sed -i "s|PROJECT_ID|$PROJECT_ID|g" k8s/alert-policy.yaml

# Apply Kubernetes configurations
echo "Applying Kubernetes configurations..."
kubectl apply -f k8s/mongodb-secret.yaml
kubectl apply -f k8s/mongodb-pv.yaml
kubectl apply -f k8s/mongodb-pvc.yaml
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/mongodb-service.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/stackdriver-monitoring.yaml
kubectl apply -f k8s/dashboard.yaml
kubectl apply -f k8s/alert-policy.yaml

# Wait for deployment to complete
echo "Waiting for deployment to complete..."
kubectl rollout status deployment/node-web-app

# Get service URL
echo "Getting service URL..."
NODE_PORT=$(kubectl get service node-web-service -o jsonpath='{.spec.ports[0].nodePort}')
EXTERNAL_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}')

if [ -z "$EXTERNAL_IP" ]; then
  echo "No external IP found. Trying to get the external IP from GCP..."
  EXTERNAL_IP=$(gcloud compute instances list --filter="name~gke-$CLUSTER_NAME" --format="value(EXTERNAL_IP)" | head -n 1)
fi

if [ -n "$EXTERNAL_IP" ] && [ -n "$NODE_PORT" ]; then
  echo "Your application is available at: http://$EXTERNAL_IP:$NODE_PORT"
else
  echo "Could not determine the external URL. Check your GCP Console for details."
fi

echo "Deployment completed successfully!" 