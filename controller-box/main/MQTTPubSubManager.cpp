#include "MQTTPubSubManager.h"

int spdLv1;
int spdLv2;
int spdLv3;
int minTemp;
int maxTemp;

const char* mqtt_server = "e2dc3e02e77e44838ebd1dad156c8d66.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;

WiFiClientSecure espClient;
PubSubClient client(espClient);

void changeWiFiCredentials(String ssid, String password) {
  unsigned long startTime = millis();
  Serial.println("Wait 5 sec for start changing WiFi.");
  while (millis() - startTime < 5000) {} // wait for 5 sec
  Serial.println("Connecting to new WiFi...");
  Serial.printf("Changing WiFi credentials to SSID: %s, Password: %s\n", ssid.c_str(), password.c_str());
  WiFi.disconnect(); // Disconnect from current WiFi
  WiFi.begin(ssid.c_str(), password.c_str()); // Connect to new WiFi
  Serial.println("Connecting to new WiFi...");
  startTime = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startTime < 20000)) { 
    delay(100); // Wait up to 20 seconds
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Successfully connected to new WiFi!");
    delay(5000); ESP.restart();
  } else {
    Serial.println("Failed to connect to new WiFi.");
    delay(5000); ESP.restart();
  }
}

// ฟังก์ชัน callback เมื่อมีข้อความเข้ามาใน topic
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  String macAddress = getMacAddress();
  for (int i = 0; i < length; i++) { message += (char)payload[i];}
  // Checking topic
  if (String(topic) == "setFanSpeed/" + macAddress) {
    StaticJsonDocument<200> doc;
    deserializeJson(doc, message);
    preferences.begin("fanLv", false);
    preferences.putInt("lv1", doc["spdLv1"].as<int>());
    preferences.putInt("lv2", doc["spdLv2"].as<int>());
    preferences.putInt("lv3", doc["spdLv3"].as<int>()); 
    preferences.end(); 
    spdLv1 = doc["spdLv1"].as<int>();
    spdLv2 = doc["spdLv2"].as<int>();
    spdLv3 = doc["spdLv3"].as<int>();
    Serial.print("New fan(s) speed assigned. ");
  } else if (String(topic) == "clearCredential/" + macAddress) {
    preferences.begin("credential", false);
    preferences.clear(); preferences.end();
    preferences.begin("fanLv", false);
    preferences.clear(); preferences.end();
    preferences.begin("rangeTemp", false);
    preferences.clear(); preferences.end();
    Serial.println("ESP32 Removed from system reset in 10 secs");
    delay(10000); ESP.restart();
  } else if (String(topic) == "changeWiFi/" + macAddress) {
    // Parse JSON payload for new SSID and password
    StaticJsonDocument<300> doc;
    deserializeJson(doc, message);
    String newSSID = doc["ssid"].as<String>();
    String newPassword = doc["password"].as<String>();
    changeWiFiCredentials(newSSID, newPassword);
  } else if (String(topic) == "setOperatingTemp/" + macAddress){
    // Parse JSON payload
    StaticJsonDocument<200> doc;
    deserializeJson(doc, message);
    preferences.begin("rangeTemp", false);
    preferences.putInt("minTemp", doc["minTemp"].as<int>());
    preferences.putInt("maxTemp", doc["maxTemp"].as<int>());
    preferences.end();
    minTemp =  doc["minTemp"].as<int>();
    maxTemp =  doc["maxTemp"].as<int>();
    Serial.println("New operating temperature assigned");
  }
}

void setupMQTT() {
  client.setServer(mqtt_server, mqtt_port);
  espClient.setInsecure();
  client.setCallback(callback);
  // ดึงข้อมูล MQTT Credentials จาก ROM
  preferences.begin("credential", true); // เปิด read-only
  mqtt_user = preferences.getString("username", "");
  mqtt_pass = preferences.getString("password", "");
  preferences.end();
   Serial.print("Done setup MQTT. ");
}

void setupFanLv(){
  preferences.begin("rangeTemp", true);
  minTemp = preferences.getInt("minTemp", 45);
  maxTemp = preferences.getInt("maxTemp", 85);
  preferences.end();
  preferences.begin("fanLv", true);
  spdLv1 = preferences.getInt("lv1", 0);
  spdLv2 = preferences.getInt("lv2", 50); 
  spdLv3 = preferences.getInt("lv3", 100);  
  preferences.end(); 
  Serial.println("Done setup fan control.");
}

void reconnectToMQTT() {
  int attemptCount = 0; // นับจำนวนครั้งที่พยายามเชื่อมต่อ

  while (!client.connected() && attemptCount<12 ) {
    Serial.print("Attempting MQTT connection..."); 
    if (client.connect(getMacAddress().c_str(), mqtt_user.c_str(), mqtt_pass.c_str())) {
      Serial.println("connected");
      String macAddress = getMacAddress();
      String fanSpeedTopic = "setFanSpeed/" + macAddress;
      String operatingTempTopic = "setOperatingTemp/" + macAddress;
      String changeWiFiTopic = "changeWiFi/" + macAddress;
      String clearCredentialTopic = "clearCredential/" + macAddress;
      client.subscribe(fanSpeedTopic.c_str());
      client.subscribe(operatingTempTopic.c_str());
      client.subscribe(changeWiFiTopic.c_str());
      client.subscribe(clearCredentialTopic.c_str());
      Serial.println("Subscribed to topics:");
      Serial.println(fanSpeedTopic);
      Serial.println(operatingTempTopic);
      Serial.println(changeWiFiTopic);
      Serial.println(clearCredentialTopic);
    } else {
      Serial.print("failed, rc=");
      Serial.println(client.state());
      attemptCount++; delay(5000);
    }
  }
  // ถ้าพยายามครบ 12 ครั้งแล้วยังเชื่อมต่อไม่สำเร็จ ให้ล้างข้อมูลและรีสตาร์ท ESP32
  if (!client.connected()) {
    Serial.println("MQTT connection timeout. Restarting ESP32...");
    preferences.begin("credential", false);
    preferences.clear(); preferences.end();
    ESP.restart(); // รีสตาร์ท ESP32
  }
}

void handleMQTT() {
  if (!client.connected()) { reconnectToMQTT();}
  client.loop();
}

void publishData(bool ina219 , float temperature, float voltage, float current, float power, float light) {
  String macAddress = getMacAddress();
  // สร้าง JSON payload
  StaticJsonDocument<200> doc;
  doc["macAddress"] = macAddress;
  doc["temperature"] = temperature;
  doc["light"] = light;
  if (ina219) {
    doc["voltage"] = voltage;
    doc["current"] = current;
    doc["power"] = power;
  } else {
    doc["voltage"] = -30;
    doc["current"] = -10;
    doc["power"] = -210;
  }
  // แปลง JSON เป็น string
  char payload[256];
  serializeJson(doc, payload);
  // ส่งข้อมูลไปยัง topic "esp32/sensors"
  client.publish("esp32/liveData", payload);
  Serial.println("Message published: ");
  Serial.println(payload);
}