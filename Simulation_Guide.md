# Hướng dẫn Cài đặt Chế độ Giả lập (Simulation Mode) cho ESP32

Tài liệu này hướng dẫn cách sửa đổi firmware ESP32 để tự động tạo ra dữ liệu giả (fake data) và các tình huống hệ thống (mất mạng, nghẽn CPU) để bao phủ tới 95% các Testcase mà không cần phần cứng phụ trợ.

## 1. Nguyên lý hoạt động

Chúng ta tạo ra một lớp **"Simulation Wrapper"** nằm giữa logic ứng dụng và Hardware Drivers.

*   **Input Simulation:** Giả lập ADC, GPIO (Smoke, Temp, Gas, Flame).
*   **System Simulation:** Giả lập hành vi hệ thống (Ngắt WiFi, chiếm dụng CPU, treo tác vụ).
*   **Event Injection:** Giả lập nhận lệnh từ Server (Downlink).

## 2. File header: `simulation_config.h`

```c
#ifndef SIMULATION_CONFIG_H
#define SIMULATION_CONFIG_H

// BẬT chế độ giả lập
#define ENABLE_SIMULATION_MODE  1

// Danh sách các kịch bản tương ứng với Testcase
typedef enum {
    SCENARIO_IDLE,             // Chạy nền, không có sự kiện
    
    // --- Sensor Group ---
    SCENARIO_THRESHOLD_SMOKE,  // TC-01: Khói tăng dần quá ngưỡng
    SCENARIO_THRESHOLD_TEMP,   // TC-02: Nhiệt tăng nhanh
    SCENARIO_MULTI_TRIGGER,    // TC-05: Cả Khói + Nhiệt cùng lúc
    SCENARIO_SENSOR_FAULT,     // Fake lỗi cảm biến (TC-20 simulation scenario)

    // --- Network Group --- 
    SCENARIO_WIFI_LOSS,        // TC-07, TC-12: Tự động ngắt WiFi driver
    SCENARIO_MESSAGE_STORM,    // TC-19: Spam thay đổi trạng thái liên tục

    // --- System Group ---
    SCENARIO_PRIORITY_TEST,    // TC-17: Tạo task rác chiếm CPU
    SCENARIO_WATCHDOG_TEST,    // TC-18: Treo vòng lặp vô hạn
    
    SCENARIO_MAX
} sim_scenario_t;

// Cấu trúc dữ liệu cảm biến
typedef struct {
    float smoke_val; 
    float temp_val;
    int gas_val;
    int flame_detected;
} sensor_data_t;

// Hàm API public
void sim_init(void);
void sim_run_step(sensor_data_t *data);
void sim_set_scenario(sim_scenario_t s);

#endif
```

## 3. Module giả lập: `simulation_logic.c`

```c
#include "simulation_config.h"
#include "esp_wifi.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static sim_scenario_t current_scen = SCENARIO_IDLE;
static int tick = 0;

// Task gây nhiễu để test Priority (cho TC-17)
void busy_loop_task(void *pv) {
    while(1) {
        // Vòng lặp chiếm đóng CPU, không có vTaskDelay
        // Nếu Warning Task (Priority cao hơn) vẫn chạy được => Pass
    }
}

void sim_set_scenario(sim_scenario_t s) {
    current_scen = s;
    tick = 0;
    ESP_LOGW("SIM", ">>> Chuyen sang Scenario: %d", s);
}

void sim_run_step(sensor_data_t *data) {
    tick++;
    
    // Giá trị mặc định (Bình thường)
    data->smoke_val = 10.0;
    data->temp_val = 30.0;
    data->gas_val = 100;
    data->flame_detected = 0;

    switch (current_scen) {
        case SCENARIO_IDLE:
            // Random nhẹ (Jitter) cho giống thật
            data->smoke_val += (rand() % 20) / 10.0; 
            break;

        case SCENARIO_THRESHOLD_SMOKE: // Test TC-01
            if (tick > 5) data->smoke_val = 90.0; // Vượt ngưỡng 80
            break;

        case SCENARIO_THRESHOLD_TEMP: // Test TC-02
            data->temp_val = 30.0 + (tick * 5.0); // Tăng 5 độ mỗi chu kỳ
            if (data->temp_val > 100) data->temp_val = 100;
            break;

        case SCENARIO_MULTI_TRIGGER: // Test TC-05
            if (tick > 5) {
                data->smoke_val = 95.0;
                data->temp_val = 75.0;
            }
            break;

        case SCENARIO_SENSOR_FAULT: // Sensor bị lỗi
            data->smoke_val = 4096; // Giá trị ADC kịch trần (ngắn mạch)
            break;

        case SCENARIO_WIFI_LOSS: // Test TC-07 (Báo động offline) & TC-12 (Reconnect)
            // Trigger cháy trước
            data->smoke_val = 90.0;
            
            // Sau 2 tick (1s) thì tắt WiFi nhân tạo
            if (tick == 2) {
                ESP_LOGE("SIM", "Simulating WiFi Disconnect...");
                esp_wifi_disconnect();
                esp_wifi_stop(); 
            }
            // Nếu Buzzer vẫn kêu khi WiFi stop => Pass TC-07
            
            // Sau 20 tick (10s) thì bật lại để test Reconnect (TC-12)
            if (tick == 20) {
                 ESP_LOGI("SIM", "Simulating WiFi Restore...");
                 esp_wifi_start();
                 esp_wifi_connect();
            }
            break;

        case SCENARIO_PRIORITY_TEST: // Test TC-17
            data->smoke_val = 90.0; // Trigger báo cháy liên tục
            if (tick == 1) {
                // Tạo ra 1 task spam CPU ở Priority thấp hơn Warning nhưng cao hơn Idle
                xTaskCreate(busy_loop_task, "busy", 2048, NULL, 5, NULL);
            }
            break;
            
        case SCENARIO_WATCHDOG_TEST: // Test TC-18
            if (tick == 10) {
                ESP_LOGE("SIM", "Simulating System Hang...");
                while(1); // Treo cứng tại đây, chờ WDT reset
            }
            break;
            
        case SCENARIO_MESSAGE_STORM: // Test TC-19
             // Đổi trạng thái liên tục 0->1->0->1
             data->flame_detected = (tick % 2); 
             // Quan sát log xem Queue có bị tắC không
             break;

        default: break;
    }
}
```

## 4. Cách Inject "Remote Control" (TC-13)

Để test nhận lệnh từ Server mà không cần Server thật gửi xuống, ta tạo một hàm giả lập callback MQTT.

```c
// Trong mqtt_app.c hoặc main.c

// Hàm giả lập nhận gói tin
void simulate_mqtt_incoming_command(const char* topic, const char* payload) {
    ESP_LOGI("SIM_MQTT", "Injecting Msg: Topic=%s Payload=%s", topic, payload);
    
    // Gọi trực tiếp hàm xử lý data của ứng dụng
    // Ví dụ: mqtt_data_handler(topic, strlen(topic), payload, strlen(payload));
    
    // Hoặc nếu dùng queue, thì bắn vào queue
    // xQueueSend(command_queue, &cmd, 0);
}

// Gọi hàm này trong main để test:
// simulated_mqtt_incoming_command("cmd/control", "{\"action\":\"silence\"}");
```

## 5. Bảng Mapping Testcase & Scenario Setup

Sử dụng bảng này để biết cần chạy Scenario nào cho Testcase nào:

| Testcase ID | Tên Testcase | Cách giả lập trên ESP32 |
| :--- | :--- | :--- |
| **TC-01, TC-02, TC-03, TC-04** | Sensor Alerts | Gọi `SCENARIO_THRESHOLD_...` tương ứng. Biến đổi giá trị `data->...` |
| **TC-05** | Multi-Sensor | Gọi `SCENARIO_MULTI_TRIGGER` |
| **TC-06** | Buzzer | Tự động được test khi chạy TC-01 (Check GPIO 25 Output) |
| **TC-07** | Local Alarm (Offline) | Gọi `SCENARIO_WIFI_LOSS`. Logic code sẽ tắt WiFi driver nhưng vẫn phải giữ `smoke_val` cao để kích Buzzer. |
| **TC-11** | MQTT QoS 2 | Cần check log của thư viện MQTT (`esp-mqtt`). Không thể fake trong app logic mà phải xem log debug. |
| **TC-12** | Reboot/Reconnect | `SCENARIO_WIFI_LOSS` (phần khôi phục wifi sau 10s). |
| **TC-13** | Remote Control | Gọi hàm `simulate_mqtt_incoming_command` bằng tay hoặc timer. |
| **TC-17** | Priority Inversion | `SCENARIO_PRIORITY_TEST`. Task `busy_loop` sẽ chạy đua với `WarningTask`. |
| **TC-18** | Watchdog | `SCENARIO_WATCHDOG_TEST`. Chờ 5s xem chip có reset không. |
| **TC-19** | Message Storm | `SCENARIO_MESSAGE_STORM`. |
| **TC-20** | Memory Leak | Chạy `SCENARIO_MESSAGE_STORM` qua đêm và log `esp_get_free_heap_size()`. |

**Kết luận:** Hầu hết mọi thứ (Cảm biến, Mạng, Hệ thống) đều có thể giả lập bằng Code trừ **TC-08** (Nút bấm Reset vật lý) và các yếu tố điện áp nguồn.
