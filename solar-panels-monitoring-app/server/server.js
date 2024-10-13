const express = require('express');
const cors = require('cors');
const { setupWebSocket } = require('./alertService'); 
const apiRoutes = require('./api/index');
const client = require('./mqttClient');
const db = require('./db');

require('./alerts/panelInactiveAlert');

const app = express();
const port = process.env.PORT || 3000;
// Midleware
app.use(cors());
app.use(express.json());
app.use('/', apiRoutes);
// สร้าง HTTP server
const http = require('http');
const server = http.createServer(app);
// ตั้งค่า WebSocket โดยใช้ server ที่ผสานอยู่
setupWebSocket(server);

///// API Paths ////
// API สำหรับเช็ค MQTT Credentials จาก ESP32 Req
app.post('/api/new-credentials', (req, res) => {
  const { mac_address } = req.body;
  if (!mac_address) { return res.status(400).json({ error: 'MAC address is required' });}
  console.log('Received MAC Address: ' + mac_address);
  db.query('SELECT mqtt_user, mqtt_pass FROM esp32 WHERE mac_address = ?', 
  [mac_address], (error, results) => {
    if (error) { console.error('Error fetching data: ' + error.stack);
      return res.status(500).json({ error: 'Database error' });
    }
    // ส่งผลลัพธ์กลับไปยังผู้เรียก API
    if (results.length > 0) {
      console.log('Data fetched:', results);
      const { mqtt_user: username, mqtt_pass: password } = results[0];   
      // อัปเดตตาราง esp32 ให้ attached เป็น true สำหรับ mac_address
      db.query('UPDATE esp32 SET attached = true WHERE mac_address = ?', [mac_address], (updateError) => {
        if (updateError) {
         console.error('Error updating data: ' + updateError.stack);
         return res.status(500).json({ error: 'Database error during update' });
        }      
       // ส่งข้อมูลกลับไปยังผู้เรียก API
       console.log('ESP32 adding:', mac_address);
       return res.status(200).json({ username, password });
      });
      } else {
        console.log('ESP32 not yet add:', mac_address);
        return res.status(404).json({ message: 'SP32 not yet add' });
      }
  });
});

// เริ่ม HTTP server
server.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});