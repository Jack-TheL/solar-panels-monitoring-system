const express = require('express');
const router = express.Router();
const db = require('../db');

/// LoginView.vue ///
router.post('/login', (req, res) => {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    console.log(req.body);
    const query = `
      SELECT * FROM users 
      WHERE (username = ? OR email = ?) AND password = ?
    `;
    db.query(query, [usernameOrEmail, usernameOrEmail, password], (err, result) => {
      if (err) return res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
      if (result.length === 0) {
       return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }
      const user = result[0];
      const { password, ...userData } = user;
      res.status(200).json({ user: userData, success: true });
    });
});

/// LoginHistoryView.vue ///
router.get('/login-history', (req, res) => {
  const { userId, role } = req.query;
  let query; let params = [];
  if (role === 'admin') {
    query = `
      SELECT users.username, users.email, login_history.user_id, login_history.timestamp, login_history.login
      FROM users
      JOIN login_history ON users.id = login_history.user_id
      ORDER BY login_history.timestamp DESC
    `;
  } else if (role === 'user') {
    // สำหรับ user ให้ดึงข้อมูลของตัวเองเท่านั้น
    query = `
      SELECT users.username, users.email, login_history.timestamp, login_history.login
      FROM users
      JOIN login_history ON users.id = login_history.user_id
      WHERE users.id = ?
      ORDER BY login_history.timestamp DESC
    `;
    params.push(userId);  // เพิ่ม userId เข้าไปใน query parameter
  } else {
    return res.status(400).json({ message: 'Invalid role' });
  }
  // ทำการ query ข้อมูล
  db.query(query, params, (err, results) => {
    if (err) { return res.status(500).json({ message: 'Database error', error: err });}
    res.status(200).json(results);  // ส่งผลลัพธ์กลับเป็น JSON
  });
});

/// Save Login/Logout History ///
router.post('/save-history', (req, res) => {
    const { login, userId } = req.body;
    const timestamp = new Date();
    const query = `
      INSERT INTO login_history (login, user_id, timestamp) 
      VALUES (?, ?, ?)
    `;
    db.query(query, [login, userId, timestamp], (err) => {
      if (err) return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกประวัติ' });
      res.status(201).json({ message: 'บันทึกประวัติสำเร็จ' });
    });
});

module.exports = router; // Export the router