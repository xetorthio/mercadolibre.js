(function() {


/**
 * A modified version of the jQuery cookie plugin
 * that doesn't rely on jQuery.
 *
 */

/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

/**
 * Create a cookie with the given name and value and other optional parameters.
 *
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Set the value of a cookie.
 * @example $.cookie('the_cookie', 'the_value', { expires: 7, path: '/', domain: 'jquery.com', secure: true });
 * @desc Create a cookie with all available options.
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Create a session cookie.
 * @example $.cookie('the_cookie', null);
 * @desc Delete a cookie by passing null as value. Keep in mind that you have to use the same path and domain
 *       used when the cookie was set.
 *
 * @param String name The name of the cookie.
 * @param String value The value of the cookie.
 * @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
 * @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
 *                             If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
 *                             If set to null or omitted, the cookie will be a session cookie and will not be retained
 *                             when the the browser exits.
 * @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
 * @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
 * @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
 *                        require a secure protocol (like HTTPS).
 * @type undefined
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

/**
 * Get the value of a cookie with the given name.
 *
 * @example $.cookie('the_cookie');
 * @desc Get the value of a cookie.
 *
 * @param String name The name of the cookie.
 * @return The value of the cookie.
 * @type String
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */
var cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(/; ?/);
            for (var i = 0; i < cookies.length; i++) {
                // var cookie = jQuery.trim(cookies[i]);
                var cookie = cookies[i];
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};

(function(cookie) {
  var MercadoLibreW = {
    init: function() {
      if (typeof(window.MELI) === "undefined") {
        setTimeout('MercadoLibreW.init()', 50);
        return;
      }
      window.MELI.oldGetLoginStatus = window.MELI.getLoginStatus;
      window.MELI.oldExpireToken = window.MELI._expireToken;
      var self = this;
      window.MELI.getLoginStatus = function(callback) {
        var newCallback = self._partial(self.getLoginStatus, callback);
        window.MELI.oldGetLoginStatus(newCallback);
      }
      window.MELI._expireToken = function(key) {
        window.MELI.oldExpireToken(key);
        //skip subdomain
        var domain = document.domain.slice(document.domain.indexOf("."), document.domain.length);
        cookie("orgapi", null, {domain:domain, path:"/"});
        cookie("ats", null, {domain:domain, path:"/"});
        window.MELI.isAuthorizationStateAvaible = false;
      }
      window.MELI._storeSecret = function(secret) {
          //skip subdomain
          var domain = document.domain.slice(document.domain.indexOf("."), document.domain.length);
          cookie("ats", JSON.stringify(secret), {domain:domain, path:"/"});
          this.secret = secret;
      }

      window.MELI._getApplicationInfo = function(callback) {
          window.MELI.appInfo = {id: window.MELI.options.client_id, site_id: window.MELI.options.site_id};
          if (callback) callback();
        }
    },
    _expireToken : function(key) {
        window.MELI.oldExpireToken(key);
        //skip subdomain
        var domain = document.domain.slice(document.domain.indexOf("."), document.domain.length);
        cookie("ats", null, {domain:domain, path:"/"});
        window.MELI.isAuthorizationStateAvaible = false;
    },
    _partial: function (func /* , 0..n args */ ) {
      var args = Array.prototype.slice.call(arguments, 1);
      var self = this;
      return function () {
        var allArguments = args.concat(Array.prototype.slice.call(arguments));
        return func.apply(self, allArguments);
      };
    },
    getLoginStatus: function(callback, status) {
      if (status && status.state == "AUTHORIZED") {
        //token circuit is OK, validate cookies
        if ((cookie("orgapi")== null || cookie("orgapi") == "0")&& (cookie("orgid") == null || cookie("orgid") == "0")) {
          window.MELI.logout();
          status=null;
        } else if (cookie("orgapi") != null && cookie("orgapi") != "0") {
          //validate user id
          if (cookie("orguseridp") != null && cookie("orguseridp") != "0") {
            if (cookie("orguseridp") != status.authorization_info.user_id) {
          if (window.MELI.refreshing) {
                window.MELI.logout();
                window.MELI.refreshing = false;
                status=null;
              } else {
                window.MELI.refreshing = true;
                this._expireToken(window.MELI._getKey());
                window.MELI.getLoginStatus(callback);
                return;
              }
              
            }
          }
        } else if (cookie("orgid") != null && cookie("orgid") != "0") {
          //identified user
          status.state = "IDENTIFIED";
          status.authorization_info.access_token = cookie("orgid");
          window.MELI.authorizationState[window.MELI._getKey()] = status;
        }
      } else if (status == null || status.state == "UNKNOWN" || status.state == "NOT_AUTHORIZED") {
        status = window.MELI.unknownStatus;
        //if orgapi then is indeed authorized
        if (cookie("orgapi") != null && cookie("orgapi") != "0") {
          status.state = "AUTHORIZED";
          status.authorization_info = {
            access_token: cookie("orgapi"),
            expires_in: new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
            user_id: null
          }
          window.MELI.authorizationState[window.MELI._getKey()] = status;
        } else if (cookie("orgid") != null && cookie("orgid") != "0") {
          //identified user
          status.state = "IDENTIFIED";
          status.authorization_info = {
            access_token: cookie("orgid"),
            expires_in: new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
            user_id: null
          }
          window.MELI.authorizationState[window.MELI._getKey()] = status;
        }
      }
      callback(status);
    }
  }
  window.MercadoLibreW = MercadoLibreW;
  MercadoLibreW.init();

})(cookie);
})();
