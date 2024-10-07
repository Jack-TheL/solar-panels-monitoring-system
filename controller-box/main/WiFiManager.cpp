#include "WiFiManager.h"

const char* WiFiManager::htmlForm = R"(
<!DOCTYPE html>
<html>
<body>
  <h2>Connect to Wi-Fi</h2>
  <form action="/connect" method="POST">
    SSID: <input type="text" name="ssid"><br><br>
    Password: <input type="password" name="password"><br><br>
    <input type="submit" value="Connect">
  </form>
</body>
</html>
)";

WiFiManager::WiFiManager() : server(80) {}

void WiFiManager::handleRoot() { server.send(200, "text/html", htmlForm); }

void WiFiManager::handleWiFiConnect() {
  String ssid = server.arg("ssid");
  String password = server.arg("password");
  WiFi.begin(ssid.c_str(), password.c_str());

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500); attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    server.send(200, "text/html", "Connected to Wi-Fi! IP Address: " + WiFi.localIP().toString());
    Serial.println("Connected to Wi-Fi!");
    delay(5000); // รอ 3 วินาทีก่อนรีเซ็ต
    ESP.restart(); // รีเซ็ตบอร์ด
  } else {
    server.send(200, "text/html", "Failed to connect. Please try again.");
    Serial.println("Failed to Connect to Wi-Fi!");
    delay(5000); // รอ 5 วินาทีก่อนรีเซ็ต
    ESP.restart(); // รีเซ็ตบอร์ด
  }
}

void toggleLED() { digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN)); }

void WiFiManager::setup() {
  if (WiFi.status() != WL_CONNECTED) {
    blinker.attach(1, toggleLED);
    WiFi.softAP(apSSID, apPassword); // ตั้งค่า ESP32 เป็น Access Point
    server.on("/", std::bind(&WiFiManager::handleRoot, this)); // กำหนดเส้นทางสำหรับฟังก์ชัน handleRoot
    server.on("/connect", HTTP_POST, std::bind(&WiFiManager::handleWiFiConnect, this)); // กำหนดเส้นทางสำหรับฟังก์ชัน handleWiFiConnect
    server.begin(); // เริ่ม Web Server
    Serial.println("Can't Connect to WiFi, Connect to ESP32 AP and Sumbit SSID&Password");
    Serial.println("ESP32 Access Point: " + String(apSSID) + " at web IP: " + WiFi.softAPIP().toString());
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 600) {
      server.handleClient();
      delay(500); attempts++; //Wait for WiFi Connecting 5 mins
      if(attempts >= 600){
        Serial.println("Connecting to Wi-Fi timeout, Reset in 5sec"); 
        delay(5000); ESP.restart();
      }
    }
  } else { Serial.println("Connected to Wi-Fi! IP Address: " + WiFi.localIP().toString());}
}
