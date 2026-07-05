const mongoose = require('mongoose');
const User = require('./models/User');
const Case = require('./models/Case');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected to', process.env.MONGODB_URI);
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

module.exports = { connectDB, User, Case };
