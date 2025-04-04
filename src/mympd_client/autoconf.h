/*
 SPDX-License-Identifier: GPL-3.0-or-later
 myMPD (c) 2018-2025 Juergen Mang <mail@jcgames.de>
 https://github.com/jcorporation/mympd
*/

/*! \file
 * \brief MPD connection autoconfiguration
 */

#ifndef MYMPD_AUTOCONF_H
#define MYMPD_AUTOCONF_H

#include "src/lib/mympd_state.h"

void mympd_client_autoconf(struct t_mympd_state *mympd_state);
#endif
