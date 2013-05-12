(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    }
}(this, function () {
    //= super-simple-http-chat.js

    return sshc;
}));