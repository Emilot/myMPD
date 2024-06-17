/*
 SPDX-License-Identifier: GPL-3.0-or-later
 myMPD (c) 2018-2024 Juergen Mang <mail@jcgames.de>
 https://github.com/jcorporation/mympd
*/

#include "compile_time.h"
#include "src/mpd_worker/add_random.h"

#include "dist/sds/sds.h"
#include "src/lib/cache_rax.h"
#include "src/lib/log.h"
#include "src/lib/sds_extras.h"
#include "src/mpd_client/queue.h"
#include "src/mpd_client/random_select.h"
#include "src/mpd_client/shortcuts.h"

#include <stdbool.h>
#include <string.h>

/**
 * Adds randoms songs or albums to the queue
 * @param mpd_worker_state pointer to mpd_worker_state
 * @param add number of songs/albums to add
 * @param mode 1 = add songs, 2 = add albums
 * @param plist playlist to select songs from
 * @param partition partition to add the selection
 * @return true on success, else false
 */
bool mpd_worker_add_random_to_queue(struct t_mpd_worker_state *mpd_worker_state,
        unsigned add, unsigned mode, sds plist, bool play, sds partition)
{
    struct t_random_add_constraints constraints = {
        .filter_include = NULL,
        .filter_exclude = NULL,
        .uniq_tag = MPD_TAG_UNKNOWN,
        .last_played = 0,
        .ignore_hated = false,
        .min_song_duration = 0,
        .max_song_duration = UINT_MAX
    };

    struct t_list add_list;
    list_init(&add_list);

    unsigned new_length = 0;
    sds error = sdsempty();
    if (mode == JUKEBOX_ADD_ALBUM) {
        if (cache_get_read_lock(mpd_worker_state->album_cache) == true) {
            new_length = random_select_albums(mpd_worker_state->partition_state, mpd_worker_state->stickerdb,
                mpd_worker_state->album_cache, add, NULL, &add_list, &constraints);
            if (new_length > 0) {
                mpd_client_add_albums_to_queue(mpd_worker_state->partition_state, mpd_worker_state->album_cache, &add_list,
                    UINT_MAX, MPD_POSITION_ABSOLUTE, &error);
            }
            cache_release_lock(mpd_worker_state->album_cache);
        }
    }
    else if  (mode == JUKEBOX_ADD_SONG){
        new_length = random_select_songs(mpd_worker_state->partition_state, mpd_worker_state->stickerdb,
            add, plist, NULL, &add_list, &constraints);
        if (new_length > 0) {
            mpd_client_add_uris_to_queue(mpd_worker_state->partition_state, &add_list, UINT_MAX, MPD_POSITION_ABSOLUTE, &error);
        }
    }
    else {
        MYMPD_LOG_WARN(partition, "Invalid mode");
        FREE_SDS(error);
        list_clear(&add_list);
        return false;
    }
    list_clear(&add_list);

    if (new_length < add) {
        MYMPD_LOG_WARN(partition, "Could not select %u entries", add);
        FREE_SDS(error);
        return false;
    }

    if (mpd_client_queue_check_start_play(mpd_worker_state->partition_state, play, &error) == false) {
        FREE_SDS(error);
        return false;
    }
    FREE_SDS(error);
    return true;
}
