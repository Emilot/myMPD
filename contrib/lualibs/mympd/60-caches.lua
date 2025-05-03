---
--- myMPD functions for caches
---

--- Creates a temporary file for the misc cache
-- @return filename or nil on error
function mympd.tmp_file()
  return mympd_caches_tmp_file()
end

--- Write a file for the cover cache
-- @param src File to rename
-- @param uri URI to create the cover cache file for
-- @param mimetype Mime Type or nil to sniff by magic bytes
-- @return 0 on success, else 1
-- @return written name or error message on error
function mympd.cache_cover_write(src, uri, mimetype)
  return mympd_caches_images_write("cover", src, uri, mimetype)
end

--- Write a file for the thumbs cache
-- @param src File to rename
-- @param tagvalue Tag value to create the thumbs cache file for
-- @param mimetype Mime Type or nil to sniff by magic bytes
-- @return 0 on success, else 1
-- @return written name or error message on error
function mympd.cache_thumbs_write(src, tagvalue, mimetype)
  return mympd_caches_images_write("thumbs", src, tagvalue, mimetype)
end

--- Write a file for the misc cache
-- @param src File to rename
-- @param name Value to create the misc cache file for
-- @param mimetype Mime Type or nil to sniff by magic bytes
-- @return 0 on success, else 1
-- @return written name or error message on error
function mympd.cache_misc_write(src, name, mimetype)
  return mympd_caches_images_write("misc", src, name, mimetype)
end

--- Write a string to a file in the lyrics cache
-- @param str String to save (it must be a valid lyrics json string)
-- @param uri URI to create the lyrics cache file for
-- @return 0 on success, else 1
-- @return written name or error message on error
function mympd.cache_lyrics_write(str, uri)
  return mympd_caches_lyrics_write(str, uri)
end

--- Updates the timestamp of a file
-- @param filename File to update the timestamp
-- @return 0 on success, else 1
function mympd.update_mtime(filename)
  return mympd_caches_update_mtime(filename)
end
