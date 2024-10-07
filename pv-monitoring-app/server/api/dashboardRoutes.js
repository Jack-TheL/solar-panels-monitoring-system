const express = require('express');
const router = express.Router();
const {liveData } = require('../mqttClient');
const db = require('../db');

/// DashboardView.vue (LiveCardData)///
router.get('/live-data/:selectedPanelId', (req, res) => {
    const panelId = req.params.selectedPanelId;
    // console.log(panelId);
    const query = `SELECT mac_address FROM esp32 WHERE panel_id = ?`;
    db.query(query, [panelId], (err, results) => {
        if (err) { return res.status(500).json({ message: "Database error", error: err });}
        if (results.length > 0) { 
            mac_address = results[0].mac_address;
            // console.log("Livde Data",liveData[mac_address].power);
            // if(liveData[mac_address]){console.log(liveData[mac_address].power);}
            res.status(200).json(liveData[mac_address]);
        }
        else {res.status(404).json({ message: "MAC Address not found" });}
    });
});
/// DashboardView.vue (Chart init)///
router.get('/dashboard-chart/:selectedPanelId', (req, res) => {
    const panelId = req.params.selectedPanelId;
    // แก้ไข query เพื่อดึงข้อมูล 90 อันล่าสุด
    const query = `SELECT * FROM sensor_data WHERE panel_id = ? ORDER BY timestamp DESC LIMIT 90`;
    db.query(query, [panelId], (err, results) => {
        if (err) { 
            console.error("Error fetching data:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }
        if (results.length > 0) { 
            const formattedData = { power: [], voltage: [], current: [], temperature: [], light: [] }; 
            // เราจะทำการ reverse() เพื่อเปลี่ยนให้ข้อมูลเรียงจากเก่ามาใหม่
            results.reverse().forEach(data => {
                const timestamp = new Date(data.timestamp).getTime(); // แปลง timestamp เป็น getTime()
                formattedData.power.push({ x: timestamp, y: data.power });
                formattedData.voltage.push({ x: timestamp, y: data.voltage });
                formattedData.current.push({ x: timestamp, y: data.current });
                formattedData.temperature.push({ x: timestamp, y: data.temperature });
                formattedData.light.push({ x: timestamp, y: data.light });
            });
            // console.log(formattedData);
            res.status(200).json(formattedData);
        } else { // console.log("here");
            res.status(404).json({ message: "No data found for the selected panel ID" });
        }
    });
});
// PanelSelect.vue //
router.get('/select-panel', (req, res) => {
    const { userId, role } = req.query;
    let query, queryParams = [];
    if (role === 'admin') {
        query = `
            SELECT panels.id, panels.name, users.email 
            FROM panels 
            JOIN users ON panels.user_id = users.id
        `;
    } else if (role === 'user') {
        query = `
            SELECT id, name 
            FROM panels 
            WHERE user_id = ?
        `;
        queryParams = [userId];
    } else { return res.status(403).json({ message: 'Invalid role' });}
    db.query(query, queryParams, (err, results) => {
        if (err) {  return res.status(500).json({ message: 'Database error', error: err });}
        // console.log(results)
        res.status(200).json(results);
    });
});

module.exports = router; // Export the router
