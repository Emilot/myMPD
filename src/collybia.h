#ifndef __COLLYBIA_H__
#define __COLLYBIA_H__

extern pthread_mutex_t lock;

typedef struct memory_struct
{
    char *memory;
    size_t size;
} memory_struct;

void collybia_init(void);
void collybia_cleanup(void);
void collybia_dc_handle(int *dc);
int collybia_settings_set(t_mympd_state *mympd_state, bool mpd_conf_changed, bool ns_changed, bool apmode_changed, bool airplay_changed, bool roon_changed, bool spotify_changed, bool dac_changed, bool ffmpeg_changed, bool wifi_changed);
sds collybia_ns_server_list(sds buffer, sds method, int request_id);
sds collybia_wifi_server_list(sds buffer, sds method, int request_id);
sds collybia_wifi_connect(sds buffer, sds method, int request_id);
sds collybia_update_check(sds buffer, sds method, int request_id);
sds collybia_update_install(sds buffer, sds method, int request_id);
#endif
