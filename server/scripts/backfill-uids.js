// Backfill script to add unique `uid` fields to Homework and StudyLink documents that are missing them.
// Usage: node scripts/backfill-uids.js

const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/homework-tracker';

async function connect() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
}

async function run() {
  await connect();
  console.log('Connected to MongoDB');

  const homeworkSchema = new mongoose.Schema({}, { strict: false });
  const linkSchema = new mongoose.Schema({}, { strict: false });
  const Homework = mongoose.model('Homework', homeworkSchema, 'homeworks');
  const StudyLink = mongoose.model('StudyLink', linkSchema, 'studylinks');

  // Helper to generate an 8-char hex uid
  function genUid() {
    return crypto.randomBytes(4).toString('hex');
  }

  // Backfill homework
  const hwMissing = await Homework.find({ uid: { $exists: false } });
  console.log(`Found ${hwMissing.length} homework items missing uid`);
  for (const hw of hwMissing) {
    let uid = null;
    for (let i = 0; i < 10; i++) {
      const candidate = genUid();
      const exists = await Homework.findOne({ uid: candidate });
      if (!exists) { uid = candidate; break; }
    }
    if (!uid) {
      console.warn('Failed to generate unique uid for homework', hw._id);
      continue;
    }
    hw.uid = uid;
    await hw.save();
    console.log('Updated homework', hw._id.toString(), '->', uid);
  }

  // Backfill study links
  const linksMissing = await StudyLink.find({ uid: { $exists: false } });
  console.log(`Found ${linksMissing.length} study links missing uid`);
  for (const link of linksMissing) {
    let uid = null;
    for (let i = 0; i < 10; i++) {
      const candidate = genUid();
      const exists = await StudyLink.findOne({ uid: candidate });
      if (!exists) { uid = candidate; break; }
    }
    if (!uid) {
      console.warn('Failed to generate unique uid for study link', link._id);
      continue;
    }
    link.uid = uid;
    await link.save();
    console.log('Updated study link', link._id.toString(), '->', uid);
  }

  console.log('Backfill complete');
  mongoose.disconnect();
}

run().catch(err => {
  console.error('Error running backfill:', err);
  process.exit(1);
});
