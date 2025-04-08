const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000, // 5 seconds timeout
  connectTimeoutMS: 5000,
});

exports.handler = async function (event, context) {
  // Reuse connections
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // Connect to MongoDB
    console.log("Attempting to connect to MongoDB...");
    await client.connect();
    console.log("Connected to MongoDB!");

    // Test database connection
    const db = client.db("imageUpload");
    const collection = db.collection("images");
    const count = await collection.countDocuments();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Connected successfully",
        imageCount: count,
      }),
    };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
    };
  }
};
