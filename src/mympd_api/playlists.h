/*
 SPDX-License-Identifier: GPL-3.0-or-later
 myMPD (c) 2018-2025 Juergen Mang <mail@jcgames.de>
 https://github.com/jcorporation/mympd
*/

/*! \file
 * \brief myMPD playlists API
 */

#ifndef MYMPD_API_PLAYLISTS_H
#define MYMPD_API_PLAYLISTS_H

#include "src/lib/list.h"
#include "src/lib/mympd_state.h"
#include "src/mympd_client/playlists.h"

/**
 * Playlist delete criteria
 */
enum plist_delete_criterias {
    PLAYLIST_DELETE_UNKNOWN = -1,
    PLAYLIST_DELETE_EMPTY,
    PLAYLIST_DELETE_SMARTPLS,
    PLAYLIST_DELETE_ALL
};

/**
 * Playlist copy mode
 */
enum plist_copy_modes {
    PLAYLIST_COPY_APPEND = 0,
    PLAYLIST_COPY_INSERT,
    PLAYLIST_COPY_REPLACE,
    PLAYLIST_MOVE_APPEND,
    PLAYLIST_MOVE_INSERT
};

enum plist_delete_criterias parse_plist_delete_criteria(const char *str);

sds mympd_api_playlist_list(struct t_partition_state *partition_state, struct t_stickerdb_state *stickerdb, 
        sds buffer, unsigned request_id, unsigned offset, unsigned limit, sds searchstr, enum playlist_types type,
        enum playlist_sort_types sort, bool sortdesc, const struct t_fields *tagcols);
sds mympd_api_playlist_content_search(struct t_partition_state *partition_state, struct t_stickerdb_state *stickerdb,
        sds buffer, unsigned request_id, sds plist, unsigned offset, unsigned limit, sds expression, const struct t_fields *tagcols);
sds mympd_api_playlist_rename(struct t_partition_state *partition_state, sds buffer,
        unsigned request_id, const char *old_playlist, const char *new_playlist);
sds mympd_api_playlist_delete_all(struct t_partition_state *partition_state, sds buffer,
        unsigned request_id, enum plist_delete_criterias criteria);
bool mympd_api_playlist_content_move(struct t_partition_state *partition_state, sds plist, unsigned from, unsigned to, sds *error);
bool mympd_api_playlist_content_rm_range(struct t_partition_state *partition_state, sds plist, unsigned start, int end, sds *error);
bool mympd_api_playlist_content_rm_positions(struct t_partition_state *partition_state, sds plist, struct t_list *positions, sds *error);
bool mympd_api_playlist_content_append(struct t_partition_state *partition_state, sds plist, struct t_list *uris, sds *error);
bool mympd_api_playlist_content_insert(struct t_partition_state *partition_state, sds plist, struct t_list *uris, unsigned to, sds *error);
bool mympd_api_playlist_content_replace(struct t_partition_state *partition_state, sds plist, struct t_list *uris, sds *error);
bool mympd_api_playlist_content_append_albums(struct t_partition_state *partition_state, struct t_cache *album_cache,
                sds plist, struct t_list *albumids, sds *error);
bool mympd_api_playlist_content_insert_albums(struct t_partition_state *partition_state, struct t_cache *album_cache,
        sds plist, struct t_list *albumids, unsigned to, sds *error);
bool mympd_api_playlist_content_replace_albums(struct t_partition_state *partition_state, struct t_cache *album_cache,
        sds plist, struct t_list *albumids, sds *error);
bool mympd_api_playlist_content_append_album_tag(struct t_partition_state *partition_state, struct t_cache *album_cache, 
        sds plist, sds albumid, enum mpd_tag_type tag, sds value, sds *error);
bool mympd_api_playlist_content_insert_album_tag(struct t_partition_state *partition_state, struct t_cache *album_cache,
        sds plist, sds albumid, enum mpd_tag_type tag, sds value, unsigned to, sds *error);
bool mympd_api_playlist_content_replace_album_tag(struct t_partition_state *partition_state, struct t_cache *album_cache,
        sds plist, sds albumid, enum mpd_tag_type tag, sds value, sds *error);
bool mympd_api_playlist_content_insert_search(struct t_partition_state *partition_state, sds expression, sds plist, unsigned to,
        const char *sort, bool sort_desc, sds *error);
bool mympd_api_playlist_content_append_search(struct t_partition_state *partition_state, sds expression, sds plist,
        const char *sort, bool sort_desc, sds *error);
bool mympd_api_playlist_content_replace_search(struct t_partition_state *partition_state, sds expression, sds plist,
        const char *sort, bool sort_desc, sds *error);
bool mympd_api_playlist_copy(struct t_partition_state *partition_state,
        struct t_list *src_plists, sds dst_plist, enum plist_copy_modes mode, sds *error);
bool mympd_api_playlist_content_move_to_playlist(struct t_partition_state *partition_state, sds src_plist, sds dst_plist,
        struct t_list *positions, unsigned mode, sds *error);
bool mympd_api_playlist_delete(struct t_partition_state *partition_state, struct t_list *playlists, sds *error);
#endif
