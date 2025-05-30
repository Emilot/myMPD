/*
 SPDX-License-Identifier: GPL-3.0-or-later
 myMPD (c) 2018-2025 Juergen Mang <mail@jcgames.de>
 https://github.com/jcorporation/mympd
*/

/*! \file
 * \brief Playlist helper functions.
 */

#ifndef MYMPD_MPD_CLIENT_PLAYLISTS_H
#define MYMPD_MPD_CLIENT_PLAYLISTS_H

#include "src/lib/mympd_state.h"

/**
 * Playlist types
 */
enum playlist_types {
    PLTYPE_ALL = 0,
    PLTYPE_STATIC = 1,
    PLTYPE_SMART = 2,
    PLTYPE_SMARTPLS_ONLY = 3
};

/**
 * Playlist sort types
 */
enum playlist_sort_types {
    PLSORT_UNKNOWN = -1,
    PLSORT_NAME,
    PLSORT_LAST_MODIFIED
};

bool mympd_client_get_all_playlists(struct t_partition_state *partition_state, struct t_list *l, bool smartpls, sds *error);
time_t mympd_client_get_playlist_mtime(struct t_partition_state *partition_state, const char *playlist);
bool mympd_client_playlist_crop(struct t_partition_state *partition_state, const char *plist, unsigned num_entries);
bool mympd_client_playlist_clear(struct t_partition_state *partition_state, const char *plist, sds *error);
bool mympd_client_playlist_get(struct t_partition_state *partition_state,
    const char *plist, bool reverse, struct t_list *l, sds *error);
bool mympd_client_playlist_shuffle(struct t_partition_state *partition_state, const char *uri, sds *error);
bool mympd_client_playlist_sort(struct t_partition_state *partition_state, const char *uri, const char *tagstr, bool sortdesc, sds *error);
bool mympd_client_enum_playlist(struct t_partition_state *partition_state, const char *plist,
        unsigned *count, unsigned *duration, sds *error);
int mympd_client_playlist_validate(struct t_partition_state *partition_state, const char *playlist, bool remove, sds *error);
int mympd_client_playlist_validate_all(struct t_partition_state *partition_state, bool remove, sds *error);
int64_t mympd_client_playlist_dedup(struct t_partition_state *partition_state, const char *playlist, bool remove, sds *error);
int64_t mympd_client_playlist_dedup_all(struct t_partition_state *partition_state, bool remove, sds *error);
enum playlist_sort_types playlist_parse_sort(const char *str);
bool mympd_send_list_playlist_range(struct t_partition_state *partition_state,
        const char *plist, unsigned start, unsigned end);
bool mympd_send_list_playlist_range_meta(struct t_partition_state *partition_state,
        const char *plist, unsigned start, unsigned end);

#endif
