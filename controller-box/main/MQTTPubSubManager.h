#ifndef MQTTPUBSUBMANAGER_H
#define MQTTPUBSUBMANAGER_H

#include "MQTTClientManager.h"
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
// #include <WiFi.h>
// #include <ArduinoJson.h>

extern int spdLv1;
extern int spdLv2;
extern int spdLv3;
extern int minTemp;
extern int maxTemp;

void setupMQTT();
void setupFanLv();
void handleMQTT();
void publishData(bool ina219 , float temperature, float voltage, float current, float power, float light);

#endif
