const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.return = functions.https.onRequest((req, res) => {
  // Check if the request method is POST
  if (req.method !== "POST") {
    console.log("not post");
    return res.status(405).send("Method Not Allowed");
  }

  // Check for the authentication token
  // const authToken = req.get("Authorization");
  // if (!authToken || authToken !== "Bearer 71d849bf182a279139d98311907c743e") {
  //   return res.status(401).send("Unauthorized");
  // }

  // Process the station registration
  // Assuming the station sends its ID and other necessary data in the request body
  const stationData = req.body;

  // You can add your logic here to handle the station data
  // For example, saving it to Firestore or performing other actions
  console.log("body", req.body);

  console.log("resbody", res.json);
  // Sending a response back to the station

  res.status(!200).send({ message: "not 200" });
  res
    .status(200)
    .send({ message: "Station registered successfully", data: stationData });
});

exports.register = functions.https.onRequest((req, res) => {
  // Check if the request method is POST
  if (req.method !== "POST") {
    console.log("not post");
    return res.status(405).send("Method Not Allowed");
  }

  // Check for the authentication token
  // const authToken = req.get("Authorization");
  // if (!authToken || authToken !== "Bearer 71d849bf182a279139d98311907c743e") {
  //   return res.status(401).send("Unauthorized");
  // }

  // Process the station registration
  // Assuming the station sends its ID and other necessary data in the request body
  const stationData = req.body;

  // You can add your logic here to handle the station data
  // For example, saving it to Firestore or performing other actions
  console.log("body", req.body);

  console.log("resbody", res.json);
  // Sending a response back to the station

  res.status(!200).send({ message: "not 200" });
  res
    .status(200)
    .send({ message: "Station registered successfully", data: stationData });
});
