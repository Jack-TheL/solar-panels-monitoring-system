const {liveData } = require('../mqttClient');
const express = require('express');
const router = express.Router();
const db = require('../db');

// HomeView Selected Panel
router.get('/panel-home', async (req, res) => {
  const panelId = req.query.panelId;
  const temp = req.query.temp;
  try {
    // Query Pmax จากตาราง panels
    const pmaxQuery = `SELECT Pmax FROM panels WHERE id = ?`;
    const [pmaxResult] = await db.promise().query(pmaxQuery, [panelId]);
    const Pmax = pmaxResult.length > 0 ? pmaxResult[0].Pmax : 0;
    // Query power และ timestamps ทุกแถวจากตาราง sensor_data
    const powerQuery = `SELECT power, timestamp FROM sensor_data WHERE panel_id = ? ORDER BY timestamp ASC`;
    const [powerResult] = await db.promise().query(powerQuery, [panelId]);
    if (powerResult.length === 0) {
      return res.status(404).json({ Pmax:Pmax, message: "No power data found" });
    }
    // คำนวณค่าเฉลี่ยของ power
    const totalPower = powerResult.reduce((sum, row) => sum + row.power, 0);
    const avgPower = (totalPower / powerResult.length) / 1000;
    // หาช่วงเวลาจากข้อมูลเก่าสุดถึงใหม่สุด
    const firstTimestamp = new Date(powerResult[0].timestamp);
    const lastTimestamp = new Date(powerResult[powerResult.length - 1].timestamp);
    const timeDifferenceHours = (lastTimestamp - firstTimestamp) / (1000 * 60 * 60); // คำนวณเป็นชั่วโมง
    // คำนวณพลังงานที่ใช้ในหน่วย kWh (avgPower x ชั่วโมง)
    // console.log("avgPower", avgPower, "time", timeDifferenceHours)
    const totalEnergy = avgPower * timeDifferenceHours;
    // Query min_temp และ max_temp จากตาราง esp32
    const tempQuery = `SELECT min_temp, max_temp, fan_lv1, fan_lv2, fan_lv3 FROM esp32 WHERE panel_id = ?`;
    const [tempResult] = await db.promise().query(tempQuery, [panelId]);
    let fanSpeed = 'fan_lv1'; // ค่าเริ่มต้นของ fan_speed
    if (tempResult.length > 0) {
      const { min_temp, max_temp, fan_lv1, fan_lv2, fan_lv3 } = tempResult[0];
      if (temp < min_temp) { fanSpeed = fan_lv1;}
      else if (temp > max_temp) { fanSpeed = fan_lv3;} 
      else if( temp>min_temp && temp<max_temp){fanSpeed = fan_lv2;} 
      else { fanSpeed='N/A' }
    }
    // ตอบกลับข้อมูลที่ได้ในรูปแบบ JSON
    res.status(200).json({
      Pmax: Pmax,
      totalEnergy: totalEnergy.toFixed(2), // พลังงานที่ใช้ในหน่วย kWh
      fanSpeed: fanSpeed
    });
  } catch (error) {
    console.error('Error fetching panel-home data:', error);
    res.status(500).json({ message: 'Error fetching panel-home data', error: error });
  }
});

// Summary admin
router.get('/summary/admin', (req, res) => {
  // คำสั่ง SQL เพื่อหาจำนวนแถวที่มี attached เป็น true และหาผลรวมของ Pmax
  const panelQuery = `
    SELECT COUNT(e.id) AS totalAttachedPanels, 
           SUM(COALESCE(p.Pmax, 0)) AS totalPmax 
    FROM esp32 e
    JOIN Panels p ON e.panel_id = p.id
    WHERE e.attached = true
  `;
  db.query(panelQuery, (err, panelResults) => {
      if (err) {
          console.error('Error executing panel query:', err);
          res.status(500).json({ error: 'Database query failed' });
          return;
      }
      const sensorQuery = `
        SELECT panel_id, AVG(power) AS avgPower,
               MIN(timestamp) AS firstTimestamp,
               MAX(timestamp) AS lastTimestamp
        FROM sensor_data
        GROUP BY panel_id
      `;    
      db.query(sensorQuery, (err, sensorResults) => {
          if (err) {
              console.error('Error executing sensor query:', err);
              res.status(500).json({ error: 'Database query failed' });
              return;
          }
          let totalWh = 0;
          // คำนวณ Wh สำหรับแต่ละ panel_id
          sensorResults.forEach(row => {
              const avgPower = row.avgPower || 0;
              const firstTimestamp = new Date(row.firstTimestamp);
              const lastTimestamp = new Date(row.lastTimestamp);
              // คำนวณชั่วโมงระหว่างข้อมูลเก่าสุดและใหม่สุด
              const timeDiffHours = (lastTimestamp - firstTimestamp) / (1000 * 60 * 60);
              // คำนวณ Wh สำหรับ panel_id นั้น
              const panelWh = (avgPower / 1000) * timeDiffHours;
              // รวม Wh ของแต่ละ panel_id
              totalWh += panelWh;
          });
          res.json({
              totalAttachedPanels: panelResults[0].totalAttachedPanels,
              totalPmax: panelResults[0].totalPmax,
              totalWh: totalWh.toFixed(2)
          });
      });
  });
});

// Summary User
router.get('/summary/:id', (req, res) => {
    const userId = req.params.id;
    const panelQuery = `
    SELECT COUNT(e.id) AS totalAttachedPanels, 
           SUM(COALESCE(p.Pmax, 0)) AS totalPmax 
    FROM esp32 e
    JOIN Panels p ON e.panel_id = p.id
    WHERE e.attached = true AND user_id = ?
  `;
    db.query(panelQuery, [userId], (err, panelResults) => {
        if (err) {
            console.error('Error executing panel query:', err);
            res.status(500).json({ error: 'Database query failed' });
            return;
        }
        const sensorQuery = `
          SELECT panel_id, AVG(power) AS avgPower,
                 MIN(timestamp) AS firstTimestamp,
                 MAX(timestamp) AS lastTimestamp
          FROM sensor_data
          WHERE panel_id IN (SELECT id FROM Panels WHERE user_id = ?)
          GROUP BY panel_id
        `;
        db.query(sensorQuery, [userId], (err, sensorResults) => {
            if (err) {
                console.error('Error executing sensor query:', err);
                res.status(500).json({ error: 'Database query failed' });
                return;
            }
            let totalWh = 0;
            // คำนวณ Wh สำหรับแต่ละ panel_id
            sensorResults.forEach(row => {
                const avgPower = row.avgPower || 0;
                const firstTimestamp = new Date(row.firstTimestamp);
                const lastTimestamp = new Date(row.lastTimestamp);
                // คำนวณชั่วโมงระหว่างข้อมูลเก่าสุดและใหม่สุด
                const timeDiffHours = (lastTimestamp - firstTimestamp) / (1000 * 60 * 60);
                // คำนวณ Wh สำหรับ panel_id นั้น
                const panelWh = (avgPower / 1000) * timeDiffHours;
                // รวม Wh ของแต่ละ panel_id
                totalWh += panelWh;
            });
            res.json({
                totalAttachedPanels: panelResults[0].totalAttachedPanels,
                totalPmax: panelResults[0].totalPmax,
                totalWh: totalWh.toFixed(2)
            });
        });
    });
});
// HomeAllPowerChart.vue (admin)///
router.get('/total-power-init/admin', (req, res) => {
  const query = `
      SELECT panel_id, power, timestamp
      FROM sensor_data
      WHERE timestamp >= NOW() - INTERVAL 30 MINUTE
      ORDER BY timestamp ASC
  `;
  db.query(query, (err, results) => {
      if (err) {return res.status(500).json({ message: 'Database error', error: err });}
      const combinedData = [];
      const timeBuckets = {};
      // จัดกลุ่มข้อมูลตาม timestamp (ภายใน 1 นาที)
      results.forEach((data) => {
          const timestamp = new Date(data.timestamp);
          const roundedTimestamp = new Date(
              Math.floor(timestamp.getTime() / (1000 * 60)) * (1000 * 60)
          ); // ปัด timestamp ให้เป็นนาทีที่ใกล้ที่สุด
          const key = roundedTimestamp.getTime(); // ใช้ timestamp ที่ปัดแล้วเป็น key
          if (!timeBuckets[key]) {
              timeBuckets[key] = { timestamp: roundedTimestamp, totalPower: 0 };
          }
          timeBuckets[key].totalPower += data.power;
      });
      // แปลง timeBuckets เป็น array of objects { x: UNIX timestamp, y: totalPower }
      for (const key in timeBuckets) {
          combinedData.push({
              x: timeBuckets[key].timestamp.getTime(), // แปลง timestamp เป็น UNIX timestamp
              y: timeBuckets[key].totalPower/1000
          });
      }
      // ส่งข้อมูลกลับในรูปแบบ array of objects
      // console.log(combinedData);
      res.status(200).json(combinedData); 
  });
});
router.get('/total-power-live/admin', async (req, res) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const query = `SELECT mac_address FROM esp32 WHERE attached = true`;
    db.query(query, (err, results) => {
      if (err) { return res.status(500).json({ message: "Database error", error: err });}
      if (results.length > 0) {
        let totalPower = 0;
        // ลูปผ่านทุก mac_address
        results.forEach(row => {
          const mac_address = row.mac_address;
          // ตรวจสอบว่า liveData[mac_address] มีอยู่และ power เป็นเลขจริงหรือไม่
          if (liveData[mac_address] && typeof liveData[mac_address].power === 'number') {
            totalPower += liveData[mac_address].power;
          }
        });
        // console.log(`System Power = ${totalPower}`);
        // ส่งค่าที่รวมกลับไป
        res.status(200).json(totalPower);
      } else { res.status(404).json({ message: "No attached MAC Addresses found" });}
    });
  } catch (error) {
    console.error('Error fetching total power:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});
// HomeAllPowerChart.vue (User) ///
router.get('/total-power-init/:userId', (req, res) => {
  const userId = req.params.userId; // รับ userId จาก params
  const query = `
      SELECT sd.panel_id, sd.power, sd.timestamp
      FROM sensor_data sd
      JOIN panels p ON sd.panel_id = p.id
      WHERE sd.timestamp >= NOW() - INTERVAL 30 MINUTE
      AND p.user_id = ?
      ORDER BY sd.timestamp ASC
  `;
  db.query(query, [userId], (err, results) => {
      if (err) {return res.status(500).json({ message: 'Database error', error: err });}
      const combinedData = [];
      const timeBuckets = {};
      // จัดกลุ่มข้อมูลตาม timestamp (ภายใน 1 นาที)
      results.forEach((data) => {
          const timestamp = new Date(data.timestamp);
          const roundedTimestamp = new Date(
              Math.floor(timestamp.getTime() / (1000 * 60)) * (1000 * 60)
          ); // ปัด timestamp ให้เป็นนาทีที่ใกล้ที่สุด
          const key = roundedTimestamp.getTime(); // ใช้ timestamp ที่ปัดแล้วเป็น key
          if (!timeBuckets[key]) {
              timeBuckets[key] = { timestamp: roundedTimestamp, totalPower: 0 };
          }
          timeBuckets[key].totalPower += data.power;
      });
      // แปลง timeBuckets เป็น array of objects { x: UNIX timestamp, y: totalPower }
      for (const key in timeBuckets) {
          combinedData.push({
              x: timeBuckets[key].timestamp.getTime(), // แปลง timestamp เป็น UNIX timestamp
              y: timeBuckets[key].totalPower / 1000
          });
      }
      // ส่งข้อมูลกลับในรูปแบบ array of objects
      res.status(200).json(combinedData); 
  });
});
router.get('/total-power-live/:userId', async (req, res) => {
  const userId = req.params.userId; 
  try {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const query = `
      SELECT e.mac_address 
      FROM esp32 e
      JOIN panels p ON e.panel_id = p.id
      WHERE p.user_id = ? AND e.attached = true
    `;
    db.query(query, [userId], (err, results) => {
      if (err) {  return res.status(500).json({ message: "Database error", error: err });}
      if (results.length > 0) {
        let totalPower = 0;
        // ลูปผ่านทุก mac_address
        results.forEach(row => {
          const mac_address = row.mac_address;
          // ตรวจสอบว่า liveData[mac_address] มีอยู่และ power เป็นเลขจริงหรือไม่
          if (liveData[mac_address] && typeof liveData[mac_address].power === 'number') {
            totalPower += liveData[mac_address].power;
          }
        });
        // ส่งค่าที่รวมกลับไป
        res.status(200).json(totalPower);
      } else { res.status(404).json({ message: "No attached MAC Addresses found" });}
    });
  } catch (error) {
    console.error('Error fetching total power:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

module.exports = router; // Export the router