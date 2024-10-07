#ifndef WIFIMANAGER_H
#define WIFIMANAGER_H

#include <WebServer.h>
#include <Ticker.h>
#include <WiFi.h>

class WiFiManager {
public:
  Ticker blinker;  // สร้างออบเจ็กต์ Ticker
  WiFiManager();
  void setup();

private:
  const char* apSSID = "ESP32-AP"; // ชื่อ Access Point
  const char* apPassword = "123456789"; // รหัสผ่าน Access Point
  WebServer server;

  static const char* htmlForm;
  void handleRoot();
  void handleWiFiConnect();
};

#endif
