const { MongoClient } = require("mongodb");
const multipart = require("parse-multipart");

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    "Missing MongoDB connection string in environment variable MONGODB_URI"
  );
}

// Cache the connection promise between invocations.
let cachedClientPromise = null;
async function getClient() {
  if (!cachedClientPromise) {
    cachedClientPromise = new MongoClient(uri).connect();
  }
  return cachedClientPromise;
}

async function saveImage(file) {
  const client = await getClient();
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
    // Retrieve Content-Type header (handle both cases)
    const contentType =
      event.headers["content-type"] || event.headers["Content-Type"];
    if (!contentType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing Content-Type header" }),
      };
    }

    // Convert event body to a Buffer (account for base64 encoding)
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body);

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
