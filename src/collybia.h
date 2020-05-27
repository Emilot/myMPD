#ifndef __COLLYBIA_H__
#define __COLLYBIA_H__

struct memory_struct
{
    char *memory;
    size_t size;
};

size_t write_callback(void *contents, size_t size, size_t nmemb, void *userp);
int collybia_settings_set(t_mympd_state *mympd_state, bool mpd_conf_changed,
                       bool ns_changed, bool airplay_changed,
                       bool roon_changed, bool spotify_changed, bool dac_changed);
sds collybia_check_for_updates(sds buffer, sds method, int request_id);
sds collybia_install_updates(sds buffer, sds method, int request_id);
#endif
