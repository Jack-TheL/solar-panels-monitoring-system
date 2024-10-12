const mysql = require('mysql2');

///// MySQL Database /////
// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'AdminRooter01',
    database: 'pv_monitoring_app'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
      console.error('Database connection failed: ' + err.stack);
      return;
    }
    console.log('Connected to database.');
});

module.exports = db; // Export the connection 
