const express = require('express');
const router = express.Router();
const {client} = require('../mqttClient');
const db = require('../db');

///  NewPanel.vue ///
router.post('/new-panel', (req, res) => {
    const {
        ownerUsername,
        ownerEmail,
        panelName,
        macAddress,
        mqtt_user,
        mqtt_pass,
    } = req.body;
    // ค้นหาผู้ใช้ในตาราง users ตาม username และ email
    const queryUser = 'SELECT id FROM users WHERE username = ? AND email = ?';
    db.query(queryUser, [ownerUsername, ownerEmail], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = results[0].id;
        // ตรวจสอบ mac_address, mqtt_user และ mqtt_pass ว่ามีอยู่ใน esp32 หรือไม่
        const queryEsp32Check = `
            SELECT * FROM esp32 
            WHERE mac_address = ? OR (mqtt_user = ? AND mqtt_pass = ?)
        `;
        db.query(queryEsp32Check, [macAddress, mqtt_user, mqtt_pass], (err, esp32Results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            // ถ้าพบค่าที่ซ้ำซ้อน
            if (esp32Results.length > 0) {
                return res.status(409).json({ error: 'MAC address, MQTT user, or MQTT password already exists' });
            }
            // บันทึกข้อมูลในตาราง panels
            const queryPanel = 'INSERT INTO panels (name, user_id) VALUES (?, ?)';
            db.query(queryPanel, [panelName, userId], (err, panelResults) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                const panelId = panelResults.insertId; // รับ panel_id ที่สร้างขึ้น
                // บันทึกข้อมูลในตาราง esp32
                const queryInsertEsp32 = 'INSERT INTO esp32 (mac_address, mqtt_user, mqtt_pass, panel_id) VALUES (?, ?, ?, ?)';
                db.query(queryInsertEsp32, [macAddress, mqtt_user, mqtt_pass, panelId], (err) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    res.status(201).json({ message: 'Panel added successfully' });
                });
            });
        });
    });
});
///  PanelsView.vue ///
router.get('/panels', (req, res) => {
    const { userId, role } = req.query;
    if (role === 'admin') {
        const query = `
            SELECT 
                panels.id,
                panels.name, 
                panels.created, 
                panels.updated, 
                panels.status, 
                CONCAT(users.username, ' (', users.email, ')') AS owner
            FROM panels
            JOIN users ON panels.user_id = users.id
            ORDER BY panels.updated DESC
        `;
        db.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(200).json(results);
        });
    } else if (role === 'user') {
        const query = `
            SELECT 
                panels.id,
                panels.name, 
                panels.created, 
                panels.updated, 
                panels.status, 
                panels.Pmax
            FROM panels
            WHERE panels.user_id = ?
            ORDER BY panels.updated DESC
        `;
        db.query(query, [userId], (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(200).json(results);
        });
    } else {
        res.status(400).json({ error: 'Invalid role' });
    }
});
///  ConfigPaneView.vue ///
router.get('/panels/:id', (req, res) => {
    const panelId = req.params.id;
    const query = `
        SELECT
            panels.name, panels.location,
            panels.Pmax, panels.Imp, panels.Vmp,
            panels.Isc, panels.Voc,
            esp32.fan_lv1, esp32.fan_lv2, esp32.fan_lv3,
            esp32.min_temp, esp32.max_temp,
            esp32.min_light, esp32.ssid, esp32.password
        FROM panels LEFT JOIN esp32 
        ON  panels.id = esp32.panel_id
        WHERE  panels.id = ?
    `;
    db.query(query, [panelId], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).send('Error fetching data');
        }
        if (results.length === 0) {
            return res.status(404).send('No data found');
        }
        console.log(results[0]);
        res.status(200).json(results[0]);
    });
});
// Update
router.put('/update-panel/:id', (req, res) => {
    const panelId = req.params.id;
    // let mac_address, old_ssid, old_password;
    const {
      name, location, Pmax, Imp, Vmp, Isc, Voc,
      fan_lv1, fan_lv2, fan_lv3,
      min_temp, max_temp, min_light,
      ssid, password
    } = req.body;
    const updatePanelQuery = `
      UPDATE panels
      SET name = ?, location = ?, Pmax = ?, Imp = ?, Vmp = ?, Isc = ?, Voc = ?
      WHERE id = ?
    `;
    const updateEsp32Query = `
      UPDATE esp32
      SET fan_lv1 = ?, fan_lv2 = ?, fan_lv3 = ?, min_temp = ?, max_temp = ?, min_light = ?, ssid = ?, password = ?
      WHERE panel_id = ?
    `;
    const query = `SELECT mac_address,ssid,password FROM esp32 WHERE panel_id = ?`;
    db.query(query, [panelId], (err, results) => {
        if (err) { return res.status(500).json({ message: "Database error", error: err });}
        if (results.length > 0) { 
            mac_address = results[0].mac_address;
            old_ssid = results[0].ssid; old_password = results[0].password;
        }
        else {res.status(404).json({ message: "MAC Address not found" });}
    });
    // เริ่มต้นการทำงานกับฐานข้อมูล
    db.beginTransaction((err) => {
      if (err) return res.status(500).json({ error: 'Transaction error' });
      // อัปเดตข้อมูลในตาราง panels
      db.query(updatePanelQuery, [name, location, Pmax, Imp, Vmp, Isc, Voc, panelId], (err, result) => {
        if (err) { return db.rollback(() => {
            return res.status(500).json({ error: 'Failed to update panels' });
          });
        }
        // อัปเดตข้อมูลในตาราง esp32
        db.query(updateEsp32Query, [fan_lv1, fan_lv2, fan_lv3, min_temp, max_temp, min_light, ssid, password, panelId], (err, result) => {
          if (err) { return db.rollback(() => {
              return res.status(500).json({ error: 'Failed to update esp32' });
            });
          }
          // ทำการ Commit การเปลี่ยนแปลง
          db.commit((err) => {
            if (err) { return db.rollback(() => {
                return res.status(500).json({ error: 'Commit error' });
              });
            }
            // Publish data to topic
            if((old_ssid!=ssid)||(old_password!=password)){ 
                client.publish(`changeWiFi/${mac_address}`, JSON.stringify({
                    ssid: ssid, password: password
                })); console.log(`Publishing to topic: changeWiFi/${mac_address}`);
            }
            client.publish(`setFanSpeed/${mac_address}`, JSON.stringify({
                spdLv1: fan_lv1, spdLv2: fan_lv2, spdLv3: fan_lv3
            }));
            client.publish(`setOperatingTemp/${mac_address}`, JSON.stringify({
                minTemp: min_temp, maxTemp: max_temp
            }));
            console.log(`Publishing to topic: setFanSpeed/${mac_address}`);
            console.log(`Publishing to topic: setOperatingTemp/${mac_address}`);
            res.status(200).json({ message: 'Panel updated successfully' });
          });
        });
      });
    });
});
// Delete
router.delete('/delete-panel/:id', (req, res) => {
  const panelId = req.params.id;
  if (!panelId) {  return res.status(400).json({ message: 'ไม่พบ panelId' }); }
  // Query to get mac_address from esp32 table
  const macAddressQuery = 'SELECT mac_address FROM esp32 WHERE panel_id = ?';
  db.query(macAddressQuery, [panelId], (err, macResult) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการดึง mac_address:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึง mac_address' });
      }
      if (macResult.length === 0) { return res.status(404).json({ message: 'ไม่พบแผงในระบบ' });}
      const mac_address = macResult[0].mac_address;
      // Delete panel
      const query = 'DELETE FROM panels WHERE id = ?';
      db.query(query, [panelId], (err, result) => {
          if (err) {
            console.error('เกิดข้อผิดพลาดในการลบแผง:', err);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบแผง' });
          }
          if (result.affectedRows === 0) { return res.status(404).json({ message: 'ไม่พบแผงในระบบ' }); }
          // Publish to MQTT topic
          client.publish(`clearCredential/${mac_address}`, '');
          console.log(`Publishing to topic: clearCredential/${mac_address}`);
          // Send response back to client
          res.status(200).json({ message: 'ลบข้อมูลแผงโซลาร์เซลล์แล้ว' });
      });
  });
});

module.exports = router; // Export the router