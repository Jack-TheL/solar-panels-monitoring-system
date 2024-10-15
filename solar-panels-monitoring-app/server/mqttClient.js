// mqttClient.js
const mqtt = require('mqtt');
const db = require('./db');
const { checkAlerts } = require('./alerts/alertsHandler');

///// MQTT (HiveMQ Cloud)////////
// MQTT client setup
const mqttOptions = {
    host: 'e2dc3e02e77e44838ebd1dad156c8d66.s1.eu.hivemq.cloud',
  //788673f83d584b9fa780154a7e8d079e.s1.eu.hivemq.cloud
    port: 8883,
    protocol: 'mqtts',
    username: 'hivemq.webclient.1728642866817', 
    password: '#247BRALXPwd9.k:pcv,',
};
const client = mqtt.connect(mqttOptions); // Creating MQTT client
// Handle MQTT connection
client.on('connect', () => {
    console.log('Connected to MQTT Broker');

    client.subscribe('esp32/liveData', (err) => {
      if (!err) { console.log('Subscribed to esp32/liveData'); }
    });
});

let liveData = {};
// Handle incoming MQTT messages
client.on('message', (topic, message) => {
  console.log(`Received message on ${topic}: ${message.toString()}`);
  const data = JSON.parse(message.toString());
  const { macAddress, ...sensorData } = data;
  liveData[macAddress] = sensorData;
  
  // liveData[macAddress].light/=1000 
  // console.log(liveData[macAddress]);
  // หา panel_id จาก macAddress
  const query = 'SELECT panel_id FROM esp32 WHERE mac_address = ?';
  db.query(query, [macAddress], (err, results) => {
    if (err) { console.error('Error fetching panel_id:', err); return;}
    if (results.length > 0) {
      const panelId = results[0].panel_id;
      // บันทึกข้อมูล sensor ลงในตาราง sensor_data
      const insertQuery = `
        INSERT INTO sensor_data (current, voltage, temperature, power, light, panel_id) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.query(insertQuery, [
        sensorData.current,
        sensorData.voltage,
        sensorData.temperature,
        sensorData.power,
        sensorData.light,
        panelId
      ], (err, result) => {
        if (err) { console.error('Error inserting sensor data:', err); return; }
        // console.log('Sensor data inserted successfully:', result.insertId);
      });
    } else { 
      console.log('No panel_id found for MAC address:', macAddress);
      // Publish to MQTT topic
      client.publish(`clearCredential/${macAddress}`, '');
      console.log(`Publishing to topic: clearCredential/${macAddress}`);
    }
  });

  // ตรวจสอบเงื่อนไขการแจ้งเตือน
  checkAlerts(liveData[macAddress], macAddress);
});

// Export the MQTT client instance for use in other modules
module.exports = { client, liveData };

// Main ESP32 Mac
// First ---> FC:E8:C0:74:AE:F8 >> user   hivemq.webclient.1728646005092 >> pass   T>Rpml348$Eo0f:JtBV@
// Second ---> CC:DB:A7:3F:85:38 >> user   hivemq.webclient.1728644948114 >> pass   V7BOl;aX3w9!0cE@Cko&
