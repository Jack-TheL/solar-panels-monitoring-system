const nodemailer = require('nodemailer');
require('dotenv').config(); // นำเข้า dotenv

// ฟังก์ชันส่งอีเมล
async function sendEmail(to, subject, text) {
  // ตั้งค่าผู้ให้บริการอีเมล
  const transporter = nodemailer.createTransport({
    // gmail for 
    host: 'smtp-mail.outlook.com', // SMTP server ของคุณ
    port: 587, // หรือ 465 สำหรับ SSL
    secure: false, // ถ้าใช้ 465 ให้เปลี่ยนเป็น true
    auth: {
      user: process.env.EMAIL_USER, // อีเมลจากไฟล์ .env
      pass: process.env.EMAIL_PASS // รหัสผ่านจากไฟล์ .env
    }
  });

  // ข้อมูลอีเมล
  const mailOptions = {
    from: `"Your Name" <${process.env.EMAIL_USER}>`, // ชื่อและอีเมลผู้ส่ง
    to: to, // ที่อยู่อีเมลผู้รับ
    subject: subject, // หัวข้ออีเมล
    text: text // ข้อความอีเมล
  };

  // ส่งอีเมล
  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = { sendEmail };
