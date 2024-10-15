const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/report-data', (req, res) => {
  const { panelId, startDate} = req.body;
  let endDate = req.body.endDate;
  // ตรวจสอบ startDate และ endDate
  if (!startDate || !endDate) {
    return res.status(400).json({ message: "Start date and end date are required." });
  }

  // console.log(startDate); console.log(endDate);console.log('before');
  // ตรวจสอบว่า startDate และ endDate เท่ากัน
  if (startDate === endDate) {
    const endDateObject = new Date(endDate);
    endDateObject.setUTCDate(endDateObject.getUTCDate() + 1);
    endDateObject.setUTCHours(16, 59, 59, 999);
    endDate = endDateObject.toISOString(); // อัปเดตค่า endDate ให้เป็น adjustedEndDate
  }
  // console.log(startDate); console.log(endDate);console.log('after');

  // แปลง startDate และ endDate เป็น Date object
  const start = new Date(startDate);
  const end = new Date(endDate);

  // ระยะห่างเวลา 1 ชั่วโมงในหน่วย milliseconds
  const oneHour = 60 * 60 * 1000;

  const query = `
    SELECT power, current, voltage, light, temperature, UNIX_TIMESTAMP(timestamp) * 1000 AS timestamp
    FROM sensor_data
    WHERE panel_id = ? AND timestamp BETWEEN ? AND ?
    ORDER BY timestamp ASC
  `;

  db.query(query, [panelId, start, end], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    // เตรียมข้อมูลค่าเฉลี่ยสำหรับแต่ละช่วง 1 ชั่วโมง
    const formattedData = {
      light: [], temperature: [],
      current: [], voltage: [], power: []
    };

    // สร้างตัวแปรสำหรับเก็บผลเฉลี่ยในแต่ละช่วงเวลา
    let tempData = {
      light: 0, temperature: 0,
      current: 0, voltage: 0, power: 0,
      count: 0
    };
    let currentIntervalStart = start.getTime();

    results.forEach(row => {
      const dataTimestamp = row.timestamp;

      // ถ้าเกิน 1 ชั่วโมง ให้เก็บค่าเฉลี่ยและเริ่มคำนวณใหม่
      while (dataTimestamp >= currentIntervalStart + oneHour) {
        if (tempData.count > 0) {
          const averageTimestamp = new Date(currentIntervalStart).toISOString();
          formattedData.power.push({ x: averageTimestamp, y: tempData.power / tempData.count });
          formattedData.current.push({ x: averageTimestamp, y: tempData.current / tempData.count });
          formattedData.voltage.push({ x: averageTimestamp, y: tempData.voltage / tempData.count });
          formattedData.temperature.push({ x: averageTimestamp, y: tempData.temperature / tempData.count });
          formattedData.light.push({ x: averageTimestamp, y: tempData.light / tempData.count });
        }
        
        // เคลียร์ข้อมูลและตั้งค่าเริ่มต้นสำหรับช่วงถัดไป
        tempData = { light: 0, temperature: 0, current: 0, voltage: 0, power: 0, count: 0 };
        currentIntervalStart += oneHour;
      }

      // สะสมค่าข้อมูลในช่วงเวลาปัจจุบัน
      tempData.light += row.light;
      tempData.temperature += row.temperature;
      tempData.current += row.current;
      tempData.voltage += row.voltage;
      tempData.power += row.power;
      tempData.count += 1;
    });

    // จัดการช่วงสุดท้ายถ้ามีข้อมูลเหลืออยู่
    if (tempData.count > 0) {
      const averageTimestamp = new Date(currentIntervalStart).toISOString();
      formattedData.power.push({ x: averageTimestamp, y: tempData.power / tempData.count });
      formattedData.current.push({ x: averageTimestamp, y: tempData.current / tempData.count });
      formattedData.voltage.push({ x: averageTimestamp, y: tempData.voltage / tempData.count });
      formattedData.temperature.push({ x: averageTimestamp, y: tempData.temperature / tempData.count });
      formattedData.light.push({ x: averageTimestamp, y: tempData.light / tempData.count });
    }

    // เพิ่ม startDate และ endDate ลงในข้อมูลที่ส่งกลับ
    const startDateFormatted = start.toISOString();
    const endDateFormatted = end.toISOString();
    const startData = formattedData.power.find(data => data.x === startDateFormatted) || { x: startDateFormatted, y: null };
    const endData = formattedData.power.find(data => data.x === endDateFormatted) || { x: endDateFormatted, y: null };

    const result = {
      light: [startData, ...formattedData.light, endData],
      temperature: [startData, ...formattedData.temperature, endData],
      current: [startData, ...formattedData.current, endData],
      voltage: [startData, ...formattedData.voltage, endData],
      power: [startData, ...formattedData.power, endData],
    };

    // console.log(result);
    res.status(200).json(result);
  });
});


module.exports = router;
