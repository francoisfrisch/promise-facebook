/* global FB,module*/
var Q = require("q");

var FACEBOOK_ID = "facebook-jssdk";

var deferredFacebook;

module.exports = function (appId) {
    //deferred is null the first time, after that, always the same.
    if(!deferredFacebook) {
        deferredFacebook = Q.defer();
        if (document.getElementById(FACEBOOK_ID)) {
            // Facebook is already loaded
            deferredFacebook.reject(new Error("Facebook is already loaded."));
        } else {
            window.fbAsyncInit = function() {
                deferredFacebook.resolve(FB);
            };
            var scriptElement = document.createElement('script');
            scriptElement.src = "//connect.facebook.net/en_US/sdk.js";
            scriptElement.id = FACEBOOK_ID;
            document.head.appendChild(scriptElement);
        }
    }
    return deferredFacebook.promise
    .then(function (facebook) {
        facebook.init({
            appId      : appId,
            xfbml      : true,
            version    : 'v2.0'
        });
        return decorate(facebook);
    });
};

function decorate(facebook) {
    var newFacebook = Object.create(facebook);
    newFacebook.api = function (path, method, params) {
        var deferred = Q.defer();
        var args = [path];
        if(typeof method === "string") {
            args.push(method);
        }
        if(typeof params === "object") {
            args.push(params);
        }
        args.push(function(response) {
            if (response && response.error) {
                deferred.reject(new Error(response.error));
            } else {
                deferred.resolve(response.data);
            }
        });
        facebook.api.apply(facebook, args);
        return deferred.promise;
    };
    newFacebook.ui = function (params) {
        var deferred = Q.defer();
        facebook.ui(
            params,
            function(response) {
                if (response && response.error) {
                    deferred.reject(new Error(response.error));
                } else {
                    deferred.resolve(response);
                }
            });
        return deferred.promise;
    };
    newFacebook.login = function (params) {
        var deferred = Q.defer();
        facebook.login(
            function(response) {
                if (response.authResponse) {
                    deferred.resolve(newFacebook);
                } else {
                    deferred.reject(new Error("Login failed"));
                }
            }, params);
        return deferred.promise;
    };
    newFacebook.logout = function () {
        var deferred = Q.defer();
        facebook.logout(
            function(response) {
                if (response) {
                    deferred.resolve(newFacebook);
                } else {
                    deferred.reject(new Error("Logout failed"));
                }
            });
        return deferred.promise;
    };
    newFacebook.getLoginStatus = function (force) {
        var deferred = Q.defer();
        facebook.getLoginStatus(
            function(response) {
                if (response && response.error) {
                    deferred.reject(new Error(response.error));
                } else {
                    deferred.resolve(response);
                }
            }, force);
        return deferred.promise;
    };

    return newFacebook;
}
