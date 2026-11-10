require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Facility = require("../models/Facility");

const seedFacilities = async () => {
    try {
        await connectDB();

        const facilities = [
            {
                name: "NearExpiry Demo Clinic",
                city: "Bengaluru"
            },
            {
                name: "Community Health Centre",
                city: "Bengaluru"
            },
            {
                name: "City Medical Centre",
                city: "Mysuru"
            }
        ];

        for (const facility of facilities) {
            await Facility.updateOne(
                {
                    name: facility.name,
                    city: facility.city
                },
                {
                    $setOnInsert: facility
                },
                {
                    upsert: true
                }
            );
        }

        console.log("Sample facilities created or already exist.");

        const savedFacilities = await Facility.find()
            .select("name city")
            .sort({ name: 1 });

        console.log("\nAvailable facilities:");

        savedFacilities.forEach((facility) => {
            console.log(
                `${facility.name} | ${facility.city} | ID: ${facility._id}`
            );
        });

    } catch (error) {
        console.error("Facility seeding failed:", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
};

seedFacilities();
