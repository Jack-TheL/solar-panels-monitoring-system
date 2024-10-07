const db = require('../db'); // นำเข้าโมดูลฐานข้อมูล
const { sendEmail } = require('../emailService');

async function sendEmailAlert(user_id, subject, message) {
  const query = 'SELECT email FROM users WHERE id = ?';
  try {
    const [result] = await db.promise().query(query, [user_id]);
    if (result.length > 0) {
      const userEmail = result[0].email;; 
      console.log('Sending alert to:', userEmail);
      await sendEmail(userEmail, subject, message);
    } else { console.log('No Email Found.'); }
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = { sendEmailAlert };

  