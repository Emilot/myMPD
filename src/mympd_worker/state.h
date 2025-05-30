/*
 SPDX-License-Identifier: GPL-3.0-or-later
 myMPD (c) 2018-2025 Juergen Mang <mail@jcgames.de>
 https://github.com/jcorporation/mympd
*/

/*! \file
 * \brief MPD worker state functions
 */

#ifndef MYMPD_MPD_WORKER_UTILITY_H
#define MYMPD_MPD_WORKER_UTILITY_H

#include "src/lib/api.h"
#include "src/lib/mympd_state.h"

/**
 * State struct for the mympd_worker thread
 */
struct t_mympd_worker_state {
    bool smartpls;                                //!< smart playlists enabled
    sds smartpls_sort;                            //!< smart playlists sort tag
    sds smartpls_prefix;                          //!< prefix for smart playlist names
    struct t_mympd_mpd_tags smartpls_generate_tag_types;  //!< generate smart playlists for each value for this tag
    struct t_partition_state *partition_state;    //!< pointer to the partition state to work (default partition for worker threads)
    struct t_mpd_state *mpd_state;                //!< pointer to mpd shared state
    struct t_config *config;                      //!< pointer to myMPD config
    struct t_work_request *request;               //!< work request from msg queue
    bool tag_disc_empty_is_first;                 //!< handle empty disc tag as disc one for albums
    struct t_stickerdb_state *stickerdb;          //!< pointer to the stickerdb state
    bool mympd_only;                              //!< true = no mpd connection required
    struct t_cache *album_cache;                  //!< the album cache, use it only with a read lock
};

void mympd_worker_state_free(struct t_mympd_worker_state *mympd_worker_state);
#endif
