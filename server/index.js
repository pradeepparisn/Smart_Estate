const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const requestRoutes = require('./routes/requests');
const predictRoutes = require('./routes/predict');
const marketTrendRoutes = require('./routes/marketTrends');
const areaInsightsRoutes = require('./routes/areaInsights');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/market-trends', marketTrendRoutes);
app.use('/api/area-insights', areaInsightsRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.log('DB Error:', err));

app.get('/', (req, res) => {
  res.json({ message: 'SmartEstate API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));