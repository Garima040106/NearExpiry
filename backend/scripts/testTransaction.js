
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Facility = require("../models/Facility");

const testTransaction = async () => {
    let session;

    try {
        await connectDB();

        session = await mongoose.startSession();

        await session.withTransaction(async () => {
            await Facility.findOne({}).session(session);
        });

        console.log("SUCCESS: MongoDB transactions are supported.");

    } catch (error) {
        console.error("TRANSACTION TEST FAILED:");
        console.error(error.message);
        process.exitCode = 1;

    } finally {
        if (session) {
            await session.endSession();
        }

        await mongoose.disconnect();
    }
};

testTransaction();
