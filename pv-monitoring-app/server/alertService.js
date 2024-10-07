const WebSocket = require('ws');

let notificationClients = []; // เก็บ clients ที่เชื่อมต่อ WebSocket

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      const { userId } = JSON.parse(message); // ดึง userId จากข้อความที่ส่งมา
      // เก็บ client พร้อม userId
      notificationClients.push({ ws, userId });
      console.log(`New client connected with userId: ${userId}`);

      ws.on('close', () => {
        // ลบ client ออกจาก notificationClients เมื่อปิดการเชื่อมต่อ
        notificationClients = notificationClients.filter(client => client.ws !== ws);
      });
    });
  });
}

// ฟังก์ชันส่งการแจ้งเตือนให้ WebSocket client เฉพาะ userId
function sendNotification(notification) {
  notificationClients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      // เช็คว่า userId ตรงกันไหม
      if (client.userId === notification.userId) {
        client.ws.send(JSON.stringify(notification));
      }
    }
  });
}

module.exports = { setupWebSocket, sendNotification };

/////////// BroadCast Alerts
// const WebSocket = require('ws');

// let notificationClients = []; // เก็บ clients ที่เชื่อมต่อ WebSocket

// function setupWebSocket(server) {
//   const wss = new WebSocket.Server({ server });

//   wss.on('connection', (ws) => {
//     notificationClients.push(ws);
//     console.log('New client connected');
//     ws.on('close', () => {
//       notificationClients = notificationClients.filter(client => client !== ws);
//     });
//   });
// }

// // ฟังก์ชันส่งการแจ้งเตือนให้ทุก WebSocket client
// function sendNotification(notification) {
//   notificationClients.forEach(client => {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(JSON.stringify(notification));
//     }
//   });
// }

// module.exports = { setupWebSocket, sendNotification };