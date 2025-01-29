// Momentum 2025 Arduino Code for Wildfire Challenge
// Team #2: The Marshals
// Written by heflores, with contributions from andraye, cai_bell, chrisogo

// Global Setup
const int sensorMin = 0;
const int sensorMax = 1024;

// DHT Sensor Setup
#include "DHT.h" // Import Adafruit DHT Library
#define DHT_PIN 2
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// Fire Sensor Setup
#define FIRE_PIN A0

// MQ2 Sensor Setup (special thanks to m_karim02 on Arduino's ProjectHub for saving me hours from this mess)
// Note: This Adaptation is a Very Simplied Process From the Math Performed in m_karim02's Code
#define MQ2_PIN A1
#define MQ2_RL 5 // In kilo-ohms
#define MQ2_RO 10 // See https://www.pololu.com/file/0J309/MQ2.pdf 
#define MQ2_LPG 0
#define MQ2_CO 1
#define MQ2_SMOKE 2
float MQ2_LPG_CURVE[3] = {2.3, 0.21, -0.47};
float MQ2_CO_CURVE[3] = {2.3, 0.72, -0.34};
float MQ2_SMOKE_CURVE[3] = {2.3, 0.72, -0.34};

float MQ2_GET_GAS(float RS_RO, int MQ2_GAS) { // Calculates PPM of Target Gas
  if (MQ2_GAS == MQ2_LPG) {
    return (pow(10, (((log(RS_RO)-MQ2_LPG_CURVE[1]) / MQ2_LPG_CURVE[2]) + MQ2_LPG_CURVE[0])));
  } 
  else if (MQ2_GAS == MQ2_CO) { 
    return (pow(10, (((log(RS_RO)-MQ2_CO_CURVE[1]) / MQ2_CO_CURVE[2]) + MQ2_CO_CURVE[0])));
  }
  else if (MQ2_GAS == MQ2_SMOKE) {
    return (pow(10, (((log(RS_RO)-MQ2_SMOKE_CURVE[1]) / MQ2_SMOKE_CURVE[2]) + MQ2_SMOKE_CURVE[0])));
  }
  return 0;
}

void setup() {
  // Begin with Typical 9600 Baud Rate
  Serial.begin(9600);
  
  // DHT Initialize
  dht.begin(); // Starts DHT Sensor
}



void loop() {
  // Time Per Measurement: Current Refreshes Per 2 Seconds
  delay(2000);
  
  // Initial Measurements
  int humidity = dht.readHumidity();
  float temperature_c = dht.readTemperature(false); // (isFarenheit = false)
  float temperature_f = dht.readTemperature(true); // (isFarenheit = true)
  int fireIntensity = abs(sensorMax - analogRead(FIRE_PIN)); // This Is Just Me Preferring to Interpret Low Readings as "No Fire" and High as "Close Fire"
  float MQ2read = (((float)MQ2_RL*((sensorMax - 1) - analogRead(MQ2_PIN))/analogRead(MQ2_PIN))); // Calculates Sensor Resistance to Later Calculate PPM

  // Reattempt Measurement if Any Reading Fails *** CHANGE??? ***
  if (isnan(humidity) || isnan(temperature_c) || isnan(temperature_f) || isnan(fireIntensity)) {
    Serial.println("-----------------------"); // Separator For Readability
    Serial.println("Readings FAILED!!!");
    return;
  }

  // Post-Measurement Calculations
  float heatIndex_c = dht.computeHeatIndex(temperature_c, humidity, false); // (isFarenheit = false) 
  float heatIndex_f = dht.computeHeatIndex(temperature_f, humidity, true); // (isFarenheit = true)
  int fireRange = map(fireIntensity, sensorMin, sensorMax, 0, 3); // Set Up Proximity Sensor
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
  float RS_RO = MQ2read / MQ2_RO;
  float LPGppm = MQ2_GET_GAS(RS_RO, MQ2_LPG);
  float COppm = MQ2_GET_GAS(RS_RO, MQ2_CO);
  float SMOKEppm = MQ2_GET_GAS(RS_RO, MQ2_SMOKE);

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
  Serial.print(fireIntensity);
  Serial.println(" Intensity");
  
  Serial.print("Fire Status: ");
  Serial.print(fireReading);
  Serial.println(" (0=None, 1=Distant, 2=Close)");

  Serial.print("LPG Concentration: ");
  Serial.print(LPGppm);
  Serial.println("ppm");

  Serial.print("CO Concentration: ");
  Serial.print(COppm);
  Serial.println("ppm");

  Serial.print("Smoke Concentration: ");
  Serial.print(SMOKEppm);
  Serial.println("ppm");
}
