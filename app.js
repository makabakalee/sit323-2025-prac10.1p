const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3002;
// Initialize Prometheus metrics
const prometheus = require('prom-client');

// Create a Registry to register the metrics
const register = new prometheus.Registry();
// Add a default label which is added to all metrics
prometheus.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDurationMicroseconds = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

// Create counter for API requests
const apiRequestCounter = new prometheus.Counter({
  name: 'api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'endpoint', 'status']
});

// Register the histogram
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(apiRequestCounter);

// Enable JSON body parsing
app.use(express.json());

// Middleware to measure request duration
app.use((req, res, next) => {
  const start = Date.now();
  
  // Record end time and calculate duration on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const path = req.route ? req.route.path : req.path;
    
    // Record metrics
    httpRequestDurationMicroseconds
      .labels(req.method, path, res.statusCode)
      .observe(duration);
    
    apiRequestCounter
      .labels(req.method, path, res.statusCode)
      .inc();
    
    // Add request logging
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/calculator';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB at:', MONGODB_URI);
    // Debug - log the database name
    console.log('Database name:', mongoose.connection.db.databaseName);
    // Debug - log available collections
    mongoose.connection.db.listCollections().toArray()
      .then(collections => {
        console.log('Collections:', collections.map(c => c.name));
      });
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Define a schema for calculation history
const calculationSchema = new mongoose.Schema({
  operation: String,
  parameters: Object,
  result: Number,
  timestamp: { type: Date, default: Date.now }
}, { collection: 'calculations' });

// Create a model from the schema - explicitly set the database
const Calculation = mongoose.model('Calculation', calculationSchema, 'calculations');

// Unified error handling function
function handleError(res, message) {
    return res.status(400).json({ error: message });
}

// Parameter verification function
function validateParams(req, res, singleParam = false) {
    const { num1, num2 } = req.query;

    if (singleParam) {
        if (num1 === undefined) {
            return handleError(res, 'Missing parameter: num1');
        }
        const n1 = parseFloat(num1);
        if (isNaN(n1)) {
            return handleError(res, 'Invalid parameter: num1 must be a number.');
        }
        return { n1 };
    } else {
        if (num1 === undefined || num2 === undefined) {
            return handleError(res, 'Missing parameter: num1 or num2');
        }
        const n1 = parseFloat(num1);
        const n2 = parseFloat(num2);
        if (isNaN(n1) || isNaN(n2)) {
            return handleError(res, 'Invalid parameters: num1 and num2 must be numbers.');
        }
        return { n1, n2 };
    }
}

// Save calculation to database
async function saveCalculation(operation, parameters, result) {
    try {
        const calculation = new Calculation({
            operation,
            parameters,
            result
        });
        await calculation.save();
    } catch (error) {
        console.error('Error saving calculation:', error);
    }
}

// Expose metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Addition
app.get('/add', async (req, res) => {
    const params = validateParams(req, res);
    if (!params.n1 && params.n1 !== 0) return;
    const result = params.n1 + params.n2;
    
    // Save calculation to database
    await saveCalculation('add', { num1: params.n1, num2: params.n2 }, result);
    
    res.json({ result });
});

// Subtraction
app.get('/subtract', async (req, res) => {
    const params = validateParams(req, res);
    if (!params.n1 && params.n1 !== 0) return;
    const result = params.n1 - params.n2;
    
    // Save calculation to database
    await saveCalculation('subtract', { num1: params.n1, num2: params.n2 }, result);
    
    res.json({ result });
});

// Multiplication
app.get('/multiply', async (req, res) => {
    const params = validateParams(req, res);
    if (!params.n1 && params.n1 !== 0) return;
    const result = params.n1 * params.n2;
    
    // Save calculation to database
    await saveCalculation('multiply', { num1: params.n1, num2: params.n2 }, result);
    
    res.json({ result });
});

// Division
app.get('/divide', async (req, res) => {
    const params = validateParams(req, res);
    if (!params.n1 && params.n1 !== 0) return;
    if (params.n2 === 0) {
        return handleError(res, 'Invalid divisor: num2 cannot be zero.');
    }
    const result = params.n1 / params.n2;
    
    // Save calculation to database
    await saveCalculation('divide', { num1: params.n1, num2: params.n2 }, result);
    
    res.json({ result });
});

// Exponential operation
app.get('/power', async (req, res) => {
    const params = validateParams(req, res);
    if (!params.n1 && params.n1 !== 0) return;
    const result = Math.pow(params.n1, params.n2);
    
    // Save calculation to database
    await saveCalculation('power', { num1: params.n1, num2: params.n2 }, result);
    
    res.json({ result });
});

// Square root operation
app.get('/sqrt', async (req, res) => {
    const params = validateParams(req, res, true);
    if (!params.n1 && params.n1 !== 0) return;
    if (params.n1 < 0) {
        return handleError(res, 'Invalid parameter: num1 cannot be negative.');
    }
    const result = Math.sqrt(params.n1);
    
    // Save calculation to database
    await saveCalculation('sqrt', { num1: params.n1 }, result);
    
    res.json({ result });
});

// Modulo operation
app.get('/mod', async (req, res) => {
    const params = validateParams(req, res);
    if (!params.n1 && params.n1 !== 0) return;
    if (params.n2 === 0) {
        return handleError(res, 'Invalid divisor: num2 cannot be zero.');
    }
    const result = params.n1 % params.n2;
    
    // Save calculation to database
    await saveCalculation('mod', { num1: params.n1, num2: params.n2 }, result);
    
    res.json({ result });
});

// Get calculation history
app.get('/history', async (req, res) => {
    try {
        const history = await Calculation.find().sort({ timestamp: -1 }).limit(100);
        res.json({ history });
    } catch (error) {
        console.error('Error fetching history:', error);
        handleError(res, 'Failed to retrieve calculation history');
    }
});

// Clear calculation history
app.delete('/history', async (req, res) => {
    try {
        await Calculation.deleteMany({});
        res.json({ message: 'History cleared successfully' });
    } catch (error) {
        console.error('Error clearing history:', error);
        handleError(res, 'Failed to clear calculation history');
    }
});

// Global unknown routing processing
app.use((req, res) => {
    res.status(404).json({ error: 'Invalid request path, please check the interface address' });
});

// Start the server
app.listen(port, () => {
    console.log(`The Enhanced Calculator microservice runs on http://localhost:${port}`);
    console.log(`Metrics available at http://localhost:${port}/metrics`);
});