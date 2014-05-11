A package that wraps the Facebook javascript api to provide promises rather than callbacks.

At the moment this is only a wrapper for the client side js SDK and depends of the presence of the DOM.
(pull requests accepted)

# Reference

## `require("promise-facebook")`

The main module returns a function that accept the Facebook application id as an argument and returns a promise for the
FB object.
At the moment only `api`, `ui`, `login`, `logout`, and `getLoginStatus` methods return promises.

## `.api()`

See [FB.api()](https://developers.facebook.com/docs/javascript/reference/FB.api)

### parameters:
    `path`, `method`, `params`
### returns:
    promise for the response's data

## `.ui()`

See [FB.ui()](https://developers.facebook.com/docs/javascript/reference/FB.ui)

### parameters:
    `params`
### returns:
    promise for the dialog's response data

## `.login()`

See [FB.login()](https://developers.facebook.com/docs/reference/javascript/FB.login/v2.0)

### parameters:
    `params`
### returns:
    promise for the facebook object in a logged in state

## `.logout()`

See [FB.logout()](https://developers.facebook.com/docs/reference/javascript/FB.logout)

### parameters:
    none
### returns:
    promise for the facebook object in a logged out state

## `.getLoginStatus()`

See [FB.getLoginStatus()](https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus)

### parameters:
    `force`: Force reloading the login status (default false).
### returns:
    promise for the logout response

# Usage:

```javascript
var facebook = require("./facebook")(<YOUR_APP_ID>);

facebook
.then(function (facebook) {
    return facebook.login({scope: 'user_photos'});
})
.then(function () {
    return facebook.api('/me/albums', 'get');
})
.then(function (albums) {
     return facebook.api('/'+albums[0].id+'/photos', 'get');
})
.then(function (results) {
    console.log("results", results);
})
.done();

```
