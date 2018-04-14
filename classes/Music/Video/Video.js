const Discord = require("discord.js");
const snekfetch = require("snekfetch");
var Promise = require("bluebird");

module.exports = class Video{

    constructor (params, playlist)
    {
        if(!params.title)
            throw Error("Must provide a title.");
        if(!params.image)
            throw Error("Must provide an image");
        if(!playlist)
            throw Error("Must provide playlist");
        this.title = params.title;
        this.link = params.link;
        this.image = params.image;
        this.startTime = params.startTime ? params.startTime : 0;
        this.duration = params.duration;
        this.url = params.url;
        this.auth = playlist.auth;
        this.playlist = playlist;
    }

    getStream()
    {
        return new Promise((resolve, reject) => reject("You must implement an overridden method."));        
    }

    validate(){
        return new Promise((resolve, reject) => reject("You must implement an overridden method."));
    }

    getDuration(){
        return new Promise((resolve, reject) => reject("You must implement an overridden method."));       
    }

    getRelated(dontRelate){
        return new Promise((resolve, reject) => reject("You must implement an overridden method."));        
    }
}