/**
 * Config.gs
 * Application configuration management backed by the Config sheet.
 */

var Config = (function () {
  var _cache = null;

  function getAll() {
    if (_cache) return _cache;
    var rows = Database.getRows('Config');
    var map = {};
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].key) {
        map[rows[i].key] = rows[i].value;
      }
    }
    _cache = map;
    return map;
  }

  function get(key, defaultValue) {
    var all = getAll();
    if (all.hasOwnProperty(key) && all[key] !== null && all[key] !== '') {
      return all[key];
    }
    return defaultValue !== undefined ? defaultValue : null;
  }

  function set(key, value) {
    return Utils.withLock(function () {
      var sheet = Database.getSheet('Config');
      var data = sheet.getDataRange().getValues();
      var found = false;

      for (var r = 1; r < data.length; r++) {
        if (data[r][0] === key) {
          sheet.getRange(r + 1, 2).setValue(value);
          found = true;
          break;
        }
      }

      if (!found) {
        sheet.appendRow([key, value, 'Configured via application']);
      }

      if (_cache) {
        _cache[key] = value;
      }

      return value;
    });
  }

  function invalidateCache() {
    _cache = null;
  }

  return {
    getAll: getAll,
    get: get,
    set: set,
    invalidateCache: invalidateCache
  };
})();
