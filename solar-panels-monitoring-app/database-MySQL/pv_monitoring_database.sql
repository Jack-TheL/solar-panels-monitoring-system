CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL
);
CREATE TABLE login_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login BOOLEAN NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE panels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    Pmax INT,
    Imp FLOAT,
    Vmp FLOAT,
    Isc FLOAT,
    Voc FLOAT,
    location VARCHAR(255),
    status BOOLEAN DEFAULT FALSE,
    user_id INT,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_panel_user
        FOREIGN KEY (user_id)
        REFERENCES users(id) 
        ON DELETE CASCADE
);
CREATE TABLE esp32 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mqtt_user VARCHAR(100) NOT NULL,
    mqtt_pass VARCHAR(100) NOT NULL,
    mac_address VARCHAR(17) NOT NULL UNIQUE,
    ssid VARCHAR(100),
    password VARCHAR(100),
    fan_lv1 INT NOT NULL DEFAULT 0,
    fan_lv2 INT NOT NULL DEFAULT 50,
    fan_lv3 INT NOT NULL DEFAULT 100,
    min_temp INT NOT NULL DEFAULT 45,
    max_temp INT NOT NULL DEFAULT 85,
    min_light INT,
    attached BOOLEAN DEFAULT FALSE,
    panel_id INT,
    CONSTRAINT fk_esp32_panel
        FOREIGN KEY (panel_id)
        REFERENCES panels(id) 
        ON DELETE CASCADE
);

CREATE TABLE sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    current FLOAT NOT NULL,
    voltage FLOAT NOT NULL,
    temperature FLOAT NOT NULL,
    power FLOAT NOT NULL,
    light INT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    panel_id INT, 
    CONSTRAINT fk_sensor_panel
        FOREIGN KEY (panel_id)
        REFERENCES panels(id) 
        ON DELETE CASCADE 
);

CREATE TABLE alert_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    system_alert_enabled BOOLEAN DEFAULT TRUE,
    system_alert_delay INT DEFAULT 60,
    over_heat_alert_enabled BOOLEAN DEFAULT TRUE,
    over_heat_alert_delay INT DEFAULT 30,
    panel_fail_enabled BOOLEAN DEFAULT TRUE,
    panel_fail_delay INT DEFAULT 300,
    sensor_fail_alert_enabled BOOLEAN DEFAULT TRUE,
    sensor_fail_alert_delay INT DEFAULT 60,
    mcu_disconnect_enabled BOOLEAN DEFAULT TRUE,
    mcu_disconnect_delay INT DEFAULT 300,
    email_alert_enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE alert_log (
    id INT AUTO_INCREMENT PRIMARY KEY,        
    title VARCHAR(255) NOT NULL,  
	message TEXT, 
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,               
    user_id INT,                            
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE 
);


