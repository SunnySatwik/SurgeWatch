const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize database (creates tables + seeds on first run)
const db = require('./db');
db.initialize();

const weatherRoutes = require('./routes/weather');
const geocodeRoutes = require('./routes/geocode');
const locationRoutes = require('./routes/location');
const forecastRoutes = require('./routes/forecast');
const intelligenceRoutes = require('./routes/intelligence');
const connectorsRoutes = require('./routes/connectors');
const operationsRoutes = require('./routes/operations');
const replayRoutes     = require('./routes/replay');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/weather', weatherRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/connectors', connectorsRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/replay', replayRoutes);

// Error Middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`SurgeWatch Backend running on port ${PORT}`);
});
