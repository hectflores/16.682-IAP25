// Momentum 2025 Arduino Code for Wildfire Challenge
// Team #2: The Marshals
// Written by heflores, with contributions from andraye, cai_bell, chrisogo

// DHT Sensor Setup
#include "DHT.h" // Import Adafruit DHT Library
#define DHT_PIN 2
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// Fire Sensor Setup
const int fireSensorMin = 0;
const int fireSensorMax = 1024;
#define FIRE_PIN A0

void setup() {
  // Begin
  Serial.begin(9600);
  dht.begin(); // Starts DHT Sensor
}

void loop() {
  // Time Per Measurement: Current Refreshes Per 2 Seconds
  delay(2000);
  
  // Initial Measurements
  int humidity = dht.readHumidity();
  float temperature_c = dht.readTemperature(false); // (isFarenheit = false)
  float temperature_f = dht.readTemperature(true); // (isFarenheit = true)
  int fire = abs(fireSensorMax - analogRead(FIRE_PIN)); // This Is Just Me Preferring to Interpret Low Readings as "No Fire" and High as "Close Fire"

  // Reattempt Measurement if Any Reading Fails *** CHANGE??? ***
  if (isnan(humidity) || isnan(temperature_c) || isnan(temperature_f) || isnan(fire)) {
    Serial.println("-----------------------"); // Separator For Readability
    Serial.println("Readings FAILED!!!");
    return;
  }

  // Post-Measurement Calculations
  float heatIndex_c = dht.computeHeatIndex(temperature_c, humidity, false); // (isFarenheit = false) 
  float heatIndex_f = dht.computeHeatIndex(temperature_f, humidity, true); // (isFarenheit = true)
  int fireRange = map(fire, fireSensorMin, fireSensorMax, 0, 3); // Set Up Proximity Sensor
  int fireReading = 0;
  switch (fireRange) {
  case 0: // No Fire
    fireReading = 0;
    break;
  case 1: // Distant Fire
    fireReading = 1;
    break;
  case 2: // Close Fire
    fireReading = 2;
    break;
  }

  // Print Measurements, Calculations
  Serial.println("-----------------------"); // Separator For Readability
  
  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println("% RH");

  Serial.print("Temperature C: ");
  Serial.print(temperature_c);
  Serial.println("°C");

  Serial.print("Temperature F: ");
  Serial.print(temperature_f);
  Serial.println("°F");

  Serial.print("Heat Index C: ");
  Serial.print(heatIndex_c);
  Serial.println("°C");

  Serial.print("Temperature F: ");
  Serial.print(heatIndex_f);
  Serial.println("°F");

  Serial.print("Fire Detection: ");
  Serial.print(fire);
  Serial.println(" Intensity");
  
  Serial.print("Fire Status: ");
  Serial.print(fireReading);
  Serial.println(" (0=None, 1=Distant, 2=Close)");
}
