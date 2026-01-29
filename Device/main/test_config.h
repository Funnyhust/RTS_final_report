#ifndef TEST_CONFIG_H
#define TEST_CONFIG_H

#include <stdint.h>

// NVS Key
#define NVS_NAMESPACE "storage"
#define NVS_KEY_TEST_ID "test_case_id"

// Test Case IDs
typedef enum {
    TEST_CASE_NORMAL = 0x00,

    // Performance & Stress (RTS Critical)
    TEST_CASE_RTS_01 = 0x01, // WCRT under Load
    TEST_CASE_RTS_02 = 0x02, // Jitter
    TEST_CASE_RTS_03 = 0x03, // Network Lag
    TEST_CASE_RTS_04 = 0x04, // Message Burst
    TEST_CASE_RTS_05 = 0x05, // Async DB

    // Basic Sanity
    TEST_CASE_BSC_01 = 0x11, // Smoke/Gas
    TEST_CASE_BSC_02 = 0x12, // Flame
    TEST_CASE_BSC_03 = 0x13, // Multi-sensor
    TEST_CASE_BSC_04 = 0x14, // Alarm Offline
    TEST_CASE_BSC_05 = 0x15, // Reset
    TEST_CASE_BSC_06 = 0x16, // Auto Reconnect
    TEST_CASE_BSC_07 = 0x17, // MQTT QoS 2
    TEST_CASE_BSC_08 = 0x18  // Telemetry Heartbeat
} test_case_id_t;

// Function prototypes
void run_test_case(uint8_t id);

#endif // TEST_CONFIG_H
