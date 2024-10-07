#ifndef MQTTCLIENTMANAGER_H
#define MQTTCLIENTMANAGER_H

#include <Preferences.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>

// Declare global variables for storing credentials
extern String mqtt_user;  
extern String mqtt_pass;  
extern Preferences preferences;

// Function declarations
bool checkMQTTCredentials();
void sendMACAddress();
String getMacAddress();

#endif
