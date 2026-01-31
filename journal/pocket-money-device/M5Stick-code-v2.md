#include <M5StickCPlus.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <math.h>

// ===============================
// YOU FILL THESE IN LOCALLY
// ===============================
const char *WIFI_SSID = "ADD";
const char *WIFI_PASS = "ADD";
const char *API_BASE = "ADD"; // or Pi IP
// ===============================

static const unsigned long POLL_INTERVAL_MS = 300000; // 5 minutes
static const unsigned long TOPBAR_REFRESH_MS = 1000;  // 1 second

static const unsigned long HOLD_REPEAT_START_MS = 450; // start repeat after this
static const unsigned long HOLD_REPEAT_EVERY_MS = 180; // repeat rate once held

#define CYAN 0x07FF
#define MAGENTA 0xF81F
#define GREEN 0x07E0

static const int TOPBAR_H = 14;

static const int SCREEN_W = 135;
static const int SCREEN_H = 240;

static const int NAME_Y = 24;
static const int FACE_Y = 54;

static const int TITLE_Y = 22;
static const int BODY_Y = 54;
static const int FOOT_Y = 206;

static const int AMOUNT_Y = 86;

struct Kid
{
    const char *id;
    const char *name;

    int visiblePence;
    int pendingPence;
    bool hasPending;
    int pendingCount;

    Kid(const char *_id, const char *_name)
        : id(_id), name(_name),
          visiblePence(0), pendingPence(0),
          hasPending(false), pendingCount(0) {}
};

Kid kids[3] = {
    Kid("felix", "Felix"),
    Kid("juno", "Juno"),
    Kid("coco", "Coco")};

int currentKid = 0;

// ---------- Screen state ----------
enum Screen
{
    SCR_MAIN,
    SCR_MENU,
    SCR_PICK_RECIPIENT,
    SCR_AMOUNT,
    SCR_SENT_TOAST
};

Screen screen = SCR_MAIN;
int menuIndex = 0;       // used for menu lists
int recipientIndex = -1; // index in kids[] (0..2), but never equal to currentKid

// ---------- Transfer confirmation state ----------
int lastSentPence = 0;
int lastSentToIdx = -1;

// amount building
int transferTotalPence = 0;
static const int STACK_MAX = 40;
int chipStack[STACK_MAX];
int chipStackLen = 0;

// timing
unsigned long lastPollMs = 0;
unsigned long lastTopbarMs = 0;

// Sleep
unsigned long lastInteractionMs = 0;
bool screenSleeping = false;

static const unsigned long SLEEP_AFTER_MS = 90000; // 90 seconds

// Cached button presses (set once per loop)
bool gPressA = false;
bool gPressB = false;
bool gPressC = false;

// toast
unsigned long toastUntilMs = 0;
char toastMsg[40] = {0};

// ---------- Colours ----------
uint16_t kidColour(int index)
{
    if (index == 0)
        return CYAN;
    if (index == 1)
        return MAGENTA;
    return GREEN;
}

// ---------- Currency printing ----------
void printGBP(int pence, uint16_t colour, uint8_t textSize, int x, int y)
{
    int pounds = pence / 100;
    int pennies = abs(pence % 100);

    M5.Lcd.setTextColor(colour, BLACK);
    M5.Lcd.setTextSize(textSize);
    M5.Lcd.setCursor(x, y);

    M5.Lcd.write(156); // £ glyph for built-in font
    M5.Lcd.printf("%d.%02d", pounds, pennies);
}

// ---------- Battery ----------
int batteryPercentFromVoltage(float v)
{
    if (v <= 3.20f)
        return 0;
    if (v >= 4.20f)
        return 100;
    float pct = (v - 3.20f) / (4.20f - 3.20f) * 100.0f;
    return (int)(pct + 0.5f);
}

// ---------- Networking helpers ----------
bool httpGETJson(const String &url, DynamicJsonDocument &doc)
{
    HTTPClient http;
    http.setTimeout(3500);
    if (!http.begin(url))
        return false;
    int code = http.GET();
    if (code <= 0)
    {
        http.end();
        return false;
    }
    String body = http.getString();
    http.end();
    return deserializeJson(doc, body) == DeserializationError::Ok;
}

bool httpPOSTJson(const String &url, const String &body, const String &contentType, DynamicJsonDocument &doc)
{
    HTTPClient http;
    http.setTimeout(4500);
    if (!http.begin(url))
        return false;
    if (contentType.length() > 0)
        http.addHeader("Content-Type", contentType);

    int code = http.POST((uint8_t *)body.c_str(), body.length());
    if (code <= 0)
    {
        http.end();
        return false;
    }

    String resp = http.getString();
    http.end();
    return deserializeJson(doc, resp) == DeserializationError::Ok;
}

bool fetchStatusForKid(int idx)
{
    String url = String(API_BASE) + "/api/kids/" + kids[idx].id + "/status";
    DynamicJsonDocument doc(2048);
    if (!httpGETJson(url, doc))
        return false;

    kids[idx].visiblePence = doc["kid"]["visible_balance_pence"] | kids[idx].visiblePence;
    kids[idx].pendingPence = doc["kid"]["pending_balance_pence"] | kids[idx].pendingPence;
    kids[idx].hasPending = doc["pending"]["has_pending"] | false;
    kids[idx].pendingCount = doc["pending"]["count"] | 0;
    return true;
}

void fetchStatusAllKids()
{
    fetchStatusForKid(0);
    fetchStatusForKid(1);
    fetchStatusForKid(2);
    lastPollMs = millis();
}

bool acceptPendingForKid(int idx, int &fromP, int &toP)
{
    String url = String(API_BASE) + "/api/kids/" + kids[idx].id + "/accept";
    DynamicJsonDocument doc(2048);
    // POST with empty body
    if (!httpPOSTJson(url, "", "", doc))
        return false;
    if (!(doc["ok"] | false))
        return false;

    fromP = doc["animation"]["from_visible_pence"] | kids[idx].visiblePence;
    toP = doc["animation"]["to_visible_pence"] | kids[idx].visiblePence;

    kids[idx].visiblePence = toP;
    kids[idx].pendingPence = 0;
    kids[idx].hasPending = false;
    kids[idx].pendingCount = 0;
    return true;
}

bool postTransfer(int fromIdx, int toIdx, int amountPence, const char *noteOpt, String &errorOut)
{
    // API expects amount in GBP number (e.g. 1.50)
    float amountGbp = ((float)amountPence) / 100.0f;

    DynamicJsonDocument req(256);
    req["fromKid"] = kids[fromIdx].id;
    req["toKid"] = kids[toIdx].id;
    req["amount"] = amountGbp;
    if (noteOpt && noteOpt[0] != '\0')
        req["note"] = noteOpt;

    String body;
    serializeJson(req, body);

    DynamicJsonDocument resp(1024);
    String url = String(API_BASE) + "/api/transfers";

    bool ok = httpPOSTJson(url, body, "application/json", resp);
    if (!ok)
    {
        errorOut = "network error";
        return false;
    }

    if (resp["ok"] | false)
    {
        return true;
    }

    // failure shape: {"error":"insufficient funds"}
    const char *err = resp["error"] | "transfer failed";
    errorOut = err;
    return false;
}

// ---------- Tiny UI primitives ----------
void showToast(const char *msg, unsigned long ms = 1000)
{
    strncpy(toastMsg, msg, sizeof(toastMsg) - 1);
    toastMsg[sizeof(toastMsg) - 1] = '\0';
    toastUntilMs = millis() + ms;

    // draw it immediately
    M5.Lcd.fillRect(0, FOOT_Y, SCREEN_W, 34, BLACK);
    M5.Lcd.setTextSize(1);
    M5.Lcd.setTextColor(WHITE, BLACK);
    M5.Lcd.setCursor(8, FOOT_Y + 10);
    M5.Lcd.println(toastMsg);
}

void clearToastIfExpired()
{
    if (toastUntilMs != 0 && millis() > toastUntilMs)
    {
        // Keep toastUntilMs for other logic that might rely on it.
        toastMsg[0] = '\0';
    }
}

void drawTopBar()
{
    M5.Lcd.fillRect(0, 0, SCREEN_W, TOPBAR_H, BLACK);

    unsigned long now = millis();
    unsigned long elapsed = (now >= lastPollMs) ? (now - lastPollMs) : 0;
    unsigned long remainingMs = (elapsed >= POLL_INTERVAL_MS) ? 0 : (POLL_INTERVAL_MS - elapsed);
    int remainingMinutes = (int)((remainingMs + 59999UL) / 60000UL);
    if (remainingMinutes > 5)
        remainingMinutes = 5;
    if (remainingMinutes < 0)
        remainingMinutes = 0;

    const int dotY = 7, dotR = 2, dotGap = 6, dotStartX = 8;
    for (int i = 0; i < 5; i++)
    {
        int x = dotStartX + i * dotGap;
        bool filled = (i < remainingMinutes);
        uint16_t c = filled ? WHITE : 0x528A;
        if (filled)
            M5.Lcd.fillCircle(x, dotY, dotR, c);
        else
            M5.Lcd.drawCircle(x, dotY, dotR, c);
    }

    float vbat = M5.Axp.GetBatVoltage();
    int pct = batteryPercentFromVoltage(vbat);

    int iconW = 18, iconH = 8;
    int iconX = SCREEN_W - iconW - 34;
    int iconY = 3;

    M5.Lcd.drawRect(iconX, iconY, iconW, iconH, WHITE);
    M5.Lcd.fillRect(iconX + iconW, iconY + 2, 2, iconH - 4, WHITE);

    int innerW = iconW - 2;
    int fillW = (pct * innerW) / 100;
    if (fillW < 0)
        fillW = 0;
    if (fillW > innerW)
        fillW = innerW;
    M5.Lcd.fillRect(iconX + 1, iconY + 1, fillW, iconH - 2, WHITE);

    M5.Lcd.setTextSize(1);
    M5.Lcd.setTextColor(WHITE, BLACK);
    M5.Lcd.setCursor(iconX + iconW + 6, 3);
    M5.Lcd.printf("%d%%", pct);
}

// ---------- Faces (simple primitives, no drawArc) ----------
void drawArcApprox(int cx, int cy, int r, int startDeg, int endDeg, uint16_t colour)
{
    const int step = 12;
    float prevX = cx + r * cos(startDeg * DEG_TO_RAD);
    float prevY = cy + r * sin(startDeg * DEG_TO_RAD);

    for (int a = startDeg + step; a <= endDeg; a += step)
    {
        float x = cx + r * cos(a * DEG_TO_RAD);
        float y = cy + r * sin(a * DEG_TO_RAD);
        M5.Lcd.drawLine((int)prevX, (int)prevY, (int)x, (int)y, colour);
        prevX = x;
        prevY = y;
    }
}

void drawFaceFelix(int x, int y, uint16_t accent)
{
    M5.Lcd.drawCircle(x + 7, y + 8, 4, WHITE);
    M5.Lcd.drawCircle(x + 17, y + 8, 4, WHITE);
    M5.Lcd.drawLine(x + 11, y + 8, x + 13, y + 8, WHITE);
    M5.Lcd.fillCircle(x + 7, y + 8, 1, accent);
    M5.Lcd.fillCircle(x + 17, y + 8, 1, accent);
    drawArcApprox(x + 12, y + 17, 6, 20, 160, WHITE);
}

void drawFaceJuno(int x, int y, uint16_t accent)
{
    M5.Lcd.fillCircle(x + 8, y + 8, 2, WHITE);
    M5.Lcd.fillCircle(x + 16, y + 8, 2, WHITE);
    M5.Lcd.drawCircle(x + 5, y + 14, 2, accent);
    M5.Lcd.drawCircle(x + 19, y + 14, 2, accent);
    M5.Lcd.drawLine(x + 8, y + 18, x + 16, y + 18, WHITE);
}

void drawFaceCoco(int x, int y, uint16_t accent)
{
    M5.Lcd.drawLine(x + 4, y + 6, x + 10, y + 4, WHITE);
    M5.Lcd.drawLine(x + 20, y + 6, x + 14, y + 4, WHITE);
    M5.Lcd.fillCircle(x + 8, y + 9, 1, accent);
    M5.Lcd.fillCircle(x + 16, y + 9, 1, accent);
    drawArcApprox(x + 12, y + 18, 7, 200, 340, WHITE);
}

void drawKidFace(int index, int x, int y, uint16_t accent)
{
    if (index == 0)
        drawFaceFelix(x, y, accent);
    else if (index == 1)
        drawFaceJuno(x, y, accent);
    else
        drawFaceCoco(x, y, accent);
}

// ---------- Screen drawing ----------
void drawMain()
{
    M5.Lcd.fillScreen(BLACK);
    drawTopBar();

    uint16_t c = kidColour(currentKid);

    M5.Lcd.setTextColor(c, BLACK);
    M5.Lcd.setTextSize(3);
    M5.Lcd.setCursor(10, NAME_Y);
    M5.Lcd.println(kids[currentKid].name);

    drawKidFace(currentKid, 12, FACE_Y, c);

    // Balance
    M5.Lcd.setTextColor(WHITE, BLACK);
    M5.Lcd.setTextSize(1);
    M5.Lcd.setCursor(10, 92);
    M5.Lcd.println("Balance");

    printGBP(kids[currentKid].visiblePence, c, 2, 10, 108);

    if (kids[currentKid].hasPending && kids[currentKid].pendingPence > 0)
    {
        M5.Lcd.setTextColor(WHITE, BLACK);
        M5.Lcd.setTextSize(1);
        M5.Lcd.setCursor(10, 134);
        M5.Lcd.print("+ ");
        M5.Lcd.write(156);
        int pounds = kids[currentKid].pendingPence / 100;
        int pennies = abs(kids[currentKid].pendingPence % 100);
        M5.Lcd.printf("%d.%02d waiting", pounds, pennies);
    }

    // Hint
    M5.Lcd.setTextColor(WHITE, BLACK);
    M5.Lcd.setTextSize(1);
    M5.Lcd.setCursor(10, 178);
    M5.Lcd.println("A: next kid");
    M5.Lcd.setCursor(10, 192);
    M5.Lcd.println("B: menu");
}

void drawMenu()
{
    M5.Lcd.fillScreen(BLACK);
    drawTopBar();

    M5.Lcd.setTextColor(WHITE, BLACK);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setCursor(10, TITLE_Y);
    M5.Lcd.println("Menu");

    // Items:
    // 0 Accept money (disabled if none)
    // 1 Transfer money
    // 2 Back
    const char *items[3] = {"Accept money", "Transfer money", "Back"};

    for (int i = 0; i < 3; i++)
    {
        int y = BODY_Y + i * 28;
        bool selected = (i == menuIndex);

        bool disabled = (i == 0) && !(kids[currentKid].hasPending && kids[currentKid].pendingPence > 0);
        uint16_t fg = disabled ? 0x528A : WHITE;

        if (selected)
        {
            M5.Lcd.fillRect(6, y - 2, SCREEN_W - 12, 22, 0x18E3); // dark highlight
        }

        M5.Lcd.setTextSize(1);
        M5.Lcd.setTextColor(fg, selected ? 0x18E3 : BLACK);
        M5.Lcd.setCursor(12, y);
        M5.Lcd.println(items[i]);
    }

    M5.Lcd.setTextColor(WHITE, BLACK);
    M5.Lcd.setTextSize(1);
    M5.Lcd.setCursor(10, FOOT_Y);
    M5.Lcd.println("B: next  A: select");
}

void drawPickRecipient()
{
    M5.Lcd.fillScreen(BLACK);
    drawTopBar();

    M5.Lcd.setTextColor(WHITE, BLACK);
    M5.Lcd.setTextSize(1);
    M5.Lcd.setCursor(10, TITLE_Y);
    M5.Lcd.printf("%s sending to...", kids[currentKid].name);

    // Build list: two other kids + Back
    int options[3];
    int n = 0;
    for (int i = 0; i < 3; i++)
        if (i != currentKid)
            options[n++] = i;
    options[n++] = -1; // Back sentinel

    for (int i = 0; i < 3; i++)
    {
        int y = BODY_Y + i * 28;
        bool selected = (i == menuIndex);
        if (selected)
            M5.Lcd.fillRect(6, y - 2, SCREEN_W - 12, 22, 0x18E3);

        if (options[i] == -1)
        {
            M5.Lcd.setTextColor(WHITE, selected ? 0x18E3 : BLACK);
            M5.Lcd.setCursor(12, y);
            M5.Lcd.println("Back");
        }
        else
        {
            uint16_t c = kidColour(options[i]);
            M5.Lcd.setTextColor(c, selected ? 0x18E3 : BLACK);
            M5.Lcd.setCursor(12, y);
            M5.Lcd.println(kids[options[i]].name);
        }
    }

    M5.Lcd.setTextColor(WHITE, BLACK);
    M5.Lcd.setTextSize(1);
    M5.Lcd.setCursor(10, FOOT_Y);
    M5.Lcd.println("B: next  A: select");
}

static const int CHIP_VALUES_PENCE[] = {100, 50, 20, 10, 5, 1};
static const char *CHIP_LABELS[] = {"1", "50p", "20p", "10p", "5p", "1p"};
// Amount screen menu items:
// 0..5 chips, 6 Send, 7 Back
static const int AMOUNT_MENU_COUNT = 8;

void drawAmount()
{
    M5.Lcd.fillScreen(BLACK);
    drawTopBar();

    // Header: Felix -> Juno
    M5.Lcd.setTextSize(1);
    M5.Lcd.setTextColor(WHITE, BLACK);
    M5.Lcd.setCursor(10, TITLE_Y);
    M5.Lcd.printf("%s -> %s", kids[currentKid].name, kids[recipientIndex].name);

    // Total
    M5.Lcd.setTextSize(1);
    M5.Lcd.setCursor(10, 62);
    M5.Lcd.println("Amount");
    printGBP(transferTotalPence, WHITE, 3, 10, AMOUNT_Y);

    // Current selection box (single, readable)
    int boxY = 150;
    M5.Lcd.fillRect(8, boxY, SCREEN_W - 16, 34, 0x18E3);
    M5.Lcd.drawRect(8, boxY, SCREEN_W - 16, 34, WHITE);

    M5.Lcd.setTextSize(2);
    M5.Lcd.setTextColor(WHITE, 0x18E3);
    M5.Lcd.setCursor(14, boxY + 8);

    if (menuIndex >= 0 && menuIndex <= 5)
    {
        M5.Lcd.print("+ ");
        if (menuIndex == 0)
        {
            M5.Lcd.write(156); // £ glyph
            M5.Lcd.println("1");
        }
        else
        {
            M5.Lcd.println(CHIP_LABELS[menuIndex]);
        }
    }
    else if (menuIndex == 6)
    {
        // Send (greyed if total=0)
        if (transferTotalPence <= 0)
        {
            M5.Lcd.setTextColor(0x528A, 0x18E3);
            M5.Lcd.println("Send");
        }
        else
        {
            M5.Lcd.println("Send");
        }
    }
    else
    {
        M5.Lcd.println("Back");
    }

    // Minimal hints (one line only, no overlap)
    M5.Lcd.setTextSize(1);
    M5.Lcd.setTextColor(WHITE, BLACK);
    M5.Lcd.setCursor(10, 200);
    M5.Lcd.println("B next (hold=repeat)  A select  C undo");
}

void drawSentToast()
{
    M5.Lcd.fillScreen(BLACK);
    drawTopBar();

    M5.Lcd.setTextColor(WHITE, BLACK);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setCursor(10, 60);
    M5.Lcd.println("Sent");

    // Amount
    printGBP(lastSentPence, WHITE, 3, 10, 100);

    // To who
    M5.Lcd.setTextSize(1);
    M5.Lcd.setCursor(10, 150);
    if (lastSentToIdx >= 0)
    {
        M5.Lcd.printf("to %s", kids[lastSentToIdx].name);
    }

    // no buttons here; it auto-dismisses
}

// ---------- Animation ----------
void animateAcceptCountUp(int fromPence, int toPence)
{
    const int steps = 16;
    const int totalMs = 800;
    const int stepDelay = totalMs / steps;

    for (int i = 0; i <= steps; i++)
    {
        int v = fromPence + (int)((long)(toPence - fromPence) * i / steps);
        // redraw only the total line region (cheap method: just redraw whole main for now)
        // keeping it scrappy: redraw main but it’s still quick on this screen size
        kids[currentKid].visiblePence = v;
        drawMain();
        delay(stepDelay);
    }
    kids[currentKid].visiblePence = toPence;
}

// ---------- Amount stack helpers ----------
void resetAmountBuilder()
{
    transferTotalPence = 0;
    chipStackLen = 0;
    for (int i = 0; i < STACK_MAX; i++)
        chipStack[i] = 0;
    menuIndex = 0;
}

void pushChip(int pence)
{
    if (chipStackLen >= STACK_MAX)
        return;
    chipStack[chipStackLen++] = pence;
    transferTotalPence += pence;
}

void undoChip()
{
    if (chipStackLen <= 0)
        return;
    int last = chipStack[--chipStackLen];
    transferTotalPence -= last;
    if (transferTotalPence < 0)
        transferTotalPence = 0;
}

// ---------- Navigation helpers ----------
void go(Screen s)
{
    screen = s;
    if (screen == SCR_MAIN)
        drawMain();
    else if (screen == SCR_MENU)
        drawMenu();
    else if (screen == SCR_PICK_RECIPIENT)
        drawPickRecipient();
    else if (screen == SCR_AMOUNT)
        drawAmount();
    else if (screen == SCR_SENT_TOAST)
        drawSentToast();
}

// ---------- Sleep helpers ----------
static const uint8_t SCREEN_BRIGHTNESS_FULL = 15; // max brightness
static const uint8_t SCREEN_BRIGHTNESS_DIM = 7;   // minimum visible

void goToSleepScreenOnly()
{
    screenSleeping = true;
    M5.Axp.ScreenBreath(SCREEN_BRIGHTNESS_DIM);
}

void wakeFromSleepScreenOnly()
{
    screenSleeping = false;

    // Force brightness back on with small delays to ensure AXP192 responds
    M5.Axp.ScreenBreath(SCREEN_BRIGHTNESS_FULL);
    delay(20);
    M5.Axp.ScreenBreath(SCREEN_BRIGHTNESS_FULL);

    // Redraw current screen
    if (screen == SCR_MAIN)
        drawMain();
    else if (screen == SCR_MENU)
        drawMenu();
    else if (screen == SCR_PICK_RECIPIENT)
        drawPickRecipient();
    else if (screen == SCR_AMOUNT)
        drawAmount();
    else if (screen == SCR_SENT_TOAST)
        drawSentToast();
}

// ---------- Input handling ----------
void handleMain()
{
    if (gPressA)
    {
        currentKid = (currentKid + 1) % 3;
        drawMain();
    }

    if (gPressB)
    {
        menuIndex = 0;
        go(SCR_MENU);
    }
}

void handleMenu()
{
    if (gPressB)
    {
        menuIndex = (menuIndex + 1) % 3;
        drawMenu();
    }

    if (gPressA)
    {
        // 0 Accept, 1 Transfer, 2 Back
        if (menuIndex == 0)
        {
            bool canAccept = (kids[currentKid].hasPending && kids[currentKid].pendingPence > 0);
            if (!canAccept)
            {
                showToast("No money waiting", 800);
                return;
            }

            int fromP = 0, toP = 0;
            showToast("Accepting...", 600);
            if (acceptPendingForKid(currentKid, fromP, toP))
            {
                animateAcceptCountUp(fromP, toP);
                showToast("Accepted!", 900);
                fetchStatusAllKids();
                go(SCR_MAIN);
            }
            else
            {
                showToast("Accept failed", 900);
            }
        }
        else if (menuIndex == 1)
        {
            // Transfer
            menuIndex = 0;
            recipientIndex = -1;
            go(SCR_PICK_RECIPIENT);
        }
        else
        {
            // Back
            go(SCR_MAIN);
        }
    }
}

void handlePickRecipient()
{
    // options: two kids + back
    if (gPressB)
    {
        menuIndex = (menuIndex + 1) % 3;
        drawPickRecipient();
    }

    if (gPressA)
    {
        int options[3];
        int n = 0;
        for (int i = 0; i < 3; i++)
            if (i != currentKid)
                options[n++] = i;
        options[n++] = -1;

        int picked = options[menuIndex];
        if (picked == -1)
        {
            menuIndex = 0;
            go(SCR_MENU);
            return;
        }

        recipientIndex = picked;
        resetAmountBuilder();
        go(SCR_AMOUNT);
    }
}

void handleAmountRepeatHold()
{
    // Alternative 2: hold B to repeat-add the currently selected chip
    static bool holdingB = false;
    static unsigned long holdStartMs = 0;
    static unsigned long lastRepeatMs = 0;

    if (M5.BtnB.isPressed())
    {
        unsigned long now = millis();
        if (!holdingB)
        {
            holdingB = true;
            holdStartMs = now;
            lastRepeatMs = now;
        }
        else
        {
            if (now - holdStartMs >= HOLD_REPEAT_START_MS)
            {
                if (now - lastRepeatMs >= HOLD_REPEAT_EVERY_MS)
                {
                    lastRepeatMs = now;

                    // Only repeat if a chip item is selected (0..5)
                    if (menuIndex >= 0 && menuIndex <= 5)
                    {
                        pushChip(CHIP_VALUES_PENCE[menuIndex]);
                        drawAmount();
                    }
                }
            }
        }
    }
    else
    {
        holdingB = false;
    }
}

void handleAmount()
{
    // C (power btn via AXP): undo last
    if (gPressC)
    {
        if (chipStackLen > 0)
        {
            undoChip();
            drawAmount();
        }
        else
        {
            showToast("Nothing to undo", 700);
        }
    }

    // Tap B: next item
    if (gPressB)
    {
        menuIndex = (menuIndex + 1) % AMOUNT_MENU_COUNT;
        drawAmount();
    }

    // Hold B: repeat add (handled continuously)
    handleAmountRepeatHold();

    // A: add/select
    if (gPressA)
    {
        if (menuIndex >= 0 && menuIndex <= 5)
        {
            pushChip(CHIP_VALUES_PENCE[menuIndex]);
            drawAmount();
        }
        else if (menuIndex == 6)
        {
            // Send
            if (transferTotalPence <= 0)
            {
                showToast("Set an amount", 800);
                return;
            }

            // optimistic UX: attempt transfer, then return main
            showToast("Sending...", 800);

            String err;
            bool ok = postTransfer(currentKid, recipientIndex, transferTotalPence, "", err);

            if (ok)
            {
                fetchStatusAllKids();

                lastSentPence = transferTotalPence;
                lastSentToIdx = recipientIndex;

                toastUntilMs = millis() + 1000; // use as screen timer
                screen = SCR_SENT_TOAST;
                drawSentToast();
            }
            else
            {
                if (err == "insufficient funds")
                    showToast("Not enough money", 1200);
                else
                    showToast("Transfer failed", 1200);
            }
        }
        else
        {
            // Back
            menuIndex = 0;
            go(SCR_MENU);
        }
    }
}

// ---------- Setup / loop ----------
void setup()
{
    M5.begin();
    M5.Axp.ScreenBreath(SCREEN_BRIGHTNESS_FULL); // set known brightness on boot
    M5.Lcd.setRotation(0);
    M5.Lcd.fillScreen(BLACK);

    M5.Lcd.setTextColor(WHITE, BLACK);
    M5.Lcd.setTextSize(1);
    M5.Lcd.setCursor(10, 40);
    M5.Lcd.println("Connecting Wi-Fi...");

    WiFi.begin(WIFI_SSID, WIFI_PASS);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(250);
        if (millis() - start > 12000)
            break;
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        M5.Lcd.setCursor(10, 60);
        M5.Lcd.println("Wi-Fi ok");
    }
    else
    {
        M5.Lcd.setCursor(10, 60);
        M5.Lcd.println("Wi-Fi failed");
    }

    fetchStatusAllKids();
    go(SCR_MAIN);

    lastInteractionMs = millis();
}

void loop()
{
    M5.update();

    // --- Read buttons once per loop ---
    uint8_t pwrPress = M5.Axp.GetBtnPress(); // event-based (fine for actions)
    bool pressA = M5.BtnA.wasPressed();
    bool pressB = M5.BtnB.wasPressed();
    bool pressC = (pwrPress == 0x02);

    gPressA = pressA;
    gPressB = pressB;
    gPressC = pressC;

    // --- Wake detection should be level-based ---
    bool anyWake = M5.BtnA.isPressed() || M5.BtnB.isPressed() || pressC;

    if (anyWake)
    {
        lastInteractionMs = millis();
        if (screenSleeping)
        {
            wakeFromSleepScreenOnly();
            return; // swallow wake press
        }
    }

    clearToastIfExpired();

    // Global timed refresh
    if (millis() - lastPollMs >= POLL_INTERVAL_MS)
    {
        fetchStatusAllKids();
        // light refresh
        drawTopBar();
    }
    if (!screenSleeping && (millis() - lastInteractionMs > SLEEP_AFTER_MS))
    {
        goToSleepScreenOnly();
        return;
    }
    if (millis() - lastTopbarMs >= TOPBAR_REFRESH_MS)
    {
        drawTopBar();
        lastTopbarMs = millis();
    }

    // Screen-specific input handling
    if (screen == SCR_MAIN)
        handleMain();
    else if (screen == SCR_MENU)
        handleMenu();
    else if (screen == SCR_PICK_RECIPIENT)
        handlePickRecipient();
    else if (screen == SCR_AMOUNT)
        handleAmount();
    else if (screen == SCR_SENT_TOAST)
    {
        // auto-dismiss back to main after toast expires
        // (toastUntilMs might already be cleared by clearToastIfExpired)
        if (toastUntilMs == 0 || millis() > toastUntilMs)
        {
            toastUntilMs = 0;
            go(SCR_MAIN);
        }
    }

    delay(10);
}