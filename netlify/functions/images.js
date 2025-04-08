const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    "Missing MongoDB connection string in environment variable MONGODB_URI"
  );
}

let cachedClient = null;
async function getClient() {
  if (!cachedClient) {
    try {
      cachedClient = await new MongoClient(uri).connect();
      console.log("MongoDB connected successfully");
    } catch (err) {
      console.error("MongoDB connection error:", err);
      throw err;
    }
  }
  return cachedClient;
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false; // Important for Lambda functions

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const client = await getClient();
    const db = client.db("imageUpload");
    const collection = db.collection("images");

    // Get only metadata (exclude binary image data)
    const images = await collection
      .find({}, { projection: { filename: 1, contentType: 1, createdAt: 1 } })
      .toArray();

    // Append a retrieval URL for each image
    const imageData = images.map((image) => ({
      _id: image._id.toString(), // Convert ObjectId to string
      filename: image.filename,
      contentType: image.contentType,
      createdAt: image.createdAt,
      url: `/.netlify/functions/getImage?id=${image._id}`,
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(imageData),
    };
  } catch (error) {
    console.error("Error in images.js:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
    };
  }
};
