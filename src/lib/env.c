/*
 SPDX-License-Identifier: GPL-3.0-or-later
 myMPD (c) 2018-2022 Juergen Mang <mail@jcgames.de>
 https://github.com/jcorporation/mympd
*/

#include "compile_time.h"
#include "src/lib/env.h"

#include "src/lib/log.h"
#include "src/lib/sds_extras.h"

#include <inttypes.h>
#include <stdlib.h>
#include <string.h>

/**
 * Private declarations
 */
static const char *getenv_check(const char *env_var);

/**
 * Public functions
 */

/**
 * Gets an environment variable as sds string
 * @param env_var variable name to read
 * @param default_value default value if variable is not set
 * @param vcb validation callback
 * @return environment variable as sds string
 */
sds getenv_string(const char *env_var, const char *default_value, validate_callback vcb) {
    const char *env_value = getenv_check(env_var);
    if (env_value == NULL) {
        return sdsnew(default_value);
    }
    sds value = sdsnew(env_value);
    if (vcb == NULL ||
        vcb(value) == true)
    {
        return value;
    }
    FREE_SDS(value);
    return sdsnew(default_value);
}

/**
 * Gets an environment variable as int
 * @param env_var variable name to read
 * @param default_value default value if variable is not set
 * @param min minimum value (including)
 * @param max maximum value (including)
 * @return environment variable as integer
 */
int getenv_int(const char *env_var, int default_value, int min, int max) {
    const char *env_value = getenv_check(env_var);
    if (env_value == NULL) {
        return default_value;
    }
    int value = (int)strtoimax(env_value, NULL, 10);
    if (value >= min && value <= max) {
        return value;
    }
    MYMPD_LOG_WARN("Invalid value for \"%s\" using default", env_var);
    return default_value;
}

/**
 * Gets an environment variable as int
 * @param env_var variable name to read
 * @param default_value default value if variable is not set
 * @param min minimum value (including)
 * @param max maximum value (including)
 * @return environment variable as integer
 */
unsigned getenv_uint(const char *env_var, unsigned default_value, unsigned min, unsigned max) {
    const char *env_value = getenv_check(env_var);
    if (env_value == NULL) {
        return default_value;
    }
    unsigned value = (unsigned)strtoumax(env_value, NULL, 10);
    if (value >= min && value <= max) {
        return value;
    }
    MYMPD_LOG_WARN("Invalid value for \"%s\" using default", env_var);
    return default_value;
}

/**
 * Gets an environment variable as bool
 * @param env_var variable name to read
 * @param default_value default value if variable is not set
 * @return environment variable as bool
 */
bool getenv_bool(const char *env_var, bool default_value) {
    const char *env_value = getenv_check(env_var);
    return env_value != NULL ? strcmp(env_value, "true") == 0 ? true : false
                             : default_value;
}

/**
 * Private functions
 */

/**
 * Gets an environment variable and checks its length
 * @param env_var environment variable name
 * @return environment variable value or NULL if it is not set or to long
 */
static const char *getenv_check(const char *env_var) {
    const char *env_value = getenv(env_var); /* Flawfinder: ignore */
    if (env_value == NULL) {
        MYMPD_LOG_DEBUG("Environment variable \"%s\" not set", env_var);
        return NULL;
    }
    if (env_value[0] == '\0') {
        MYMPD_LOG_DEBUG("Environment variable \"%s\" is empty", env_var);
        return NULL;
    }
    if (strlen(env_value) > MAX_ENV_LENGTH) {
        MYMPD_LOG_WARN("Environment variable \"%s\" is too long", env_var);
        return NULL;
    }
    MYMPD_LOG_INFO("Got environment variable \"%s\" with value \"%s\"", env_var, env_value);
    return env_value;
}
