// functions/upload.js

const { MongoClient } = require("mongodb");
const multipart = require("parse-multipart");

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    "Missing MongoDB connection string in environment variable MONGODB_URI"
  );
}

// Global variable to cache the MongoDB client instance.
let cachedClient = null;

async function getClient() {
  if (
    cachedClient &&
    cachedClient.topology &&
    cachedClient.topology.isConnected()
  ) {
    return cachedClient;
  }
  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  return cachedClient;
}

async function saveImage(file) {
  const client = await getClient();
  const db = client.db("imageUpload");
  const collection = db.collection("images");

  const doc = {
    filename: file.filename,
    contentType: file.type,
    data: file.data, // file.data is a Buffer from parse-multipart
    createdAt: new Date(),
  };

  const result = await collection.insertOne(doc);
  return result.insertedId;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Get the Content-Type header (could be lower- or uppercase)
    const contentType =
      event.headers["content-type"] || event.headers["Content-Type"];
    if (!contentType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing Content-Type header" }),
      };
    }

    // Decode the body if it’s base64 encoded
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body);

    // Retrieve the multipart boundary and parse the parts.
    const boundary = multipart.getBoundary(contentType);
    const parts = multipart.Parse(bodyBuffer, boundary);

    if (!parts || parts.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No file uploaded" }),
      };
    }

    // Use the first part as the image file.
    const file = parts[0];

    const insertedId = await saveImage(file);
    return { statusCode: 200, body: JSON.stringify({ id: insertedId }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
