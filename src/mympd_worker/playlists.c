/*
 SPDX-License-Identifier: GPL-3.0-or-later
 myMPD (c) 2018-2025 Juergen Mang <mail@jcgames.de>
 https://github.com/jcorporation/mympd
*/

/*! \file
 * \brief Enumeration of MPD playlists
 */

#include "compile_time.h"
#include "src/mympd_worker/playlists.h"

#include "src/lib/json/json_print.h"
#include "src/lib/json/json_rpc.h"
#include "src/lib/sds_extras.h"
#include "src/mympd_client/playlists.h"

/**
 * Enumerates the playlist and returns the count and total length
 * @param partition_state pointer to partition state
 * @param buffer already allocated sds string to append the response
 * @param request_id jsonrpc request id
 * @param plist playlist name to enumerate
 * @return pointer to buffer 
 */
sds mympd_worker_playlist_content_enumerate(struct t_partition_state *partition_state, sds buffer, unsigned request_id, sds plist) {
    enum mympd_cmd_ids cmd_id = MYMPD_API_PLAYLIST_CONTENT_ENUMERATE;
    unsigned entities = 0;
    unsigned playtime = 0;
    sds error = sdsempty();
    if (mympd_client_enum_playlist(partition_state, plist, &entities, &playtime, &error) == true) {
        buffer = jsonrpc_respond_start(buffer, cmd_id, request_id);
        buffer = tojson_uint(buffer, "entities", entities, true);
        buffer = tojson_uint(buffer, "playtime", playtime, true);
        buffer = tojson_sds(buffer, "plist", plist, false);
        buffer = jsonrpc_end(buffer);
    }
    else {
        buffer = jsonrpc_respond_message(buffer, cmd_id, request_id, JSONRPC_FACILITY_PLAYLIST, JSONRPC_SEVERITY_ERROR, error);
    }
    FREE_SDS(error);
    return buffer;
}
