#include "MQTTPubSubManager.h"
#include "MQTTClientManager.h"
#include "WiFiManager.h"
#include <DallasTemperature.h>
#include <DFRobot_INA219.h>
#include <OneWire.h>
#include <WiFi.h>
// Define Variables
#define ONE_WIRE_BUS 23
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
DFRobot_INA219_IIC ina219(&Wire, INA219_I2C_ADDRESS4);
float ina219Reading_mA = 1000; // adjust for more accuracy
float extMeterReading_mA = 990; // adjust for more accuracy
// Set Pwm, Freqm, Res, Channel Pins 
const int pwm1Pin = 25;
const int in2Pin = 26;
const int pwm3Pin = 32;
const int in4Pin = 33;
const int pwmFreq = 25000;  // ความถี่ 25 kHz
const int pwmResolution = 8;  // ความละเอียด 8 บิต (0-255)
const int pwmChannel = 0;
unsigned long previousMillis = 0;
const long interval = 10000;  // 10 วินาที

WiFiManager wifiManager; // สร้างออบเจ็กต์ WiFiManager

void fanControl(float currtemp) {
  int fanSpeed1 = (spdLv1 < 1) ? 0 : map(spdLv1, 1, 100, 200, 255);
  int fanSpeed2 = (spdLv2 < 1) ? 0 : map(spdLv2, 1, 100, 200, 255);
  int fanSpeed3 = (spdLv3 < 1) ? 0 : map(spdLv3, 1, 100, 200, 255);
  // 700-1800 rmp +-10% (630-1620, 770-1980)
  if(currtemp < minTemp){
    ledcWrite(pwm1Pin, fanSpeed1);
    ledcWrite(pwm3Pin, fanSpeed1);  
  }
  else if(currtemp > maxTemp){
    ledcWrite(pwm1Pin, fanSpeed3);
    ledcWrite(pwm3Pin, fanSpeed3); 
  }
  else {
    ledcWrite(pwm1Pin, fanSpeed2);
    ledcWrite(pwm3Pin, fanSpeed2);
  }
  Serial.print("spdLv1: ");Serial.print(spdLv1);
  Serial.print(", spdLv2: ");Serial.print(spdLv2);
  Serial.print(", spdLv3: ");Serial.print(spdLv3);
  Serial.print(", minTemp: ");Serial.print(minTemp);
  Serial.print(", maxTemp: ");Serial.println(maxTemp);
}

float retrievingLight() {
  if (Serial2.available()) {  // ตรวจสอบว่ามีข้อมูลอยู่
    String lightStr = Serial2.readStringUntil('\n'); // อ่านสตริงที่เข้ามา
    lightStr.trim();// ลบช่องว่างที่ต้นและท้ายของสตริง
    if (lightStr.length() > 0) { // ตรวจสอบว่า lightStr ไม่ว่างเปล่า
      // แปลงเป็น float โดยตรงและตรวจสอบว่าการแปลงเป็นไปได้
      float lightValue = lightStr.toFloat();
      // ตรวจสอบว่าการแปลงสำเร็จหรือไม่
      if (lightValue != 0 || lightStr.equals("0")) {
        return lightValue; // คืนค่าความเข้มแสงที่ถูกต้อง
      }
    }
  } return -1; // คืนค่า -1 หากไม่มีข้อมูลที่ถูกต้องถูกอ่าน
}

void setup() {
  Serial.begin(115200); //while(!Serial){};
  Serial2.begin(9600, SERIAL_8N1, 16, 17); // Serial1 ใช้พิน RX = 16 และ TX = 17 สำหรับการรับค่าจาก ESP32 อีกตัว
  // Handle WiFi Connection
  pinMode(LED_BUILTIN, OUTPUT); WiFi.begin();
  Serial.println("Connecting to WiFi, Wait a moment...");
  delay(10000); wifiManager.setup(); 
  wifiManager.blinker.detach(); digitalWrite(LED_BUILTIN, LOW);
  //Check if device have MQTT Credentials
  if (!checkMQTTCredentials()) { sendMACAddress(); }
  setupMQTT(); setupFanLv();
  pinMode(in4Pin, OUTPUT); pinMode(in2Pin, OUTPUT);
  ledcAttachChannel(pwm1Pin, pwmFreq, pwmResolution, pwmChannel);
  ledcAttachChannel(pwm3Pin, pwmFreq, pwmResolution, pwmChannel);
  sensors.begin(); ledcWrite(pwm1Pin, 0); ledcWrite(pwm3Pin, 0);
  while (ina219.begin() != true) {
    Serial.println("INA219 begin failed");
    digitalWrite(LED_BUILTIN, HIGH); delay(250); digitalWrite(LED_BUILTIN, LOW); 
    delay(2000);
  }
  ina219.linearCalibrate(ina219Reading_mA, extMeterReading_mA);;
  Serial.println("Done Setup Sensors");
}

void loop() {
  unsigned long currentMillis = millis();
  handleMQTT();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    if (WiFi.status() == WL_CONNECTED) {
      //Reading from sensors
      sensors.requestTemperatures(); // อ่านค่า *C
      float light = retrievingLight();
      float temperature = sensors.getTempCByIndex(0);
      float current = ina219.getCurrent_mA();
      float voltage = ina219.getBusVoltage_V();
      float power = ina219.getPower_mW();
      fanControl(temperature); // chage speed depend on temp
      // Send Data to MQTT Broker
      publishData(ina219.begin(), temperature, voltage, current, power, light);
    } else { wifiManager.setup(); wifiManager.blinker.detach(); digitalWrite(LED_BUILTIN, LOW);}
  }
  if(WiFi.status() != WL_CONNECTED){ 
    wifiManager.setup(); wifiManager.blinker.detach(); digitalWrite(LED_BUILTIN, LOW);
  }
}
