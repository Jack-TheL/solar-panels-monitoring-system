const {sendNotification} = require('../alertService');
const { sendEmailAlert } = require('./emailAlert');
const db = require('../db');

// flags
let isOverheatAlertTriggered = false; 
let isPanelFailAlerTriggred = false;
let isSensorsFailAlerttriggred = false;

/////////////// ฟังก์ชันตรวจสอบและสร้างการแจ้งเตือน ///////////// Main
async function checkAlerts(sensorData, macAddress) {
  // ดึงข้อมูลการแจ้งเตือนจากตาราง alert_config
  const alertQuery = 'SELECT * FROM alert_config LIMIT 1'; // สมมติว่ามีแค่ 1 แถว
  const [alertConfig] = await db.promise().query(alertQuery);
  if (alertConfig.length === 0) {
    console.log('No alert configuration found.');
    return;
  } const alertSettings = alertConfig[0];
  if(alertSettings.system_alert_enabled){
    const enabled = alertSettings.system_alert_enabled;
    const delay =  alertSettings.system_alert_delay; 
    alertSettings.over_heat_alert_enabled = enabled; 
    alertSettings.over_heat_alert_delay = delay; 
    alertSettings.panel_fail_enabled = enabled;
    alertSettings.panel_fail_delay = delay;
    alertSettings.sensor_fail_alert_enabled = enabled;
    alertSettings.sensor_fail_alert_delay = delay; 
  } 

  // ดึงข้อมูลจากตาราง esp32
  const query = 'SELECT panel_id, max_temp, min_light FROM esp32 WHERE mac_address = ?';
  const [results] = await db.promise().query(query, [macAddress]);
  if (results.length === 0) {
    console.log(`No settings found for MAC: ${macAddress}`);
    return;
  } const { panel_id, max_temp, min_light } = results[0];
  const { temperature, light, power } = sensorData;

  // ดึงข้อมูลจากตาราง panels
  const userIdQuery = 'SELECT user_id, name FROM panels WHERE id = ?';
  const [userResults] = await db.promise().query(userIdQuery, [panel_id]);
  if(userResults.length === 0) {
    console.log('User of this panel not Found');
    return;
  }
  const userId = userResults[0].user_id;
  const panelName = userResults[0].name;

  // ตรวจสอบการแจ้งเตือนแต่ละประเภท
  if(alertSettings.over_heat_alert_enabled && temperature >= max_temp){
    if(!isOverheatAlertTriggered){
      isOverheatAlertTriggered = true;
      checkOverHeatAlert(sensorData, alertSettings, panelName, userId);
    }
  }
  if(alertSettings.panel_fail_enabled && min_light && light>=min_light && power<1){
    if(!isPanelFailAlerTriggred){
      isPanelFailAlerTriggred = true;
      checkPanelFailAlert(sensorData, alertSettings, panelName, userId);
    }
  }
  if(alertSettings.sensor_fail_alert_enabled && (light < 0 || temperature <= -127 || power <= -210)){
    if(!isSensorsFailAlerttriggred){
      isSensorsFailAlerttriggred = true;
      checkSensorFailAlert(sensorData, alertSettings, panelName, userId);
    }
  }
}

///////////////////// Check Alerts Function ///////////////////
// ฟังก์ชันแจ้งเตือนอุณหภูมิสูง
function checkOverHeatAlert(sensorData, alertSettings, panelName, userId) {
  const { temperature } = sensorData;
  const title = 'อุณหภูมิสูงเกินกำหนด';
  const message = `Panel name: ${panelName} อุณหภูมิสูง ${temperature}°C`,
  dateTime = new Date().toLocaleString();
  setTimeout(async () => {
    sendNotification({
      userId: userId,
      title: title,
      message: message,
      dateTime: dateTime,
    });
    if(alertSettings.email_alert_enabled || alertSettings.system_alert_enabled){
        await sendEmailAlert(userId, title, message);
    }
    insertAlertLog(title, message, userId)
    isOverheatAlertTriggered = false;
  }, alertSettings.over_heat_alert_delay*1000);
}

// ฟังก์ชันแจ้งเตือนแสงสูงแต่ไม่มีกำลังไฟ
function checkPanelFailAlert(sensorData, alertSettings, panelName, userId) {
  const { light, power } = sensorData;
  const title = 'แผงได้รับแสงแดดตามค่าที่กำหนดไว้ แต่ไม่มีการผลิตไฟฟ้า'
  const message = `Panel Name: ${panelName} ได้รับแสงประมาณ ${light} lx แต่มีกำลังไฟ ${power} mW`
  dateTime = new Date().toLocaleString();
  setTimeout(async () => {
    sendNotification({
        userId: userId,
        title: title,
        message: message,
        dateTime: dateTime,
    });
    if(alertSettings.email_alert_enabled || alertSettings.system_alert_enabled){
        await sendEmailAlert(userId, title, message);
    }
    insertAlertLog(title, message, userId)
    isPanelFailAlerTriggred = false;
  }, alertSettings.panel_fail_delay*1000);
} 

// ฟังก์ชันแจ้งเตือนเซนเซอร์ผิดปกติ
function checkSensorFailAlert(sensorData, alertSettings, panelName, userId) {
  const { light, temperature, power } = sensorData;
  const title = 'เซ็นเซอร์ขาดการเชือมต่อ';
  dateTime = new Date().toLocaleString();
  let message = `Panel name: ${panelName} `
  if(power <= -210) { message += 'กระแสและแรงดันเซ็นเซอร์ ';}
  if(temperature <= -127) {message += 'อุณหภูมิเซ็นเซอร์ ';}
  if(light < 0) {message += 'ความเข้มแสงเซ็นเซอร์ '}
  message += 'ขาดการเชื่อมต่อ'
  setTimeout(async () => {
    sendNotification({
      userId: userId,
      title: title,
      message: message,
      dateTime: dateTime,
    });
    if(alertSettings.email_alert_enabled || alertSettings.system_alert_enabled){
        await sendEmailAlert(userId, title, message);
    }
    insertAlertLog(title, message, userId)
    isSensorsFailAlerttriggred = false;
  }, alertSettings.sensor_fail_alert_delay*1000);
}

// บันทึกการแจ้งเตือนลงใน alert_history
async function insertAlertLog(title, message, userId){
    const insertAlertQuery = `
      INSERT INTO alert_log (title, message, user_id) 
      VALUES (?, ?, ?)`;
    await db.promise().query(insertAlertQuery, [title, message, userId]);
    console.log("Save Alerts Activity");
}

module.exports = { checkAlerts };