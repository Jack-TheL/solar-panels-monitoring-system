#include <DFRobot_B_LUX_V30B.h>
DFRobot_B_LUX_V30B myLux(13);

unsigned long previousMillis = 0; // จะเก็บเวลาเมื่อทำงานล่าสุด
const long interval = 9900; // เวลาที่ต้องการระหว่างการอ่านค่า (ในมิลลิวินาที)

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, 16, 17); // TX=17, RX=16
  myLux.begin();
}

void loop() {
  unsigned long currentMillis = millis(); // รับเวลาในปัจจุบัน
  // ตรวจสอบว่าเวลาที่ผ่านไปมากกว่าหรือเท่ากับช่วงเวลาที่กำหนด
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis; // อัปเดตเวลาที่ผ่านไป
    // อ่านค่าแสงและพิมพ์ผลลัพธ์
    float lightValue = myLux.lightStrengthLux();
    Serial.println(lightValue);
    Serial2.println(lightValue);
  }

}
