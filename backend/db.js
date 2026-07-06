const mongoose = require('mongoose');
const User = require('./models/User');
const Case = require('./models/Case');

const connectDB = async () => {
    try {
        const connUri = process.env.MONGODB_URI || 'mongodb+srv://sonishivam492_db_user:aoONIDo4e4NpU9ZG@cluster0.zfrknha.mongodb.net/InvestigationManagement?appName=Cluster0';
        await mongoose.connect(connUri);
        console.log('MongoDB Connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

module.exports = { connectDB, User, Case };
