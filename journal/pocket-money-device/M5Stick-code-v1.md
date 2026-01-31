#include <M5StickCPlus.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// ===============================
// YOU FILL THESE IN LOCALLY
// ===============================
const char* WIFI_SSID = "ADD";
const char* WIFI_PASS = "ADD";

const char* MONZO_TOKEN = "ADD";

// Account IDs
const char* FELIX_ACC = "Do a manual mapping of your Monzo account ID to a kid";
const char* JUNO_ACC  = "Do a manual mapping of your Monzo account ID to a kid";
const char* COCO_ACC  = "Do a manual mapping of your Monzo account ID to a kid";

// ===============================

static const unsigned long POLL_INTERVAL_MS   = 300000; // 5 minutes
static const unsigned long TOPBAR_REFRESH_MS  = 1000;   // refresh top bar every second

struct Child {
  const char* name;
  float balance;
};

Child children[3] = {
  {"Felix", 0},
  {"Juno", 0},
  {"Coco", 0}
};

int currentChild = 0;

#define CYAN    0x07FF
#define MAGENTA 0xF81F
#define GREEN   0x07E0

// Layout
static const int TOPBAR_H = 14;

// Timing
unsigned long lastPollMs = 0;
unsigned long lastTopbarMs = 0;

void fetchBalance(int idx, const char* accountId);
void drawTopBar();
void displayChildScreen(int index);

// Faces
void drawKidFace(int index, int x, int y, uint16_t accent);
void drawFaceFelix(int x, int y, uint16_t accent);
void drawFaceJuno(int x, int y, uint16_t accent);
void drawFaceCoco(int x, int y, uint16_t accent);

uint16_t childColour(int index) {
  if (index == 0) return CYAN;
  if (index == 1) return MAGENTA;
  return GREEN;
}

// Very rough battery % estimate from voltage.
// M5StickC Plus battery is single-cell LiPo; typical range ~3.2V (empty) to ~4.2V (full).
int batteryPercentFromVoltage(float v) {
  if (v <= 3.20f) return 0;
  if (v >= 4.20f) return 100;
  float pct = (v - 3.20f) / (4.20f - 3.20f) * 100.0f;
  return (int)(pct + 0.5f);
}

void setup() {
  M5.begin();
  M5.Lcd.setRotation(0);
  M5.Lcd.fillScreen(BLACK);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
  }

  // Initial fetch
  fetchBalance(0, FELIX_ACC);
  fetchBalance(1, JUNO_ACC);
  fetchBalance(2, COCO_ACC);
  lastPollMs = millis();

  displayChildScreen(currentChild);
}

void loop() {
  M5.update();

  if (M5.BtnA.wasPressed()) {
    currentChild = (currentChild + 1) % 3;
    displayChildScreen(currentChild); // redraw full screen for child switch
  }

  // Poll balances every 5 minutes
  if (millis() - lastPollMs >= POLL_INTERVAL_MS) {
    fetchBalance(0, FELIX_ACC);
    fetchBalance(1, JUNO_ACC);
    fetchBalance(2, COCO_ACC);
    lastPollMs = millis();
    displayChildScreen(currentChild); // redraw full screen after refresh
  }

  // Refresh top bar frequently without repainting everything (keeps it subtle, no flicker)
  if (millis() - lastTopbarMs >= TOPBAR_REFRESH_MS) {
    drawTopBar();
    lastTopbarMs = millis();
  }

  delay(10);
}

void fetchBalance(int idx, const char* accountId) {
  WiFiClientSecure client;
  client.setInsecure();

  if (!client.connect("api.monzo.com", 443)) return;

  String url = "/balance?account_id=" + String(accountId);

  client.print(String("GET ") + url + " HTTP/1.1\r\n");
  client.print("Host: api.monzo.com\r\n");
  client.print("Authorization: Bearer ");
  client.print(MONZO_TOKEN);
  client.print("\r\nConnection: close\r\n\r\n");

  while (client.connected() && !client.available()) delay(10);

  String payload;
  while (client.available()) payload += client.readString();

  int jsonStart = payload.indexOf('{');
  if (jsonStart < 0) return;

  StaticJsonDocument<512> doc;
  if (deserializeJson(doc, payload.substring(jsonStart))) return;

  int pence = doc["balance"] | 0;
  children[idx].balance = pence / 100.0f;
}

void displayChildScreen(int index) {
  M5.Lcd.fillScreen(BLACK);

  // Top bar (dots + battery)
  drawTopBar();

  uint16_t color = childColour(index);

  // Name
  M5.Lcd.setTextColor(color, BLACK);
  M5.Lcd.setTextSize(3);
  M5.Lcd.setCursor(10, 24);
  M5.Lcd.println(children[index].name);

  // Face under the name (small + personable)
  // (x,y is top-left of a 24x24-ish drawing)
  drawKidFace(index, 12, 54, color);

  // Balance label (moved down to make room for the face)
  M5.Lcd.setTextColor(WHITE, BLACK);
  M5.Lcd.setTextSize(1);
  M5.Lcd.setCursor(10, 86);
  M5.Lcd.println("Balance");

  // Balance value (moved down)
  M5.Lcd.setTextColor(color, BLACK);
  M5.Lcd.setTextSize(2);
  M5.Lcd.setCursor(10, 102);
  M5.Lcd.write(156);  // £ glyph for built-in font
  M5.Lcd.println(children[index].balance, 2);

  // Footer area
  M5.Lcd.setTextColor(WHITE, BLACK);
  M5.Lcd.setTextSize(1);

  // "Connected..." line
  M5.Lcd.setCursor(10, 148);
  M5.Lcd.println("Monzo Bank");

  // Child indicator moved down a bit
  M5.Lcd.setCursor(10, 164);
  M5.Lcd.print("Kid ");
  M5.Lcd.print(index + 1);
  M5.Lcd.print("/3");

  M5.Lcd.setCursor(10, 178);
  M5.Lcd.println("Click for next");
}

void drawTopBar() {
  // Clear just the top bar region
  M5.Lcd.fillRect(0, 0, 135, TOPBAR_H, BLACK);

  // ---- Five-dot countdown (top left) ----
  unsigned long now = millis();
  unsigned long elapsed = (now >= lastPollMs) ? (now - lastPollMs) : 0;
  unsigned long remainingMs = (elapsed >= POLL_INTERVAL_MS) ? 0 : (POLL_INTERVAL_MS - elapsed);
  int remainingMinutes = (int)((remainingMs + 59999UL) / 60000UL); // ceil to minute
  if (remainingMinutes > 5) remainingMinutes = 5;
  if (remainingMinutes < 0) remainingMinutes = 0;

  const int dotY = 7;
  const int dotR = 2;
  const int dotGap = 6;
  const int dotStartX = 8;

  for (int i = 0; i < 5; i++) {
    int x = dotStartX + i * dotGap;
    bool filled = (i < remainingMinutes);
    uint16_t c = filled ? WHITE : 0x528A; // dim grey for empty
    if (filled) {
      M5.Lcd.fillCircle(x, dotY, dotR, c);
    } else {
      M5.Lcd.drawCircle(x, dotY, dotR, c);
    }
  }

  // ---- Battery indicator (top right) ----
  float vbat = M5.Axp.GetBatVoltage();
  int pct = batteryPercentFromVoltage(vbat);

  int iconW = 18;
  int iconH = 8;
  int iconX = 135 - iconW - 34; // leave room for text
  int iconY = 3;

  M5.Lcd.drawRect(iconX, iconY, iconW, iconH, WHITE);
  M5.Lcd.fillRect(iconX + iconW, iconY + 2, 2, iconH - 4, WHITE);

  int innerW = iconW - 2;
  int fillW = (pct * innerW) / 100;
  if (fillW < 0) fillW = 0;
  if (fillW > innerW) fillW = innerW;
  M5.Lcd.fillRect(iconX + 1, iconY + 1, fillW, iconH - 2, WHITE);

  M5.Lcd.setTextColor(WHITE, BLACK);
  M5.Lcd.setTextSize(1);
  M5.Lcd.setCursor(iconX + iconW + 4, 2);
  M5.Lcd.print(pct);
  M5.Lcd.print("%");
}

// ===============================
// Faces (simple vector doodles)
// ===============================

void drawKidFace(int index, int x, int y, uint16_t accent) {
  switch (index) {
    case 0: drawFaceFelix(x, y, accent); break;
    case 1: drawFaceJuno(x, y, accent); break;
    case 2: drawFaceCoco(x, y, accent); break;
  }
}

// Felix: classic smile + freckles
void drawFaceFelix(int x, int y, uint16_t accent) {
  // head
  M5.Lcd.drawCircle(x + 12, y + 12, 12, accent);

  // eyes
  M5.Lcd.fillCircle(x + 8,  y + 10, 2, WHITE);
  M5.Lcd.fillCircle(x + 16, y + 10, 2, WHITE);

  // smile (simple chevron)
  M5.Lcd.drawLine(x + 7,  y + 16, x + 12, y + 18, WHITE);
  M5.Lcd.drawLine(x + 12, y + 18, x + 17, y + 16, WHITE);

  // freckles
  M5.Lcd.drawPixel(x + 6,  y + 14, WHITE);
  M5.Lcd.drawPixel(x + 7,  y + 16, WHITE);
  M5.Lcd.drawPixel(x + 18, y + 14, WHITE);
  M5.Lcd.drawPixel(x + 17, y + 16, WHITE);
}

// Juno: wink + cheeky grin
void drawFaceJuno(int x, int y, uint16_t accent) {
  M5.Lcd.drawCircle(x + 12, y + 12, 12, accent);

  // left eye wink
  M5.Lcd.drawLine(x + 6, y + 10, x + 10, y + 10, WHITE);

  // right eye
  M5.Lcd.fillCircle(x + 16, y + 10, 2, WHITE);

  // grin (double line for thickness)
  M5.Lcd.drawLine(x + 7,  y + 17, x + 18, y + 15, WHITE);
  M5.Lcd.drawLine(x + 7,  y + 18, x + 18, y + 16, WHITE);

  // dimple
  M5.Lcd.drawPixel(x + 18, y + 17, WHITE);
}

// Coco: surprised “o” mouth + blush cheeks
void drawFaceCoco(int x, int y, uint16_t accent) {
  M5.Lcd.drawCircle(x + 12, y + 12, 12, accent);

  // eyes slightly bigger
  M5.Lcd.fillCircle(x + 8,  y + 10, 2, WHITE);
  M5.Lcd.fillCircle(x + 16, y + 10, 2, WHITE);

  // sparkle dots
  M5.Lcd.drawPixel(x + 8,  y + 9, BLACK);
  M5.Lcd.drawPixel(x + 16, y + 9, BLACK);

  // "o" mouth
  M5.Lcd.drawCircle(x + 12, y + 17, 3, WHITE);

  // blush
  M5.Lcd.drawPixel(x + 5,  y + 14, WHITE);
  M5.Lcd.drawPixel(x + 6,  y + 15, WHITE);
  M5.Lcd.drawPixel(x + 19, y + 14, WHITE);
  M5.Lcd.drawPixel(x + 18, y + 15, WHITE);
}