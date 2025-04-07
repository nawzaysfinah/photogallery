// netlify/functions/upload.js

const { MongoClient } = require("mongodb");
const multipart = require("parse-multipart");

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    "Missing MongoDB connection string in environment variable MONGODB_URI"
  );
}

const client = new MongoClient(uri);

async function saveImage(file) {
  const db = client.db("imageUpload");
  const collection = db.collection("images");

  const doc = {
    filename: file.filename,
    contentType: file.type,
    data: file.data, // file.data is a Buffer
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
    // Retrieve the content-type header (case-insensitive)
    const contentType =
      event.headers["content-type"] || event.headers["Content-Type"];
    if (!contentType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing Content-Type header" }),
      };
    }

    // Decode the body if it's base64 encoded
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body);

    // Get the boundary from the content type
    const boundary = multipart.getBoundary(contentType);

    // Parse the multipart form data into parts
    const parts = multipart.Parse(bodyBuffer, boundary);

    // Check if any file parts were found
    if (!parts || parts.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No file uploaded" }),
      };
    }

    // For simplicity, assume the first part is the image file
    const file = parts[0];

    // Connect to MongoDB if not already connected
    if (!client.isConnected()) {
      await client.connect();
    }

    const insertedId = await saveImage(file);
    return { statusCode: 200, body: JSON.stringify({ id: insertedId }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
