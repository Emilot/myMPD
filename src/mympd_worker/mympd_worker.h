/*
 SPDX-License-Identifier: GPL-3.0-or-later
 myMPD (c) 2018-2025 Juergen Mang <mail@jcgames.de>
 https://github.com/jcorporation/mympd
*/

/*! \file
 * \brief MPD worker thread implementation
 */

#ifndef MYMPD_MPD_WORKER_H
#define MYMPD_MPD_WORKER_H

#include "src/lib/api.h"
#include "src/lib/mympd_state.h"

bool mympd_worker_start(struct t_mympd_state *mympd_state, struct t_partition_state *partition_state,
        struct t_work_request *request);

#endif
