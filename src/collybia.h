#ifndef __COLLYBIA_H__
#define __COLLYBIA_H__

extern pthread_mutex_t lock;

typedef struct memory_struct
{
    char *memory;
    size_t size;
} memory_struct;

void collybia_init(void);
void collybia_dc_handle(int *dc);
void collybia_cleanup(void);
sds collybia_ns_server_list(struct t_partition_state *partition_state, sds buffer, long int request_id);
sds collybia_wifi_server_list(struct t_partition_state *partition_state, sds buffer, long request_id);
sds collybia_wifi_connect(struct t_partition_state *partition_state, sds buffer, long request_id);
int collybia_settings_set(struct t_mympd_state *mympd_state, bool ns_changed, bool mpd_conf_changed, bool dac_changed, bool ffmpeg_changed, bool apmode_changed, bool airplay_changed, bool roon_changed, bool spotify_changed, bool wifi_changed);
#endif
