const express = require('express');
const fs = require('fs');
const path = require('path');
const CommunityOpinion = require('../models/CommunityOpinion');
const { protect } = require('../middleware/auth');

const router = express.Router();
const csvPath = path.resolve(__dirname, '..', '..', 'data', 'bangalore_crime_dataset.csv');

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.replace(/^"|"$/g, '').trim());
};

const loadCrimeData = () => {
  if (!fs.existsSync(csvPath)) {
    return [];
  }

  const fileContents = fs.readFileSync(csvPath, 'utf8').trim();
  if (!fileContents) {
    return [];
  }

  const lines = fileContents.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    return {
      latitude: Number(row.latitude || 0),
      longitude: Number(row.longitude || 0),
      crime_type: row.crime_type || 'Unknown',
      crime_severity: Number(row.crime_severity || 0),
      date: row.date || '',
      time: row.time || '',
      hour: Number(row.hour || 0),
      area: row.area || 'Unknown',
      lighting_score: Number(row.lighting_score || 0),
      cctv_score: Number(row.cctv_score || 0),
      crowd_density: Number(row.crowd_density || 0),
      police_proximity: Number(row.police_proximity || 0),
      is_night: Number(row.is_night || 0) === 1
    };
  });
};

const clampScore = (value) => Math.min(100, Math.max(0, value));

const calculateSafetyScore = (areaStats, maxCrimeCount, maxAverageSeverity) => {
  // Safety score combines both risk and support signals.
  // Risk is reduced as total incidents, severity, and night-time crime decrease.
  // Positive factors such as lighting, CCTV, crowd density, and police proximity increase safety.
  const crimeFactor = 1 - (areaStats.totalIncidents / maxCrimeCount);
  const severityFactor = 1 - (areaStats.avgSeverity / maxAverageSeverity);
  const nightFactor = 1 - (areaStats.nightCrimePercentage / 100);
  const positiveFactor = (
    areaStats.lightingAvg +
    areaStats.cctvAvg +
    areaStats.crowdDensityAvg +
    areaStats.policeProximityAvg
  ) / 4;

  const rawScore = (
    crimeFactor * 0.4 +
    severityFactor * 0.2 +
    nightFactor * 0.15 +
    positiveFactor * 0.25
  ) * 100;

  return Number(clampScore(rawScore).toFixed(1));
};

const buildAreaStats = (records) => {
  const grouped = new Map();

  records.forEach((record) => {
    const areaName = record.area;

    if (!grouped.has(areaName)) {
      grouped.set(areaName, {
        area: areaName,
        totalIncidents: 0,
        highSeverity: 0,
        mediumSeverity: 0,
        lowSeverity: 0,
        dayCrimeCount: 0,
        nightCrimeCount: 0,
        crimeTypeDistribution: {},
        severityDistribution: { High: 0, Medium: 0, Low: 0 },
        lightingTotal: 0,
        cctvTotal: 0,
        crowdDensityTotal: 0,
        policeProximityTotal: 0,
        totalSeverity: 0,
        latitudeTotal: 0,
        longitudeTotal: 0,
        latitudeCount: 0,
        longitudeCount: 0,
      });
    }

    const stats = grouped.get(areaName);
    stats.totalIncidents += 1;
    stats.totalSeverity += record.crime_severity;
    stats.latitudeTotal += record.latitude;
    stats.longitudeTotal += record.longitude;
    stats.latitudeCount += 1;
    stats.longitudeCount += 1;

    if (record.crime_severity >= 6) {
      stats.highSeverity += 1;
      stats.severityDistribution.High += 1;
    } else if (record.crime_severity >= 3) {
      stats.mediumSeverity += 1;
      stats.severityDistribution.Medium += 1;
    } else {
      stats.lowSeverity += 1;
      stats.severityDistribution.Low += 1;
    }

    if (record.is_night) {
      stats.nightCrimeCount += 1;
    } else {
      stats.dayCrimeCount += 1;
    }

    stats.crimeTypeDistribution[record.crime_type] = (stats.crimeTypeDistribution[record.crime_type] || 0) + 1;
    stats.lightingTotal += record.lighting_score;
    stats.cctvTotal += record.cctv_score;
    stats.crowdDensityTotal += record.crowd_density;
    stats.policeProximityTotal += record.police_proximity;
  });

  const baseStats = Array.from(grouped.values()).map((stats) => {
    const totalIncidents = stats.totalIncidents;
    const avgSeverity = totalIncidents ? stats.totalSeverity / totalIncidents : 0;
    const nightCrimePercentage = totalIncidents ? (stats.nightCrimeCount / totalIncidents) * 100 : 0;

    return {
      area: stats.area,
      totalIncidents,
      crimeTypeDistribution: Object.entries(stats.crimeTypeDistribution)
        .sort((a, b) => b[1] - a[1])
        .reduce((acc, [type, count]) => ({ ...acc, [type]: count }), {}),
      severityDistribution: stats.severityDistribution,
      highSeverity: stats.highSeverity,
      mediumSeverity: stats.mediumSeverity,
      lowSeverity: stats.lowSeverity,
      dayCrimeCount: stats.dayCrimeCount,
      nightCrimeCount: stats.nightCrimeCount,
      nightCrimePercentage: Number(nightCrimePercentage.toFixed(1)),
      avgSeverity: Number(avgSeverity.toFixed(2)),
      lightingAvg: Number((stats.lightingTotal / totalIncidents).toFixed(2)),
      cctvAvg: Number((stats.cctvTotal / totalIncidents).toFixed(2)),
      crowdDensityAvg: Number((stats.crowdDensityTotal / totalIncidents).toFixed(2)),
      policeProximityAvg: Number((stats.policeProximityTotal / totalIncidents).toFixed(2)),
      latitude: Number((stats.latitudeTotal / stats.latitudeCount).toFixed(5)),
      longitude: Number((stats.longitudeTotal / stats.longitudeCount).toFixed(5)),
      score: 0,
      positiveFactors: [],
      riskFactors: []
    };
  });

  const maxCrimeCount = Math.max(...baseStats.map((item) => item.totalIncidents), 1);
  const maxAverageSeverity = Math.max(...baseStats.map((item) => item.avgSeverity), 1);

  return baseStats.map((areaStats) => {
    areaStats.score = calculateSafetyScore(areaStats, maxCrimeCount, maxAverageSeverity);

    areaStats.positiveFactors = [
      areaStats.lightingAvg >= 0.6 ? `Good lighting coverage (${areaStats.lightingAvg}/1.0)` : `Lighting is moderate (${areaStats.lightingAvg}/1.0)`,
      areaStats.cctvAvg >= 0.5 ? `CCTV coverage is strong (${areaStats.cctvAvg}/1.0)` : `CCTV coverage needs improvement (${areaStats.cctvAvg}/1.0)`,
      areaStats.policeProximityAvg >= 0.5 ? `Police presence is reasonably close (${areaStats.policeProximityAvg}/1.0)` : `Police proximity is comparatively low (${areaStats.policeProximityAvg}/1.0)`,
      areaStats.crowdDensityAvg >= 0.5 ? `Crowd density is active and visible (${areaStats.crowdDensityAvg}/1.0)` : `Crowd density is lighter (${areaStats.crowdDensityAvg}/1.0)`
    ].filter(Boolean);

    areaStats.riskFactors = [
      areaStats.nightCrimePercentage > 60 ? `Higher night-time crime share (${areaStats.nightCrimePercentage}%)` : `Night-time crime share is controlled (${areaStats.nightCrimePercentage}%)`,
      areaStats.highSeverity > 0 ? `${areaStats.highSeverity} high-severity incidents reported` : 'No high-severity incidents in the current sample',
      `${areaStats.totalIncidents} reported incidents overall`
    ].filter(Boolean);

    return areaStats;
  });
};

const getAreaDetails = (areaName) => {
  const records = loadCrimeData();
  const rankedAreas = buildAreaStats(records).sort((a, b) => b.score - a.score);
  return rankedAreas.find((area) => area.area.toLowerCase() === areaName.toLowerCase()) || rankedAreas[0];
};

router.get('/areas', async (req, res) => {
  try {
    const records = loadCrimeData();
    const rankedAreas = buildAreaStats(records).sort((a, b) => b.score - a.score);

    const areas = rankedAreas.map((area, index) => ({
      rank: index + 1,
      area: area.area,
      score: area.score,
      crimeIncidents: area.totalIncidents,
      nightCrimePercentage: area.nightCrimePercentage,
      avgSeverity: area.avgSeverity,
      latitude: area.latitude,
      longitude: area.longitude
    }));

    res.json({ areas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Unable to compute area safety data.' });
  }
});

router.get('/areas/:area', async (req, res) => {
  try {
    const selectedArea = getAreaDetails(decodeURIComponent(req.params.area));

    if (!selectedArea) {
      return res.status(404).json({ msg: 'Area not found in dataset.' });
    }

    return res.json(selectedArea);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Unable to load area insights.' });
  }
});

router.get('/opinions/:area', async (req, res) => {
  try {
    const area = decodeURIComponent(req.params.area);
    const opinions = await CommunityOpinion.find({ area: new RegExp(`^${area}$`, 'i') }).sort({ createdAt: -1 });
    const averageRating = opinions.length
      ? opinions.reduce((sum, opinion) => sum + Number(opinion.rating || 0), 0) / opinions.length
      : 0;

    res.json({ area, opinions, totalReviews: opinions.length, averageRating: Number(averageRating.toFixed(1)) || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Unable to load community opinions.' });
  }
});

router.post('/opinions', protect, async (req, res) => {
  try {
    const {
      area,
      title,
      content,
      rating,
      safetyRating,
      cleanlinessRating,
      transportationRating,
      amenitiesRating,
      trafficRating,
      connectivityRating,
      user,
    } = req.body;

    if (!area || !title || !content) {
      return res.status(400).json({ msg: 'Area, title and content are required.' });
    }

    const normalizedRating = Number(rating);
    if (Number.isNaN(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ msg: 'Overall rating must be between 1 and 5.' });
    }

    const categoryRatings = [
      safetyRating,
      cleanlinessRating,
      transportationRating,
      amenitiesRating,
      trafficRating,
      connectivityRating,
    ].map((value) => Number(value));

    if (categoryRatings.some((value) => Number.isNaN(value) || value < 1 || value > 5)) {
      return res.status(400).json({ msg: 'Category ratings must be between 1 and 5.' });
    }

    const opinion = await CommunityOpinion.create({
      area,
      title,
      content,
      rating: normalizedRating,
      safetyRating: Number(safetyRating || 3),
      cleanlinessRating: Number(cleanlinessRating || 3),
      transportationRating: Number(transportationRating || 3),
      amenitiesRating: Number(amenitiesRating || 3),
      trafficRating: Number(trafficRating || 3),
      connectivityRating: Number(connectivityRating || 3),
      user: user || req.user?.name || 'Anonymous'
    });

    res.status(201).json(opinion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Unable to save community opinion.' });
  }
});

module.exports = router;
module.exports.calculateSafetyScore = calculateSafetyScore;
