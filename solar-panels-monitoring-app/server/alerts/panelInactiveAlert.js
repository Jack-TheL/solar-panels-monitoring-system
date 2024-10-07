const { sendNotification } = require('../alertService');
const { sendEmailAlert } = require('./emailAlert');
const db = require('../db');

// ฟังก์ชันตรวจสอบการส่งข้อมูลจาก ESP32
async function checkMCUStatus() {
  console.log('ESP32 status checking routine has started');
  // ดึงค่าจาก alert_config
  const alertConfigQuery = `
    SELECT mcu_disconnect_enabled, mcu_disconnect_delay,
      system_alert_enabled, system_alert_delay, email_alert_enabled
    FROM alert_config LIMIT 1`;
  const [alertConfig] = await db.promise().query(alertConfigQuery);
  if (alertConfig.length === 0 || (!alertConfig[0].mcu_disconnect_enabled && !alertConfig[0].system_alert_enabled)) {
    console.log('การตรวจสอบสถานะ MCU ถูกปิด');
    return;
  }
  if (alertConfig[0].system_alert_enabled) {
    alertConfig[0].mcu_disconnect_delay = alertConfig[0].system_alert_delay;
  }

  const mcuDisconnectDelay = alertConfig[0].mcu_disconnect_delay;
  const delayThreshold = new Date(Date.now() - mcuDisconnectDelay * 1000);

  // ดึงข้อมูล timestamp ล่าสุดของทุก panel_id จาก sensor_data
  const latestDataQuery = `
    SELECT panel_id, MAX(timestamp) AS last_timestamp 
    FROM sensor_data 
    GROUP BY panel_id
  `;
  const [latestData] = await db.promise().query(latestDataQuery);

   // ตรวจสอบว่า panel_id ไหนที่ยังส่งข้อมูลอยู่ภายในช่วงเวลาที่กำหนด และอัปเดตสถานะ
   const activePanels = latestData.filter(({ last_timestamp }) => last_timestamp >= delayThreshold);
   if(activePanels.length > 0) {
    isOperating(activePanels);
  }

  // ตรวจสอบว่า panel_id ไหนที่หยุดส่งข้อมูลนานเกิน mcu_disconnect_delay
  const inactivePanels = latestData.filter(({ last_timestamp }) => last_timestamp < delayThreshold);  
  if (inactivePanels.length > 0) {
    for (const { panel_id } of inactivePanels) {
      // ดึง user_id จาก panel_id
      const userIdQuery = 'SELECT user_id, name, status FROM panels WHERE id = ?';
      const [userResults] = await db.promise().query(userIdQuery, [panel_id]);
      if (!userResults[0].status) { continue; }
      
      if (userResults.length > 0) {
        const userId = userResults[0].user_id;
        const panelName = userResults[0].name;
        const title = 'แผงโซล่าเซลล์ขาดการเชื่อมต่อ'
        const message = `Panel Name: ${panelName} หยุดส่งข้อมูลนานเกิน ${mcuDisconnectDelay >= 60 ? `${mcuDisconnectDelay / 60} นาที` : `${mcuDisconnectDelay} วินาที`}`;
        const dateTime = new Date().toLocaleString();
        console.log("Send Alerts");
        // ส่งการแจ้งเตือนหน้าเว็บ
        sendNotification({
          title: title,
          message: message,
          dateTime: dateTime,
          userId: userId
        });
        //สำหรับการส่งอีเมล
        if(alertConfig[0].email_alert_enabled || alertConfig[0].system_alert_enabled){
          await sendEmailAlert(userId, title, message);
        }
        // บันทึกการแจ้งเตือนลงใน alert_history
        console.log("Panel offline alert saved");
        const insertAlertQuery = `
          INSERT INTO alert_log (title, message, user_id) 
          VALUES (?, ?, ?)`;
        await db.promise().query(insertAlertQuery, [title, message, userId]);
        // อัปเดตสถานะของ panel เป็น false
        console.log(`Turn panel ${panel_id} status to offline Mode`);
        const updateStatusQuery = `
          UPDATE panels 
          SET status = false 
          WHERE id = ?`;
        await db.promise().query(updateStatusQuery, [panel_id]);
      }
    }
  } else { console.log('No Panel Lost Connections'); }
}

async function isOperating(activePanels){
  for (const { panel_id } of activePanels) {
    const statusQuery = 'SELECT status FROM panels WHERE id = ?';
    const [statusResults] = await db.promise().query(statusQuery, [panel_id]);
    if (statusResults[0].status) { continue;}
    const updateStatusQuery = `
      UPDATE panels 
      SET status = true  
      WHERE id = ?`;
    try {
      await db.promise().query(updateStatusQuery, [panel_id]);
      console.log(`Turn panel ${panel_id} status to online Mode`);
    } catch (error) { console.error(`ไม่สามารถอัปเดตสถานะของแผง ${panel_id} ได้:`, error);}
  }
}

// เรียกใช้ฟังก์ชันทุกๆ 5 นาที 5*60*1000
setInterval(checkMCUStatus, 5*60*1000);
