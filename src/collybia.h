#ifndef __COLLYBIA_H__
#define __COLLYBIA_H__

int collybia_settings_set(t_mympd_state *mympd_state, bool mpd_conf_changed,
                       bool ns_changed, bool apmode_changed, bool airplay_changed,
                       bool roon_changed, bool spotify_changed, bool dac_changed, bool ffmpeg_changed, bool wifi_changed);
sds collybia_ns_server_list(sds buffer, sds method, int request_id);
sds collybia_wifi_server_list(sds buffer, sds method, int request_id);
sds collybia_update_check(sds buffer, sds method, int request_id);
sds collybia_update_install(sds buffer, sds method, int request_id);
void ideon_test(void);
#endif
