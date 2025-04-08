const { MongoClient, ObjectId } = require("mongodb");

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
    } catch (err) {
      console.error("MongoDB connection error:", err);
      throw err;
    }
  }
  return cachedClient;
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { id } = event.queryStringParameters || {};
  if (!id) {
    return { statusCode: 400, body: "Missing image id" };
  }

  try {
    const client = await getClient();
    const db = client.db("imageUpload");
    const collection = db.collection("images");

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid image ID format" }),
      };
    }

    const image = await collection.findOne({ _id: objectId });
    if (!image) {
      return { statusCode: 404, body: "Image not found" };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "max-age=31536000",
      },
      body: image.data.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("Error in getImage.js:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
