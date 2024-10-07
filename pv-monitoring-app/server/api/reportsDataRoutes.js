const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/report-data', (req, res) => {
  const { panelId, startDate, endDate } = req.body;
  // แปลง startDate และ endDate เป็น timestamp
  const startTimestamp = new Date(startDate).getTime();
  const endTimestamp = new Date(endDate).getTime();
  // ระยะห่างเวลา 1 ชั่วโมงในหน่วย milliseconds
  const oneHour = 60 * 60 * 1000;
  const query = `
    SELECT power, current, voltage, light, temperature, timestamp
    FROM sensor_data
    WHERE panel_id = ? AND timestamp BETWEEN ? AND ?
    ORDER BY timestamp ASC
  `;
  db.query(query, [panelId, startDate, endDate], (err, results) => {
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
    let currentIntervalStart = startTimestamp;
    results.forEach(row => {
      const dataTimestamp = new Date(row.timestamp).getTime();
      // ถ้าเกิน 1 ชั่วโมง ให้เก็บค่าเฉลี่ยและเริ่มคำนวณใหม่
      while (dataTimestamp >= currentIntervalStart + oneHour) {
        if (tempData.count > 0) {
          // หาค่าเฉลี่ยในช่วงที่ผ่านมา
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
    const startDateFormatted = new Date(startDate).toISOString(); // แปลง startDate เป็น ISO 8601
    const endDateFormatted = new Date(endDate).toISOString(); // แปลง endDate เป็น ISO 8601
    // ตรวจสอบว่ามีข้อมูลตรงกับ startDate และ endDate หรือไม่
    const startData = formattedData.power.find(data => data.x === startDateFormatted) || { x: startDateFormatted, y: null };
    const endData = formattedData.power.find(data => data.x === endDateFormatted) || { x: endDateFormatted, y: null };
    // สร้างผลลัพธ์ใหม่ที่รวม startDate และ endDate
    const result = {
      light: [startData, ...formattedData.light, endData],
      temperature: [startData, ...formattedData.temperature, endData],
      current: [startData, ...formattedData.current, endData],
      voltage: [startData, ...formattedData.voltage, endData],
      power: [startData, ...formattedData.power, endData],
    };
    // ส่งข้อมูลกลับ
    // console.log(result);
    console.log(result);
    res.status(200).json(result);
  });
});

module.exports = router;
