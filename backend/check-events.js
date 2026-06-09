require("dotenv").config();
const mongoose = require("mongoose");
const Evenement = require("./models/Evenement");

async function checkEvents() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to DB!");

    const events = await Evenement.find();
    console.log(`\n📅 Found ${events.length} events:`);
    console.log(events.map(e => ({ id: e._id, title: e.titre, date: e.date, place: e.places_disponibles })));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkEvents();
