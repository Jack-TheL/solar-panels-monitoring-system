// mqttClient.js
const mqtt = require('mqtt');
const db = require('./db');
const { checkAlerts } = require('./alerts/alertsHandler');

///// MQTT (HiveMQ Cloud)////////
// MQTT client setup
const mqttOptions = {
    host: '788673f83d584b9fa780154a7e8d079e.s1.eu.hivemq.cloud',
    port: 8883,
    protocol: 'mqtts',
    username: 'hivemq.webclient.1727115561302',
    password: '2npwP.Gt*R,sV%10Hb8Z',
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
  // console.log(`Received message on ${topic}: ${message.toString()}`);
  const data = JSON.parse(message.toString());
  const { macAddress, ...sensorData } = data;
  liveData[macAddress] = sensorData;
  
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
    } else { console.log('No panel found for MAC address:', macAddress); }
  });

  // ตรวจสอบเงื่อนไขการแจ้งเตือน
  checkAlerts(liveData[macAddress], macAddress);
});

// Export the MQTT client instance for use in other modules
module.exports = { client, liveData };

// Main ESP32 Mac
// First ---> FC:E8:C0:74:AE:F8 >> user   hivemq.webclient.1727695560857 >> pass   8ec.@XM>ZbUj5?G70Yqr
// Second ---> CC:DB:A7:3F:85:38 >> user   hivemq.webclient.1727893921201 >> pass   Fi68G3ODfsQ*;>2Ptj$q
