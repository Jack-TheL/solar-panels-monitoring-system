#include "MQTTClientManager.h"

String mqtt_user;  // Username 
String mqtt_pass;  // Password 
Preferences preferences;

const char* serverUrl = "https://rrvxlzsz-3000.asse.devtunnels.ms/api/new-credentials";  //URL ของเซิร์ฟเวอร์

// ฟังก์ชันเช็ค MQTT Credentials
bool checkMQTTCredentials() {
  // เริ่มการใช้งาน preferences และโหลดข้อมูลจาก non-volatile memory
  preferences.begin("credential", true);  // เปิด preferences ในโหมด read-only
  // preferences.clear(); // for testing 
  mqtt_user = preferences.getString("username", "");
  mqtt_pass = preferences.getString("password", "");
  preferences.end();  // ปิด preferences
  // ตรวจสอบว่ามี credentials หรือไม่
  if (mqtt_user == "" || mqtt_pass == "") {
    Serial.println("No mqtt credentials for this device");
    return false;
  }
  Serial.print("MQTT credentials for deivce: ");
  Serial.print("{username: " + mqtt_user);
  Serial.println(", password: " + mqtt_pass + "}");
  return true;
}

void sendMACAddress() {
  String macAddress = getMacAddress();
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    // Create JSON payload
    String payload = "{\"mac_address\":\"" + macAddress + "\"}";
    Serial.println("Sendding MAC Adress: " + payload);
    // Send POST request
    int httpResponseCode = http.POST(payload);
    String response = http.getString();
    if(httpResponseCode == 404) { Serial.println("Server Response: " + response);}
    else if (httpResponseCode == 200) {
      Serial.println("Server Response: " + response);
      // Deserialize the JSON response
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, response);
      if (!error) {
        if (doc.containsKey("username") && doc.containsKey("password")) {
          // Store username and password in non-volatile memory
          String username = doc["username"].as<String>();
          String password = doc["password"].as<String>();
          preferences.begin("credential", false); // Open Preferences
          preferences.putString("username", username); // Save username
          preferences.putString("password", password); // Save password
          preferences.end(); // Close Preferences
          mqtt_user = username.c_str(); // Update global username
          mqtt_pass = password.c_str(); // Update global password
          Serial.print("Credential {username: " + mqtt_user );
          Serial.println(", password: " + mqtt_pass + "} is set to device.");
          Serial.print("Reset in 5 sec" ); delay(5000); ESP.restart();
        }
      } else { Serial.println("Failed to parse JSON"); }
    } else {
      Serial.print("Error in sending POST: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else { Serial.println("WiFi Disconnected"); }
  Serial.print("Reset in 10 sec" ); delay(10000); ESP.restart();
}
// ฟังก์ชันดึง MAC Address
String getMacAddress() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char macStr[18];
  sprintf(macStr, "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(macStr);
}
