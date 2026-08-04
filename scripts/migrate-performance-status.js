require("dotenv").config();

const mongoose = require("mongoose");

const DetailedReport = require("../models/DetailedReports");

const { getPerformanceLevel } = require("../utils/performance.util");

const BATCH_SIZE = 1000;

async function migratePerformanceStatus() {
  try {
    console.log("======================================");
    console.log("Performance Migration Started...");
    console.log("======================================");

    await mongoose.connect(process.env.MONGO_URL);

    console.log("MongoDB Connected");

    let lastId = null;

    let updated = 0;
    let skipped = 0;
    let processed = 0;

    while (true) {
      const query = {
        $or: [
          { performanceStatus: { $exists: false } },
          { performanceScore: { $exists: false } },
        ],
      };

      const reports = await DetailedReport.find(query)
        .sort({ _id: 1 })
        .limit(BATCH_SIZE)
        .lean();

      if (!reports.length) {
        break;
      }

      const operations = [];

      for (const report of reports) {
        processed++;

        lastId = report._id;

        /**
         * Already migrated
         */
        if (report.performanceStatus && report.performanceScore) {
          skipped++;
          continue;
        }

        const performance = getPerformanceLevel(report.percentage);

        operations.push({
          updateOne: {
            filter: {
              _id: report._id,
            },
            update: {
              $set: {
                performanceStatus: performance.performanceStatus,

                performanceScore: performance.performanceScore,

                updatedAt: new Date(),
              },
            },
          },
        });
      }

      if (operations.length) {
        await DetailedReport.bulkWrite(operations, {
          ordered: false,
        });

        updated += operations.length;
      }

      console.log(
        `Processed: ${processed} | Updated: ${updated} | Skipped: ${skipped}`,
      );
    }

    console.log("");
    console.log("======================================");
    console.log("Migration Completed");
    console.log("======================================");
    console.log(`Processed : ${processed}`);
    console.log(`Updated   : ${updated}`);
    console.log(`Skipped   : ${skipped}`);
    console.log("======================================");

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
}

migratePerformanceStatus();
