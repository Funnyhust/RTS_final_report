/**
 * @file ntp_sync.c
 * @brief NTP Time Synchronization Implementation
 * 
 * Đồng bộ thời gian ESP32 với NTP server để tính latency chính xác.
 */

#include "ntp_sync.h"
#include "esp_log.h"
#include "esp_sntp.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <string.h>
#include <sys/time.h>

static const char *TAG = "NTP_SYNC";

// NTP Servers (multiple for redundancy)
#define NTP_SERVER_PRIMARY   "pool.ntp.org"
#define NTP_SERVER_SECONDARY "time.google.com"
#define NTP_SERVER_TERTIARY  "time.cloudflare.com"

// Thời gian tối thiểu hợp lệ (1/1/2024 00:00:00 UTC)
#define MIN_VALID_EPOCH      1704067200

static bool g_ntp_synced = false;


/**
 * @brief Callback khi NTP sync hoàn tất
 */
static void ntp_sync_notification_cb(struct timeval *tv)
{
    ESP_LOGI(TAG, "NTP Sync completed!");
    
    time_t now = tv->tv_sec;
    struct tm timeinfo;
    localtime_r(&now, &timeinfo);
    
    char time_str[64];
    strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", &timeinfo);
    ESP_LOGI(TAG, "Current time: %s (epoch: %lld)", time_str, (long long)now);
    
    g_ntp_synced = true;
}


int ntp_sync_init(const char *timezone)
{
    ESP_LOGI(TAG, "Initializing NTP sync...");
    
    // Set timezone (VN = UTC+7)
    if (timezone == NULL) {
        timezone = "ICT-7";  // Vietnam timezone
    }
    setenv("TZ", timezone, 1);
    tzset();
    
    ESP_LOGI(TAG, "Timezone set to: %s", timezone);
    
    // Configure SNTP
    esp_sntp_setoperatingmode(SNTP_OPMODE_POLL);
    
    // Set multiple NTP servers for redundancy
    esp_sntp_setservername(0, NTP_SERVER_PRIMARY);
    esp_sntp_setservername(1, NTP_SERVER_SECONDARY);
    esp_sntp_setservername(2, NTP_SERVER_TERTIARY);
    
    // Set sync callback
    sntp_set_time_sync_notification_cb(ntp_sync_notification_cb);
    
    // Set sync interval (mặc định 1 giờ, có thể điều chỉnh)
    // esp_sntp_set_sync_interval(3600000);  // 1 hour in ms
    
    // Sync mode: smooth adjustment (không nhảy đột ngột)
    esp_sntp_set_sync_mode(SNTP_SYNC_MODE_SMOOTH);
    
    // Start SNTP
    esp_sntp_init();
    
    ESP_LOGI(TAG, "NTP initialized with servers: %s, %s, %s",
             NTP_SERVER_PRIMARY, NTP_SERVER_SECONDARY, NTP_SERVER_TERTIARY);
    
    return 0;
}


bool ntp_sync_wait(uint32_t timeout_ms)
{
    ESP_LOGI(TAG, "Waiting for NTP sync (timeout: %lu ms)...", (unsigned long)timeout_ms);
    
    uint32_t elapsed = 0;
    const uint32_t check_interval = 100;  // Check every 100ms
    
    while (elapsed < timeout_ms) {
        time_t now = 0;
        time(&now);
        
        // Kiểm tra xem thời gian đã hợp lệ chưa (sau 2024)
        if (now > MIN_VALID_EPOCH) {
            g_ntp_synced = true;
            
            struct tm timeinfo;
            localtime_r(&now, &timeinfo);
            
            char time_str[64];
            strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", &timeinfo);
            ESP_LOGI(TAG, "NTP sync successful! Time: %s", time_str);
            
            return true;
        }
        
        vTaskDelay(pdMS_TO_TICKS(check_interval));
        elapsed += check_interval;
    }
    
    ESP_LOGW(TAG, "NTP sync timeout after %lu ms", (unsigned long)timeout_ms);
    return false;
}


bool ntp_sync_is_synced(void)
{
    if (g_ntp_synced) {
        return true;
    }
    
    // Double check với epoch time
    time_t now = 0;
    time(&now);
    
    if (now > MIN_VALID_EPOCH) {
        g_ntp_synced = true;
        return true;
    }
    
    return false;
}


uint64_t ntp_sync_get_timestamp_ms(void)
{
    struct timeval tv;
    gettimeofday(&tv, NULL);
    
    // Kiểm tra tính hợp lệ
    if (tv.tv_sec < MIN_VALID_EPOCH) {
        ESP_LOGW(TAG, "Time not synced yet! Using relative time.");
        // Trả về 0 hoặc có thể dùng esp_log_timestamp() cho relative time
        return 0;
    }
    
    return (uint64_t)tv.tv_sec * 1000ULL + (uint64_t)tv.tv_usec / 1000ULL;
}


void ntp_sync_resync(void)
{
    ESP_LOGI(TAG, "Forcing NTP resync...");
    
    g_ntp_synced = false;
    
    // Restart SNTP
    esp_sntp_stop();
    esp_sntp_init();
}


int ntp_sync_get_time_string(char *buffer, size_t buffer_size)
{
    if (buffer == NULL || buffer_size < 20) {
        return -1;
    }
    
    time_t now = 0;
    struct tm timeinfo = {0};
    
    time(&now);
    localtime_r(&now, &timeinfo);
    
    strftime(buffer, buffer_size, "%Y-%m-%d %H:%M:%S", &timeinfo);
    
    return 0;
}
