const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    "Missing MongoDB connection string in environment variable MONGODB_URI"
  );
}

const client = new MongoClient(uri);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    if (!client.isConnected()) {
      await client.connect();
    }
    const db = client.db("imageUpload");
    const collection = db.collection("images");

    // Retrieve metadata only
    const images = await collection
      .find({}, { projection: { filename: 1, contentType: 1, createdAt: 1 } })
      .toArray();

    // Add URL for retrieving the image via the getImage function
    images.forEach((image) => {
      image.url = `/.netlify/functions/getImage?id=${image._id}`;
    });

    return { statusCode: 200, body: JSON.stringify(images) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
