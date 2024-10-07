const express = require('express');
const router = express.Router();
const db = require('../db');

// สร้าง API สำหรับการ insert ค่า default เข้าไปใน alert_config
router.post('/alert-config', (req, res) => {
    const checkSql = 'SELECT * FROM alert_config LIMIT 1'; // คำสั่ง SQL เพื่อตรวจสอบว่ามีแถวในตารางหรือไม่
    db.query(checkSql, (error, results) => {
      if (error) {
        console.error('Error checking alert_config table:', error);
        return res.status(500).json({ message: 'Error checking alert_config table.' });
      }
      if (results.length > 0) {
        // ถ้ามีแถวในตาราง ให้ดึงแถวแรก
        const alertConfig = results[0];
        console.log("Fetced data successfully");
        // console.log(results[0]);
        return res.status(200).json(alertConfig);
      } else {
        // ถ้าไม่มีแถวในตาราง ให้แทรกค่าเริ่มต้น
        const insertSql = 'INSERT INTO alert_config () VALUES ()';
        db.query(insertSql, (insertError, insertResults) => {
          if (insertError) {
            console.error('Error inserting default values:', insertError);
            return res.status(500).json({ message: 'Error inserting default values.' });
          }
          console.log("Default configuration inserted successfully.");
          // ดึงแถวแรกหลังจากแทรก
          db.query(checkSql, (fetchError, fetchResults) => {
            if (fetchError) {
              console.error('Error fetching inserted alert_config:', fetchError);
              return res.status(500).json({ message: 'Error fetching inserted alert_config.' });
            }
            console.log("Created and Fetced data successfully");
            const alertConfig = fetchResults[0];
            return res.status(201).json(alertConfig);
          });
        });
      }
    });
  });
  
// API สำหรับอัปเดตค่าการตั้งค่า
router.put('/alert-config/update', (req, res) => {
    const settings = req.body; // รับค่าจาก body
    const sql = 'UPDATE alert_config SET ?'; // ใช้คำสั่ง UPDATE
    db.query(sql, settings, (err, results) => {
      if (err) {
        console.error('Error updating settings:', err);
        return res.status(500).send('Error updating settings');
      }
      res.status(200).json(settings); // ส่งค่าที่อัปเดตกลับ
    });
});

// สร้าง API ดึงข้อมูล alert_log
router.get('/alerts/:role/:userId', async (req, res) => {
    const { role, userId } = req.params;
    try {
      // SQL สำหรับดึงข้อมูล
      let query;
      let queryParams = [];
      if (role === 'admin') {
        // ถ้าเป็น admin ดึงข้อมูลทั้งหมดจาก alert_log พร้อม email จาก users
        query = `
          SELECT alert_log.title, alert_log.timestamp, alert_log.message, users.email
          FROM alert_log 
          JOIN users ON alert_log.user_id = users.id
        `;
      } else if (role === 'user') {
        // ถ้าเป็น user ดึงเฉพาะข้อมูลของ user_id นั้นๆ
        query = `
          SELECT title, timestamp, message
          FROM alert_log 
          WHERE user_id = ?
        `;
        queryParams = [userId]; // ส่ง user_id เป็นตัวแปร
      } else {
        return res.status(400).json({ error: 'Invalid role' });
      }
      // ดึงข้อมูลจากฐานข้อมูล
      const [results] = await db.promise().query(query, queryParams);
      // ส่งข้อมูลกลับไปให้ client
      res.status(200).json(results);
    } catch (error) {
      console.error('Error fetching alert logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; // Export the router
