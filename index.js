/* global FB,module,process*/
var Q = require("q");
Q.longTraceSupport = true;

var FACEBOOK_ID = "facebook-jssdk";
var APP_ID;

var GET = "get";
var PUT = "put";
var POST = "post";
var DELETE = "delete";

var deferredFacebook;

module.exports = function (appId, accessToken) {
    APP_ID = appId;
    //deferred is null the first time, after that, always the same.
    if(!deferredFacebook) {
        deferredFacebook = Q.defer();

        //test if we are in a browser
        if(typeof document !== "undefined") {
            // in a browser
            if (document.getElementById(FACEBOOK_ID)) {
                // Facebook is already loaded
                deferredFacebook.reject(new Error("Facebook is already loaded."));
            } else {
                window.fbAsyncInit = function() {
                    FB.init({
                        appId      : appId,
                        xfbml      : true,
                        version    : 'v2.0'
                    });
                    deferredFacebook.resolve(decorate(FB));
                };
                var scriptElement = document.createElement('script');
                scriptElement.src = "//connect.facebook.net/en_US/sdk.js";
                scriptElement.id = FACEBOOK_ID;
                document.head.appendChild(scriptElement);
            }
        } else {
            // in node
            var facebook = require/**/("fb");
            facebook.setAccessToken(accessToken);
            deferredFacebook.resolve(decorate(facebook));
        }
    }
    return deferredFacebook.promise;
};

function decorate(facebook) {
    var newFacebook = Object.create(facebook);
    newFacebook.api = function (path, method, params) {
        //TODO support batch requests
console.log("path, method, params",path, method, params);
        var deferred = Q.defer();
        var args = [path];
        if(typeof method === "string") {
            args.push(method);
        }
        if(typeof params === "object") {
            args.push(params);
        }
        args.push(function(response) {
            console.log("response", response);
            if (response && response.error) {
                deferred.reject(new Error(response.error.message, response.error));
            } else {
                deferred.resolve(response);
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
    explicit(newFacebook);
    return newFacebook;
}



function explicit(facebook) {
    //
    // users
    //
    facebook.allTestUsers = function allTestUsers() {
        return facebook.api(testUsersEdge(), GET)
            .get("data");
    };
    facebook.newTestUser = function newTestUser() {
        return facebook.api(testUsersEdge(), POST, { permissions: "read_stream" });
    };
    facebook.deleteAllTestUsers = function deleteAllTestUsers() {
        return facebook.allTestUsers()
            .then(function (users) {
                // remove Open Graph Test User
//                var appUsers = [];
//                users.forEach(function (user) {
//                    if (user.id !== "1394361990850452") {
//                        appUsers.push(user);
//                    }
//                });
                return Q.all(users.map(function (user) {
                    return facebook.deleteUser(user);
                }));
            });
    };
    //
    // user
    //
    facebook.user = function user(userId) {
        return facebook.api(idEdge(userId), GET);
    };
    facebook.deleteUser = function deleteUser(user) {
        return facebook.api(userEdge(user), DELETE);
    };
    facebook.updateUser = function updateUser(user, data) {
        return facebook.api(userEdge(user), POST, data);
    };
    facebook.picture = function (user, params) {
        return facebook.api(pictureEdge(user), GET, params).get("data");
    };
    facebook.makeFriendAndAccept = function (friend1, friend2) {
        return facebook.api(friendEdge(friend1, friend2), POST)
            .then(function () {
                return facebook.api(friendEdge(friend2, friend1), POST);
            });
    }
    //
    // album
    //
    facebook.albums = function (user) {
        return facebook.api(albumsEdge(user), GET).get("data");
    };
    facebook.albumNamed = function (user, name) {
        return facebook.albums(user)
            .then(function (albums) {
                return Q.all(albums.filter(function (album) {
                    return album.name === name;
                }))
                .then(function (albums) {
                    if(albums && albums.length === 1 ) {
                        return albums[0];
                    } else {
                        throw new Error("No single album found named, "+name+".")
                    }
                })
            });
    };
    facebook.albumPhotos = function (album) {
        if(typeof album === "undefined") {

        }
        return facebook.api(albumPhotosEdge(album), GET).get("data");
    };
    //
    // my
    //
    facebook.myFriends = function () {
        return facebook.api(myFriendsEdge(), GET).get("data");
    };

}
var idEdge = function (id) {
    return "/" + id;
}
var meEdge = function () {
    return "/me";
}
var testUsersEdge = function () {
    return "/" + APP_ID + "/accounts/test-users";
}
var userEdge = function (user) {
    return idEdge(user.id);
}
var pictureEdge = function (user) {
    return idEdge(user.id) + "/picture";
}
var friendEdge = function (friend1, friend2) {
    return "/" + friend1.id + "/friends/" + friend2.id;
}
var myFriendsEdge = function () {
    return meEdge() + "/friends";
}
var albumsEdge = function (user) {
    return idEdge(user.id) + "/albums";
}
var albumPhotosEdge = function (album) {
    return idEdge(album.id) + "/photos";
}
