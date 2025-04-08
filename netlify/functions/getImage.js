const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    "Missing MongoDB connection string in environment variable MONGODB_URI"
  );
}

let cachedClientPromise = null;
async function getClient() {
  if (!cachedClientPromise) {
    cachedClientPromise = new MongoClient(uri).connect();
  }
  return cachedClientPromise;
}

exports.handler = async (event, context) => {
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

    const image = await collection.findOne({ _id: ObjectId(id) });
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
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
