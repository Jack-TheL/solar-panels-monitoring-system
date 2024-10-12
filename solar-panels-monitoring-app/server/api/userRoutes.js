const express = require('express');
const router = express.Router();
const db = require('../db');

/// NewUserView.vue ////
router.post('/add-user', (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Username, Email, password, and role are required.' });
  }
  console.log(req.body);
  const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
  db.query(query, [username, email, password, role], (err, results) => {
    if (err) {
      console.error('Error inserting user: ' + err);
      return res.status(500).json({ error: 'Error inserting user.' });
    }
    res.status(201).json({ message: 'User added successfully!', userId: results.insertId });
  });
});

/// EditUserView.vue ///
router.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({ message: 'ไม่พบ userID' });
  }
  const query = `SELECT * FROM users WHERE id = ?`;
  db.query(query, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }
    res.status(200).json(result[0]);
  });
});
/// update
router.put('/update-user/:id', (req, res) => {
  const userId = req.params.id;
  const { username, email, password, role } = req.body;
  console.log(username);
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Username, Email, password, and role are required.' });
  }
  if (!userId) { return res.status(400).json({ error: 'User ID is required.' }); }
  const query = 'UPDATE users SET username = ?, email = ?, password = ?, role = ? WHERE id = ?';
  db.query(query, [username, email, password, role, userId], (err, results) => {
    if (err) {
      console.error('Error updating user: ' + err);
      return res.status(500).json({ error: 'Error updating user.' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ message: 'User updated successfully!' });
  });
});
// delete
router.delete('/delete-user/:id', (req, res) => {
  const userId = req.params.id;
  if (!userId) { return res.status(400).json({ message: 'ไม่พบ userID' });}
  // ตรวจสอบสิทธิ์ของผู้ใช้ก่อนลบ
  const checkRoleQuery = 'SELECT role FROM users WHERE id = ?';
  db.query(checkRoleQuery, [userId], (err, result) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ของผู้ใช้:', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ของผู้ใช้' });
    }    
    // ถ้าไม่พบผู้ใช้ในระบบ
    if(result.length === 0) { return res.status(404).json({ message: 'ไม่พบผู้ใช้ในระบบ' });}
    const userRole = result[0].role;
    // ถ้าผู้ใช้เป็น admin ไม่ให้ลบ
    if (userRole === 'admin') { return res.status(403).json({ message: 'ไม่สามารถลบผู้ดูแลระบบได้' });}
    // ถ้าไม่ใช่ admin ให้ทำการลบ
    const deleteQuery = 'DELETE FROM users WHERE id = ?';
    db.query(deleteQuery, [userId], (err, result) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูลผู้ใช้:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
      }
      if (result.affectedRows === 0) { return res.status(404).json({ message: 'ไม่พบผู้ใช้ในระบบ' });}
      res.status(200).json({ message: 'ลบข้อมูลผู้ใช้เรียบร้อยแล้ว' });
    });
  });
});

module.exports = router; // Export the router