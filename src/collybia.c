#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <curl/curl.h>
#include <mntent.h>
#include <pthread.h>

#include "compile_time.h"

#include "../dist/mjson/mjson.h"
#include "lib/jsonrpc.h"
#include "lib/mympd_state.h"
#include "../dist/sds/sds.h"
#include "lib/list.h"
#include "lib/log.h"
#include "lib/sds_extras.h"
#include "lib/state_files.h"
#include "lib/sds_extras.h"
#include "lib/utility.h"
#include "mpd_client/errorhandler.h"
#include "collybia.h"

#define COLLYBIAAUDIO_REPO "https://collybia.com/repo/collybia/web_version"

pthread_mutex_t lock;

static bool syscmd(const char *cmdline);
static int ns_set(int type, const char *server, const char *share, const char *vers, const char *username,
                  const char *password);

sds collybia_ns_server_list(struct t_partition_state *partition_state, sds buffer, long int request_id) {
    enum mympd_cmd_ids cmd_id = MYMPD_API_NS_SERVER_LIST;

    FILE *fp = popen("/usr/bin/nmblookup -S '*' | grep \"<00>\" | awk '{print $1}'", "r");
    // returns three lines per server found - 1st line ip address 2nd line name 3rd line workgroup
    if (fp == NULL)
    {
        MYMPD_LOG_INFO(NULL, "Failed to get server list");
        buffer = jsonrpc_respond_message(buffer, cmd_id, request_id,
	JSONRPC_FACILITY_DATABASE, JSONRPC_SEVERITY_ERROR, "Failed to get server list");
    }
    else
    {
        buffer = jsonrpc_respond_start(buffer, cmd_id, request_id);
        buffer = sdscat(buffer, "\"data\":[");
        unsigned entity_count = 0;
        char *line = NULL;
        size_t n = 0;
        sds ip_address = sdsempty();
        sds name = sdsempty();
        sds workgroup = sdsempty();
        while (getline(&line, &n, fp) > 0)
        {
            ip_address = sds_replace(ip_address, line);
            sdstrim(ip_address, "\n");
            if (getline(&line, &n, fp) < 0)
            {
                break;
            }
            name = sds_replace(name, line);
            sdstrim(name, "\n");
            if (getline(&line, &n, fp) < 0)
            {
                break;
            }
            workgroup = sds_replace(workgroup, line);
            sdstrim(workgroup, "\n");

            if (entity_count++)
            {
                buffer = sdscat(buffer, ",");
            }
            buffer = sdscat(buffer, "{");
            buffer = tojson_char(buffer, "ipAddress", ip_address, true);
            buffer = tojson_char(buffer, "name", name, true);
            buffer = tojson_char(buffer, "workgroup", workgroup, false);
            buffer = sdscat(buffer, "}");
        }
        buffer = sdscat(buffer, "],");
        buffer = tojson_long(buffer, "totalEntities", entity_count, true);
        buffer = tojson_long(buffer, "returnedEntities", entity_count, false);
        buffer = jsonrpc_end(buffer);

        mpd_response_finish(partition_state->conn);

        if (line != NULL)
        {
            free(line);
        }
        pclose(fp);
        sdsfree(ip_address);
        sdsfree(name);
        sdsfree(workgroup);
    }

    return buffer;
}

sds collybia_wifi_server_list(struct t_partition_state *partition_state, sds buffer, long request_id) {
    enum mympd_cmd_ids cmd_id = MYMPD_API_WIFI_SERVER_LIST;
    if (mympd_check_error_and_recover_respond(partition_state, &buffer, cmd_id, request_id, "mpd_search_db_songs") == false) {
        mpd_search_cancel(partition_state->conn);
        return buffer;
    }

    FILE *fp = popen("ifconfig wlan0 up;/usr/bin/iw dev wlan0 scan | grep \"SSID\" | awk '{print $2}'", "r");

    if (fp == NULL)
    {
        buffer = jsonrpc_respond_message(buffer, cmd_id, request_id,
	JSONRPC_FACILITY_DATABASE, JSONRPC_SEVERITY_ERROR, "Failed to get server list");
        MYMPD_LOG_INFO(NULL, "Failed to get server list");
    }
    else
    {
        buffer = jsonrpc_respond_start(buffer, cmd_id, request_id);
        buffer = sdscat(buffer, "\"data\":[");
        unsigned entity_count = 0;
        char *line = NULL;
        size_t n = 0;
        sds wifi_net = sdsempty();
        while (getline(&line, &n, fp) > 0)
        {
            wifi_net = sds_replace(wifi_net, line);
            sdstrim(wifi_net, "\n");
            if (getline(&line, &n, fp) < 0)
            {
                break;
            }

            if (entity_count++)
            {
                buffer = sdscat(buffer, ",");
            }
            buffer = sdscat(buffer, "{");
            buffer = tojson_char(buffer, "wifiSSID", wifi_net, false);
            buffer = sdscat(buffer, "}");
        }
        buffer = sdscat(buffer, "],");
        buffer = tojson_long(buffer, "totalEntities", entity_count, true);
        buffer = tojson_long(buffer, "returnedEntities", entity_count, false);
        buffer = jsonrpc_end(buffer);
        if (line != NULL)
        {
            free(line);
        }
        pclose(fp);
        sdsfree(wifi_net);
    }
    return buffer;
}

sds collybia_wifi_connect(struct t_partition_state *partition_state, sds buffer, long request_id) {
    enum mympd_cmd_ids cmd_id = MYMPD_API_WIFI_CONNECT;
    if (mympd_check_error_and_recover_respond(partition_state, &buffer, cmd_id, request_id, "mpd_search_db_songs") == false) {
        mpd_search_cancel(partition_state->conn);
        return buffer;
    }

    bool service = syscmd("/home/collybia/wifi_connect");

    buffer = jsonrpc_respond_start(buffer, cmd_id, request_id);
    buffer = sdscat(buffer, ",");
    buffer = tojson_bool(buffer, "service", service, false);
    buffer = jsonrpc_end(buffer);
    return buffer;
}

static bool syscmd(const char *cmdline)
{
    MYMPD_LOG_INFO(NULL, "Executing syscmd \"%s\"", cmdline);
    const int rc = system(cmdline);
    if (rc == 0)
    {
        return true;
    }
    else
    {
        MYMPD_LOG_INFO(NULL, "Executing syscmd \"%s\" failed", cmdline);
        return false;
    }
}

void collybia_dc_handle(int *dc) // todo: change return type to bool
{
    static bool handled = false;

    pthread_mutex_lock(&lock);

    if (handled == true)
    {
        MYMPD_LOG_DEBUG(NULL, "Handled dc %d", *dc);
    }
    else
    {
        MYMPD_LOG_DEBUG(NULL, "Handling dc %d", *dc);
        if (*dc != 3)
        {
            syscmd("reboot");
        }
        else
        {
            syscmd("systemctl restart mpd");
        }
    }
    *dc = 0;
    handled = !handled;

    pthread_mutex_unlock(&lock);
}

int collybia_settings_set(struct t_mympd_state *mympd_state, bool ns_changed, bool mpd_conf_changed, bool dac_changed, bool ffmpeg_changed, bool apmode_changed, bool airplay_changed, bool roon_changed, bool spotify_changed, bool wifi_changed)
{
    // TODO: error checking, revert to old values on fail
    int dc = 0;

    if (ns_changed == true)
    {
        dc = ns_set(mympd_state->ns_type, mympd_state->ns_server, mympd_state->ns_share, mympd_state->samba_version, mympd_state->ns_username, mympd_state->ns_password);
        if (dc != 0)
        {
            if (syscmd("mount -a") == true) {
                dc = 0;
            }
        }
    }
    if (mpd_conf_changed == true)
    {
        MYMPD_LOG_DEBUG(NULL, "mpd conf changed");

        const char *dop = mympd_state->dop == true ? "yes" : "no";
        sds conf = sdsnew("/etc/mpd.conf");
        sds cmdline = sdscatfmt(sdsempty(), "sed -i 's/^mixer_type.*/mixer_type \"%S\"/;s/^dop.*/dop \"%s\"/' %S",
                                mympd_state->mixer, dop, conf);
        if (syscmd(cmdline) == true && dc == 0)
        {
            dc = 3;
        }

        sdsfree(conf);
        sdsfree(cmdline);
    }
    if (dac_changed == true)
    {
      syscmd("systemctl start dac_change");
    }

    if (ffmpeg_changed == true)
    {
     if (mympd_state->ffmpeg == true)
     {
        const char *ffmpeg = mympd_state->ffmpeg == true ? "yes" : "no";
        sds conf = sdsnew("/etc/mpd.conf");
        sds cmdline = sdscatfmt(sdsempty(), "sed -E -i '0,/enabled/ s/^enabled.*/enabled \"%s\"/' %S",
                            ffmpeg, conf);
        if (syscmd(cmdline) == true && dc == 0)
        {
            dc = 3;
        }
        sdsfree(conf);
        sdsfree(cmdline);
     }
    }
    if (wifi_changed == true)
    {
     if (mympd_state->wifi == true)
     {
        const char *wifi = mympd_state->wifi == true ? "yes" : "no";
        sds conf = sdsnew("/boot/config.txt");
        sds cmdline = sdscatfmt(sdsempty(), "sed -i 's/^dtoverlay=pi3-disable-wifi.*/#dtoverlay=pi3-disable-wifi %S /' %S",
                            wifi, conf);
        if (syscmd(cmdline) == true && dc == 0)
        {
            dc = 3;
        }
            syscmd("systemctl enable wifi && systemctl start wifi");

        sdsfree(conf);
        sdsfree(cmdline);
     }
     else
     {
        const char *wifi = mympd_state->wifi == true ? "yes" : "no";
        sds conf = sdsnew("/boot/config.txt");
        sds cmdline = sdscatfmt(sdsempty(), "sed -i 's/^#dtoverlay=pi3-disable-wifi.*/dtoverlay=pi3-disable-wifi %S /' %S",
                            wifi, conf);
        if (syscmd(cmdline) == true && dc == 0)
        {
            dc = 3;
        }
        sdsfree(conf);
        sdsfree(cmdline);
     }
    }
    if (apmode_changed == true)
    {
        if (mympd_state->apmode == true)
        {
            syscmd("systemctl enable create_ap && systemctl start create_ap");
        }
        else
        {
            syscmd("systemctl disable create_ap && systemctl stop create_ap");
        }
    }
    if (airplay_changed == true)
    {
        if (mympd_state->airplay == true)
        {
            syscmd("systemctl enable shairport-sync && systemctl start shairport-sync");
        }
        else
        {
            syscmd("systemctl disable shairport-sync && systemctl stop shairport-sync");
        }
    }
    if (roon_changed == true)
    {
        if (mympd_state->roon == true)
        {
            syscmd("systemctl enable roonbridge && systemctl start roonbridge");
        }
        else
        {
            syscmd("systemctl disable roonbridge && systemctl stop roonbridge");
        }
    }
    if (spotify_changed == true)
    {
        if (mympd_state->spotify == true)
        {
            syscmd("systemctl enable spotifyd && systemctl start spotifyd");
        }
        else
        {
            syscmd("systemctl disable spotifyd && systemctl stop spotifyd");
        }
    }

    return dc;
}

static int ns_set(int type, const char *server, const char *share, const char *vers, const char *username,
                  const char *password) {
    int me = 0;
    sds tmp_file = sdsnew("/etc/fstab.new");
    FILE *tmp = setmntent(tmp_file, "w");
    sds org_file = sdsnew("/etc/fstab");
    FILE *org = setmntent(org_file, "r");
    if (tmp && org)
    {
        sds mnt_fsname = sdsempty();
        sds mnt_dir = sdsnew("/mnt/nas-");
        sds mnt_type = sdsempty();
        sds credentials = sdsempty();
        sds mnt_opts = sdsempty();
        if (type == 1 || type == 2)
        {
            mnt_fsname = sdscatfmt(mnt_fsname, "//%s/%s", server, share);
            mnt_dir = sdscat(mnt_dir, "samba");
            mnt_type = sdscat(mnt_type, "cifs");
            if (type == 1)
            {
                credentials = sdscat(credentials, "username=guest,password=");
            }
            else
            {
                credentials = sdscatfmt(credentials, "username=%s,password=%s", username, password);
            }
            mnt_opts = sdscatfmt(mnt_opts, "%s,%s,ro,uid=mpd,gid=audio,iocharset=utf8,noauto,x-systemd.automount,x-systemd.device-timeout=10s", vers, credentials);
        }
        else if (type == 3)
        {
            mnt_fsname = sdscatfmt(mnt_fsname, "%s:%s", server, share);
            mnt_dir = sdscat(mnt_dir, "nfs");
            mnt_type = sdscat(mnt_type, "nfs");
            mnt_opts = sdscat(mnt_opts, "ro,noauto,x-systemd.automount,x-systemd.device-timeout=10s,rsize=8192,wsize=8192");
        }
        struct mntent n = {mnt_fsname, mnt_dir, mnt_type, mnt_opts, 0, 0};
        bool append = true;

        struct mntent *m;
        while ((m = getmntent(org)))
        {
            if (strstr(m->mnt_dir, "/mnt/nas-") != NULL)
            {
                append = false;
                if (type == 0)
                {
                    me = -1; // remove mount entry
                    continue;
                }
                else
                {
                    addmntent(tmp, &n);
                    me = 2; // edit mount entry
                    continue;
                }
            }
            addmntent(tmp, m);
        }
        if (type != 0 && append)
        {
            addmntent(tmp, &n);
            me = 1; // add mount entry
        }
        fflush(tmp);
        endmntent(tmp);
        endmntent(org);

        int rc = rename(tmp_file, org_file);
        if (rc == -1)
        {
            MYMPD_LOG_DEBUG(NULL, "Renaming file from %s to %s failed", tmp_file, org_file);
            me = 0; // old table
        }
        sdsfree(mnt_fsname);
        sdsfree(mnt_dir);
        sdsfree(mnt_type);
        sdsfree(credentials);
        sdsfree(mnt_opts);
    }
    else
    {
        if (tmp)
        {
            endmntent(tmp);
        }
        else
        {
            MYMPD_LOG_INFO(NULL, "Can't open %s for write", tmp_file);
        }
        if (org)
        {
            endmntent(org);
        }
        else
        {
            MYMPD_LOG_INFO(NULL, "Can't open %s for read", org_file);
        }
    }
    sdsfree(tmp_file);
    sdsfree(org_file);
    return me;
}
