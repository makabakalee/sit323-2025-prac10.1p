# SIT323 Calculator Microservice - Monitoring and Observability

This is a simple calculator microservice with monitoring and observability features. The application is built using Node.js, Express, and MongoDB, and is deployed on a Kubernetes cluster in Google Cloud Platform (GCP).

## Features

- Basic calculator operations: addition, subtraction, multiplication, division, etc.
- Operation history stored in MongoDB
- GCP Monitoring using Stackdriver Dashboard
- Health check endpoint for Kubernetes probes
- Resource utilization monitoring
- Sample alerts (optional configuration)

## Prerequisites

- [Node.js](https://nodejs.org/en/download/) (version 18 or higher)
- [Docker](https://www.docker.com/get-started)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
- MongoDB (deployed using Docker Compose or Kubernetes)
- Google Cloud Platform account

## Local Execution

1. Install dependencies:

```bash
npm install
```

2. Start MongoDB (using Docker):

```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

3. Run the application:

```bash
node app.js
```

## Deployment to GCP

1. Create a project on GCP and enable billing.

2. Install and configure Google Cloud SDK and kubectl.

3. Edit the `PROJECT_ID` and `REGION` variables in the `deploy-to-gcp.sh` script to match your GCP project settings.

4. Set up the secret for MongoDB. Edit the `k8s/mongodb-secret.yaml` file and set Base64-encoded username and password:

```bash
echo -n 'admin' | base64  # Output: YWRtaW4=
echo -n 'password123' | base64  # Output: cGFzc3dvcmQxMjM=
```

5. Add execute permission to the deployment script:

```bash
chmod +x deploy-to-gcp.sh
```

6. Run the deployment script:

```bash
./deploy-to-gcp.sh
```

The script will:
- Log in to GCP
- Create a GKE cluster in `australia-southeast1`
- Build and push Docker images to Artifact Registry
- Deploy MongoDB and the application
- Configure monitoring and logging
- Return the application URL

## Monitoring and Observability

### Metrics

While the application exposes a `/metrics` endpoint in Prometheus-compatible format, this project primarily uses GCP Stackdriver Monitoring for observability.

### GCP Cloud Monitoring

1. In the GCP console, navigate to "Monitoring" > "Dashboards", and locate your custom dashboard (e.g., "Calculator App Dashboard").

2. Dashboards may include:
   - RTT latency per Pod
   - API request counts (if integrated)
   - CPU and Memory usage

### Logging

- Navigate to "Logging" > "Logs Explorer"
- Filter logs by `resource.type="k8s_container"` and container name (e.g., `node-web-app`)
- Useful for debugging and monitoring application output

### Alerts

Sample alert policies (such as high request duration) can be configured in GCP Monitoring. These are optional and not required to complete the project.

## Cleaning Up Resources

To avoid extra charges, clean up after testing:

```bash
# Delete the GKE cluster
gcloud container clusters delete calculator-cluster --region=australia-southeast1

# Delete the image from Artifact Registry
gcloud artifacts docker images delete australia-southeast1-docker.pkg.dev/YOUR_PROJECT_ID/calculator-repo/calculator-app
```

## Troubleshooting

1. If MongoDB connection fails, check if secrets are configured correctly.

2. If the application is not accessible, check Service and external IP status.

3. Check container logs:

```bash
kubectl logs deployment/node-web-app
```

4. Use Cloud Monitoring and Logs Explorer for further insight.



