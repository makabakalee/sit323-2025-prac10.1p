# SIT323 Calculator Microservice - Monitoring and Observability

This is a simple calculator microservice with monitoring and observability features. The application is built using Node.js, Express, and MongoDB, and is deployed on a Kubernetes cluster in Google Cloud Platform (GCP).

## Features

- Basic calculator operations: addition, subtraction, multiplication, division, etc.
- Operation history stored in MongoDB
- Monitoring using Prometheus and GCP Cloud Monitoring
- Health check endpoint for Kubernetes probes
- Resource utilization monitoring
- Custom dashboards and alert policies

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

4. Access the API:

- Addition: http://localhost:3002/add?num1=5&num2=3
- Subtraction: http://localhost:3002/subtract?num1=5&num2=3
- Multiplication: http://localhost:3002/multiply?num1=5&num2=3
- Division: http://localhost:3002/divide?num1=6&num2=3
- Square Root: http://localhost:3002/sqrt?num1=9
- Exponentiation: http://localhost:3002/power?num1=2&num2=3
- Modulo: http://localhost:3002/mod?num1=7&num2=3
- View History: http://localhost:3002/history
- Monitoring Metrics: http://localhost:3002/metrics
- Health Check: http://localhost:3002/health

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
- Create a GKE cluster
- Build and push Docker images
- Deploy MongoDB and the application
- Configure monitoring and logging
- Return the application URL

## Monitoring and Observability

### Prometheus Metrics

The application exposes the following Prometheus metrics at the `/metrics` endpoint:

- `http_request_duration_ms` - HTTP request duration (milliseconds)
- `api_requests_total` - Total API requests
- Node.js default metrics (memory usage, GC, etc.)

### GCP Cloud Monitoring (Stackdriver)

1. In the GCP console, navigate to "Monitoring" > "Dashboards", where you will see the custom "Calculator Application Dashboard".

2. The monitoring dashboard includes:
   - Request duration
   - API request count
   - CPU usage
   - Memory usage

### Alerts

The following alerts have been configured:

- "High Request Duration Alert" triggered when the average request duration exceeds 500 milliseconds

## Cleaning Up Resources

To avoid additional charges, be sure to clean up resources after completion:

```bash
# Delete the GKE cluster
gcloud container clusters delete calculator-cluster --region=us-central1

# Delete the images in Container Registry
gcloud container images delete gcr.io/YOUR_PROJECT_ID/calculator-app:latest
```

## Troubleshooting

1. If MongoDB connection fails, check if the secrets are configured correctly.

2. If the application cannot be accessed, check the service and Ingress configuration.

3. View GCP logs for more detailed error information:
   ```bash
   kubectl logs deployment/node-web-app
   ```

4. Monitor metrics and logs in the GCP console for insights into performance and issues.

