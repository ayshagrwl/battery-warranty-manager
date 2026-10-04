/**
 * Utils.gs
 * Concurrency locks, ID generation, date handling, and standardized response envelopes.
 */

var Utils = (function () {
  var TIMEZONE = 'Asia/Kolkata';

  function withLock(callback, timeoutMs) {
    var timeout = timeoutMs || 30000;
    var lock = LockService.getScriptLock();
    try {
      var acquired = lock.waitLock(timeout);
      if (!acquired) {
        throw new Error('System is busy processing another request. Please retry in a few seconds.');
      }
      return callback();
    } finally {
      try {
        lock.releaseLock();
      } catch (e) {
        // Ignored if lock was already released
      }
    }
  }

  function getNextId(prefixKey, seqKey, padLength) {
    return withLock(function () {
      var prefix = Config.get(prefixKey, 'ID');
      var seq = parseInt(Config.get(seqKey, '1'), 10);
      if (isNaN(seq) || seq < 1) seq = 1;

      var currentYear = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy');
      var padding = padLength || 6;
      var strSeq = String(seq);
      while (strSeq.length < padding) {
        strSeq = '0' + strSeq;
      }

      var generatedId = prefix + '-' + currentYear + '-' + strSeq;

      // Update sequence in config
      Config.set(seqKey, seq + 1);

      return generatedId;
    });
  }

  function sanitizeSerial(serial) {
    if (serial === null || serial === undefined) return '';
    var str = String(serial).trim();
    // Normalize and remove special hidden non-printables
    return str.replace(/[\u200B-\u200D\uFEFF]/g, '');
  }

  function formatDateIndian(dateInput) {
    if (!dateInput) return '-';
    var d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    return Utilities.formatDate(d, TIMEZONE, 'dd/MM/yyyy');
  }

  function formatDateTimeIndian(dateInput) {
    if (!dateInput) return '-';
    var d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    return Utilities.formatDate(d, TIMEZONE, 'dd/MM/yyyy hh:mm a');
  }

  function toIsoDate(dateInput) {
    if (!dateInput) return '';
    var d = typeof dateInput === 'string' ? parseDate(dateInput) : dateInput;
    if (!d || isNaN(d.getTime())) return '';
    return Utilities.formatDate(d, TIMEZONE, 'yyyy-MM-dd');
  }

  function parseDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;

    var s = String(dateStr).trim();
    // Match DD/MM/YYYY
    var matchDmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (matchDmy) {
      var day = parseInt(matchDmy[1], 10);
      var month = parseInt(matchDmy[2], 10) - 1;
      var year = parseInt(matchDmy[3], 10);
      return new Date(year, month, day);
    }

    // Match YYYY-MM-DD
    var matchYmd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (matchYmd) {
      var y = parseInt(matchYmd[1], 10);
      var m = parseInt(matchYmd[2], 10) - 1;
      var dt = parseInt(matchYmd[3], 10);
      return new Date(y, m, dt);
    }

    var parsed = new Date(s);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  function addMonths(dateInput, monthsToAdd) {
    var d = parseDate(dateInput);
    if (!d) return null;
    var months = parseInt(monthsToAdd, 10);
    if (isNaN(months)) return null;

    var targetYear = d.getFullYear();
    var targetMonth = d.getMonth() + months;
    var targetDay = d.getDate();

    var result = new Date(targetYear, targetMonth, targetDay);
    // Handle month-end boundary overflows (e.g. Jan 31 + 1 month -> Feb 28)
    if (result.getDate() !== targetDay) {
      result.setDate(0); // Go to last day of previous month
    }
    return result;
  }

  function diffDays(startDate, endDate) {
    var start = parseDate(startDate);
    var end = endDate ? parseDate(endDate) : new Date();
    if (!start || !end) return 0;

    var s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    var e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    var diffTime = e.getTime() - s.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  }

  function success(data, message) {
    return {
      success: true,
      data: data || {},
      message: message || 'Operation completed successfully'
    };
  }

  function error(message, errorCode) {
    return {
      success: false,
      errorCode: errorCode || 'ERROR',
      message: message || 'An unexpected error occurred'
    };
  }

  function getCurrentUserEmail() {
    var email = '';
    try {
      email = Session.getActiveUser().getEmail();
      if (!email) {
        email = Session.getEffectiveUser().getEmail();
      }
    } catch (e) {
      // Ignored
    }
    return email || 'system@batterywarranty.local';
  }

  return {
    withLock: withLock,
    getNextId: getNextId,
    sanitizeSerial: sanitizeSerial,
    formatDateIndian: formatDateIndian,
    formatDateTimeIndian: formatDateTimeIndian,
    toIsoDate: toIsoDate,
    parseDate: parseDate,
    addMonths: addMonths,
    diffDays: diffDays,
    success: success,
    error: error,
    getCurrentUserEmail: getCurrentUserEmail
  };
})();
