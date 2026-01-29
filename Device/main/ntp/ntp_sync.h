/**
 * @file ntp_sync.h
 * @brief NTP Time Synchronization for ESP32
 * 
 * Đồng bộ thời gian với NTP server ngay sau khi kết nối WiFi.
 * Quan trọng để tính toán latency chính xác.
 */

#ifndef NTP_SYNC_H
#define NTP_SYNC_H

#include <stdbool.h>
#include <stdint.h>
#include <time.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Khởi tạo và bắt đầu đồng bộ NTP
 * 
 * Gọi hàm này ngay sau khi WiFi kết nối thành công.
 * Sử dụng các NTP server: pool.ntp.org, time.google.com
 * 
 * @param timezone Timezone string (vd: "ICT-7" cho Việt Nam)
 * @return int 0 nếu thành công, -1 nếu lỗi
 */
int ntp_sync_init(const char *timezone);

/**
 * @brief Chờ cho đến khi thời gian được đồng bộ
 * 
 * Block cho đến khi NTP sync hoàn tất hoặc timeout.
 * 
 * @param timeout_ms Timeout tính bằng milliseconds
 * @return bool true nếu đồng bộ thành công, false nếu timeout
 */
bool ntp_sync_wait(uint32_t timeout_ms);

/**
 * @brief Kiểm tra xem thời gian đã được đồng bộ chưa
 * 
 * @return bool true nếu đã đồng bộ với NTP
 */
bool ntp_sync_is_synced(void);

/**
 * @brief Lấy timestamp hiện tại (milliseconds since Unix epoch)
 * 
 * @return uint64_t Timestamp hiện tại, 0 nếu chưa sync
 */
uint64_t ntp_sync_get_timestamp_ms(void);

/**
 * @brief Force resync với NTP server
 * 
 * Gọi khi cần đồng bộ lại (vd: sau khi reconnect WiFi)
 */
void ntp_sync_resync(void);

/**
 * @brief Lấy thời gian hiện tại dưới dạng chuỗi
 * 
 * @param buffer Buffer để chứa chuỗi thời gian
 * @param buffer_size Kích thước buffer
 * @return int 0 nếu thành công, -1 nếu lỗi
 */
int ntp_sync_get_time_string(char *buffer, size_t buffer_size);

#ifdef __cplusplus
}
#endif

#endif // NTP_SYNC_H
