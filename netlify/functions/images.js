// functions/images.js

const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    "Missing MongoDB connection string in environment variable MONGODB_URI"
  );
}

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

exports.handler = async (event, context) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const client = await getClient();
    const db = client.db("imageUpload");
    const collection = db.collection("images");

    // Retrieve only metadata (exclude the image data for efficiency)
    const images = await collection
      .find({}, { projection: { filename: 1, contentType: 1, createdAt: 1 } })
      .toArray();

    // Append a URL to each image for retrieval through getImage.
    images.forEach((image) => {
      image.url = `/.netlify/functions/getImage?id=${image._id}`;
    });

    return { statusCode: 200, body: JSON.stringify(images) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
