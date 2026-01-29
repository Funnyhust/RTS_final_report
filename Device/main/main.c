
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "cJSON.h"

#include "sensor/sensor.h"
#include "buzzer/buzzer.h"
#include "wifi/wifi.h"
#include "esp_sntp.h"
#include <time.h>
#include <sys/time.h>
#include "mqtt/mqtt.h"
#include "esp_timer.h"

#include "nvs_flash.h"
#include "nvs.h"
#include "driver/uart.h"
#include "test_config.h"
#include "config.h" // Chứa CONFIG_USE_SIMULATION

#ifndef CONFIG_USE_SIMULATION
    #include "sensor/sensor.h"
    #include "buzzer/buzzer.h"
#endif

static const char *TAG = "MAIN";

// Cấu hình hệ thống
#define WIFI_SSID "Duong"
#define WIFI_PASSWORD "12345678"

#define MQTT_BROKER_URI "mqtt://10.170.139.67:1883"
#define MQTT_USERNAME ""  // Để trống nếu broker local không yêu cầu
#define MQTT_PASSWORD ""  
#define MQTT_CLIENT_ID "fire_system_esp32"
#define MQTT_USE_TLS false

#define BUZZER_GPIO_PIN GPIO_NUM_25

// UART Config
#define UART_PORT_NUM      UART_NUM_0
#define UART_BAUD_RATE     115200
#define UART_BUF_SIZE      1024

// Biến toàn cục
// Biến toàn cục
sensor_status_t g_sensor_status;

#ifndef CONFIG_USE_SIMULATION
    buzzer_t g_buzzer;
#endif

wifi_manager_t g_wifi_manager;
mqtt_config_t g_mqtt_config;

// --- UART & NVS Helper Functions ---

void init_nvs(void) {
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
      ESP_ERROR_CHECK(nvs_flash_erase());
      ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
}

void set_test_case_id(uint8_t id) {
    nvs_handle_t my_handle;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READWRITE, &my_handle);
    if (err == ESP_OK) {
        err = nvs_set_u8(my_handle, NVS_KEY_TEST_ID, id);
        if (err == ESP_OK) nvs_commit(my_handle);
        nvs_close(my_handle);
    }
}

uint8_t get_test_case_id(void) {
    nvs_handle_t my_handle;
    uint8_t id = 0; // Default normal
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READONLY, &my_handle);
    if (err == ESP_OK) {
        nvs_get_u8(my_handle, NVS_KEY_TEST_ID, &id);
        nvs_close(my_handle);
    }
    return id;
}

void uart_command_task(void *arg) {
    uart_config_t uart_config = {
        .baud_rate = UART_BAUD_RATE,
        .data_bits = UART_DATA_8_BITS,
        .parity    = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_APB,
    };
    uart_driver_install(UART_PORT_NUM, UART_BUF_SIZE * 2, 0, 0, NULL, 0);
    uart_param_config(UART_PORT_NUM, &uart_config);

    uint8_t *data = (uint8_t *) malloc(UART_BUF_SIZE);
    
    ESP_LOGI(TAG, "UART Command Listener Started. Send '0xAD 0xID' to switch mode.");

    while (1) {
        int len = uart_read_bytes(UART_PORT_NUM, data, UART_BUF_SIZE, 20 / portTICK_PERIOD_MS);
        if (len >= 2) {
            // Check for pattern 0xAD 0x**
            // Scan buffer
            for (int i = 0; i < len - 1; i++) {
                if (data[i] == 0xAD) {
                    uint8_t new_id = data[i+1];
                    ESP_LOGW(TAG, "RECEIVED COMMAND: Switch to Test Case 0x%02X", new_id);
                    
                    set_test_case_id(new_id);
                    ESP_LOGW(TAG, "Saved to NVS. Restarting system...");
                    vTaskDelay(pdMS_TO_TICKS(100)); // Wait for log to flush
                    esp_restart();
                }
            }
        }
    }
    free(data);
}

// --- ORIGINAL APP FUNCTIONS ---

void obtain_time(void)
{
    ESP_LOGI(TAG, "========================================");
    ESP_LOGI(TAG, "Initializing NTP Time Synchronization...");
    ESP_LOGI(TAG, "========================================");
    
    // Set timezone TRƯỚC khi sync (Vietnam = UTC+7)
    setenv("TZ", "ICT-7", 1);
    tzset();
    
    // Configure SNTP với nhiều server để tăng độ tin cậy
    esp_sntp_setoperatingmode(SNTP_OPMODE_POLL);
    esp_sntp_setservername(0, "pool.ntp.org");
    esp_sntp_setservername(1, "time.google.com");
    esp_sntp_setservername(2, "time.cloudflare.com");
    
    // Smooth sync để tránh nhảy đột ngột
    esp_sntp_set_sync_mode(SNTP_SYNC_MODE_SMOOTH);
    
    esp_sntp_init();

    time_t now = 0;
    struct tm timeinfo = { 0 };
    int retry = 0;
    const int retry_count = 15;  // Tăng lên 15 lần, mỗi lần 2s = max 30s
    
    // Thời gian tối thiểu hợp lệ: 1/1/2024 00:00:00 UTC
    const time_t MIN_VALID_TIME = 1704067200;
    
    while (retry < retry_count) {
        time(&now);
        
        // Kiểm tra xem thời gian đã hợp lệ chưa
        if (now > MIN_VALID_TIME) {
            localtime_r(&now, &timeinfo);
            char strftime_buf[64];
            strftime(strftime_buf, sizeof(strftime_buf), "%Y-%m-%d %H:%M:%S", &timeinfo);
            
            ESP_LOGI(TAG, "========================================");
            ESP_LOGI(TAG, "NTP SYNC SUCCESS!");
            ESP_LOGI(TAG, "Current time: %s (UTC+7)", strftime_buf);
            ESP_LOGI(TAG, "Unix epoch: %lld", (long long)now);
            ESP_LOGI(TAG, "========================================");
            return;
        }
        
        retry++;
        ESP_LOGI(TAG, "Waiting for NTP sync... (%d/%d)", retry, retry_count);
        vTaskDelay(pdMS_TO_TICKS(2000));
    }
    
    // Nếu không sync được, log warning nhưng vẫn tiếp tục
    ESP_LOGW(TAG, "========================================");
    ESP_LOGW(TAG, "NTP SYNC FAILED after %d retries!", retry_count);
    ESP_LOGW(TAG, "Timestamps will use relative time (esp_log_timestamp)");
    ESP_LOGW(TAG, "Latency measurements may be inaccurate!");
    ESP_LOGW(TAG, "========================================");
}

#ifdef CONFIG_USE_SIMULATION
// --- SIMULATION MODE TASK ---
void simulation_task(void *pvParameters)
{
    ESP_LOGW(TAG, "Simulation Task Started (Hardware Disabled)");
    
    // Init fake data
    g_sensor_status.smoke.normalized_value = 0.1f;
    g_sensor_status.temperature.normalized_value = 25.0f;
    g_sensor_status.gas.normalized_value = 0.05f;
    g_sensor_status.ir_flame.is_triggered = false;
    g_sensor_status.fire_detected = false;

    // Random seed
    srand((unsigned int)esp_timer_get_time());

    while (1) {
        // Random walk simulation
        g_sensor_status.smoke.normalized_value += ((float)(rand() % 10) - 5.0f) / 100.0f;
        if (g_sensor_status.smoke.normalized_value < 0.0f) g_sensor_status.smoke.normalized_value = 0.0f;
        if (g_sensor_status.smoke.normalized_value > 1.0f) g_sensor_status.smoke.normalized_value = 1.0f;

        g_sensor_status.temperature.normalized_value += ((float)(rand() % 10) - 4.0f) / 10.0f; // Temp thay đổi chậm hơn
        
        g_sensor_status.gas.normalized_value += ((float)(rand() % 10) - 5.0f) / 200.0f;
        if (g_sensor_status.gas.normalized_value < 0.0f) g_sensor_status.gas.normalized_value = 0.0f;

        // Giả lập phát hiện cháy nếu smoke > 0.8
        if (g_sensor_status.smoke.normalized_value > 0.8f) {
            g_sensor_status.fire_detected = true;
            g_sensor_status.detection_timestamp = esp_log_timestamp();
        } else {
            g_sensor_status.fire_detected = false;
        }

        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
#else
// --- HARDWARE TASKS ---
void warning_task(void *pvParameters)
{
    ESP_LOGI(TAG, "Warning task started");
    bool last_fire_state = false;
    while (1) {
        if (g_sensor_status.fire_detected) {
            if (!last_fire_state) {
                ESP_LOGW(TAG, "FIRE DETECTED! Activating alarm...");
                buzzer_set_mode(&g_buzzer, BUZZER_ALARM);
                if (mqtt_is_connected(&g_mqtt_config)) {
                    // Tạo gói tin chuẩn
                    cJSON *root = mqtt_create_payload(MQTT_CLIENT_ID, "alarm", 0);
                    cJSON *values = cJSON_GetObjectItem(root, "values");
                    
                    // Thêm dữ liệu vào "values"
                    cJSON_AddBoolToObject(values, "detected", true);
                    cJSON_AddNumberToObject(values, "smoke", g_sensor_status.smoke.normalized_value);
                    cJSON_AddNumberToObject(values, "temp", g_sensor_status.temperature.normalized_value);
                    cJSON_AddNumberToObject(values, "flame", g_sensor_status.ir_flame.is_triggered ? 1 : 0);
                    cJSON_AddNumberToObject(values, "gas", g_sensor_status.gas.normalized_value);
                    
                    char *alert_json = cJSON_Print(root);
                    if (alert_json != NULL) {
                        mqtt_publish_alert(&g_mqtt_config, alert_json);
                        free(alert_json);
                    }
                    cJSON_Delete(root);
                }
            }
            last_fire_state = true;
        } else {
            if (last_fire_state) {
                ESP_LOGI(TAG, "Fire extinguished. Deactivating alarm...");
                buzzer_set_mode(&g_buzzer, BUZZER_OFF);
                last_fire_state = false;
            }
        }
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}
#endif // CONFIG_USE_SIMULATION

void mqtt_sensor_task(void *pvParameters)
{
    ESP_LOGI(TAG, "MQTT sensor task started");
    const TickType_t delay = pdMS_TO_TICKS(5000);
    while (1) {
        if (mqtt_is_connected(&g_mqtt_config)) {
            // Tạo gói tin chuẩn
            cJSON *root = mqtt_create_payload(MQTT_CLIENT_ID, "telemetry", 0);
            cJSON *values = cJSON_GetObjectItem(root, "values");

            cJSON_AddNumberToObject(values, "smoke", g_sensor_status.smoke.normalized_value);
            cJSON_AddNumberToObject(values, "temp", g_sensor_status.temperature.normalized_value);
            cJSON_AddNumberToObject(values, "flame", g_sensor_status.ir_flame.is_triggered ? 1 : 0);
            cJSON_AddNumberToObject(values, "gas", g_sensor_status.gas.normalized_value);
            cJSON_AddBoolToObject(values, "fire_detected", g_sensor_status.fire_detected);
            
            char *json_string = cJSON_Print(root);
            if (json_string != NULL) {
                mqtt_publish_sensor_data(&g_mqtt_config, json_string);
                free(json_string);
            }
            cJSON_Delete(root);
        }
        vTaskDelay(delay);
    }
}

void mqtt_control_task(void *pvParameters)
{
    ESP_LOGI(TAG, "MQTT control task started");
    mqtt_message_t message;
    while (1) {
        if (mqtt_receive_message(&g_mqtt_config, &message, 1000)) {
            ESP_LOGI(TAG, "Received MQTT message - Topic: %s", message.topic);
            if (strstr(message.topic, "control") != NULL) {
                cJSON *json = cJSON_Parse(message.payload);
                if (json != NULL) {
                    cJSON *cmd = cJSON_GetObjectItem(json, "cmd");
                    if (cmd == NULL) cmd = cJSON_GetObjectItem(json, "command"); // Fallback
                    
                    if (cmd != NULL && cJSON_IsString(cmd)) {
                        const char *command = cJSON_GetStringValue(cmd);
                        
                        // ==== NEW: Handle SET_TEST_MODE command from Web Dashboard ====
                        if (strcmp(command, "SET_TEST_MODE") == 0) {
                            cJSON *test_id_json = cJSON_GetObjectItem(json, "test_case_id");
                            if (test_id_json != NULL && cJSON_IsNumber(test_id_json)) {
                                uint8_t new_test_id = (uint8_t)test_id_json->valueint;
                                
                                ESP_LOGW(TAG, "========================================");
                                ESP_LOGW(TAG, "  WEB COMMAND: Switch to Test Case 0x%02X", new_test_id);
                                ESP_LOGW(TAG, "========================================");
                                
                                // Save to NVS and restart
                                set_test_case_id(new_test_id);
                                ESP_LOGW(TAG, "Saved to NVS. Restarting system in 2 seconds...");
                                
                                // Short delay to allow log flush and MQTT ACK
                                vTaskDelay(pdMS_TO_TICKS(2000));
                                esp_restart();
                            } else {
                                ESP_LOGE(TAG, "SET_TEST_MODE: Missing or invalid 'test_case_id'");
                            }
                        }
                        // ==== END NEW ====
                        
                        #ifndef CONFIG_USE_SIMULATION
                        else if (strcmp(command, "buzzer_on") == 0) buzzer_set_mode(&g_buzzer, BUZZER_NORMAL);
                        else if (strcmp(command, "buzzer_off") == 0) buzzer_set_mode(&g_buzzer, BUZZER_OFF);
                        else if (strcmp(command, "test_alarm") == 0) {
                            buzzer_set_mode(&g_buzzer, BUZZER_ALARM);
                            vTaskDelay(pdMS_TO_TICKS(3000));
                            buzzer_set_mode(&g_buzzer, BUZZER_OFF);
                        }
                        #else
                        else {
                            ESP_LOGI(TAG, "Simulation Mode: Ignoring buzzer command '%s'", command);
                        }
                        #endif
                    }
                    cJSON_Delete(json);
                }
            }
        }
    }
}


// Renamed from app_main to app_main_normal
void app_main_normal(void)
{
    ESP_LOGI(TAG, "=== Hệ thống báo cháy ESP32 khởi động (NORMAL MODE) ===");
    
    #ifndef CONFIG_USE_SIMULATION
    ESP_LOGI(TAG, "Initializing sensors (HARDWARE)...");
    if (sensor_system_init(&g_sensor_status) != 0) return;
    
    ESP_LOGI(TAG, "Initializing buzzer (HARDWARE)...");
    if (buzzer_init(&g_buzzer, BUZZER_GPIO_PIN) != 0) return;
    buzzer_set_mode(&g_buzzer, BUZZER_OFF);
    #else
    ESP_LOGW(TAG, "Initializing SIMULATION MODE...");
    #endif
    
    ESP_LOGI(TAG, "Initializing WiFi...");
    wifi_init(&g_wifi_manager, WIFI_SSID, WIFI_PASSWORD);
    wifi_connect(&g_wifi_manager);
    
    obtain_time();
    
    ESP_LOGI(TAG, "Initializing MQTT...");
    mqtt_init(&g_mqtt_config, MQTT_BROKER_URI, MQTT_USERNAME, MQTT_PASSWORD, MQTT_CLIENT_ID, MQTT_USE_TLS);
    mqtt_connect(&g_mqtt_config);
    vTaskDelay(pdMS_TO_TICKS(2000));
    
    vTaskDelay(pdMS_TO_TICKS(2000));
    
    #ifdef CONFIG_USE_SIMULATION
        xTaskCreate(simulation_task, "simulation_task", 4096, NULL, configMAX_PRIORITIES - 2, NULL);
    #else
        xTaskCreate(sensor_task, "sensor_task", 4096, &g_sensor_status, configMAX_PRIORITIES - 1, NULL);
        xTaskCreate(buzzer_task, "buzzer_task", 2048, &g_buzzer, configMAX_PRIORITIES - 2, NULL);
        xTaskCreate(warning_task, "warning_task", 4096, NULL, configMAX_PRIORITIES - 1, NULL);
    #endif

    xTaskCreate(mqtt_sensor_task, "mqtt_sensor_task", 4096, NULL, configMAX_PRIORITIES - 3, NULL);
    xTaskCreate(mqtt_control_task, "mqtt_control_task", 4096, NULL, configMAX_PRIORITIES - 3, NULL);
    xTaskCreate(mqtt_task, "mqtt_task", 4096, &g_mqtt_config, configMAX_PRIORITIES - 4, NULL);
    
    ESP_LOGI(TAG, "All tasks started. System is running...");
    while (1) {
        ESP_LOGI(TAG, "System Status - Fire: %s", g_sensor_status.fire_detected ? "DETECTED" : "Normal");
        vTaskDelay(pdMS_TO_TICKS(30000));
    }
}

// --- NEW APP MAIN ENTRY POINT ---

void app_main(void) {
    // 1. Init NVS
    init_nvs();

    // 2. Start UART Command Listener (Always runs to allow switching)
    xTaskCreate(uart_command_task, "uart_cmd", 4096, NULL, configMAX_PRIORITIES - 1, NULL);

    // 3. Read Test Case ID
    uint8_t current_test_id = get_test_case_id();

    // 4. Run Request
    run_test_case(current_test_id);
}
