// index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.iotReturnWebhook = functions.https.onRequest(async (req, res) => {
  const token = req.header("X-IoT-Token");
  if (
    token !== "3c035eebd2acfc760c517df06af404328a524c07d25b3a46f2dfb6adb8e5c38b"
  )
    return res.status(401).send("Unauthorized");

  const { stationId, ts, data } = req.body || {};
  if (!stationId) return res.status(400).send("stationId required");

  await admin
    .firestore()
    .collection("Stations")
    .doc(stationId)
    .collection("logs")
    .add({
      station_id: stationId,
      event_type: "return_battery",
      payload_b64: data,
      timestamp: ts ? new Date(ts) : new Date(),
    });
  res.json({ ok: true });
});
