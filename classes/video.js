const Discord = require("discord.js");
var ytdl = require('ytdl-core');
let auth;// = require("../resources/auth.json");
const snekfetch = require("snekfetch");
const yta = require("simple-youtube-api");
let ytas;// = new yta(auth.googleKey);
const yt = require("youtube-node");
const youTube = new yt();
var Promise = require("bluebird");
const req = require("request");

module.exports = class Video{

    constructor (params,authorization){
        this.title = params.title;
        this.type = params.type;
        this.seeks = params.seeks; 
        this.link = params.link;
        this.image = params.image;
        this.startTime = params.startTime;
        this.duration = params.duration;
        this.url = params.url;
        
        auth = authorization;
        ytas = new yta(auth.googleKey);
        youTube.setKey(auth.googleKey);

    }

    getStream(){
        return new Promise((resolve, reject) => {
            let stream;
            try{
                stream = this.type == "youtube" 
                                ? (this.duration ? ytdl(this.link,{quality: [250,171,139]}) : ytdl(this.link,{quality: 91}))
                                : (this.type == "soundcloud" ? req(this.link + "?client_id=" + auth.scID) : null);
            }
            catch(err)
            {
                reject(err); //should just make it skip the song
            }
            finally
            {
                if(stream)
                {
                    stream.on('error', err => reject(err));
                    stream.on("response", () => resolve(stream));
                }
                else
                    reject("Not youtube or soundclud");
            }
        });
    }

    validate(){
        return new Promise((resolve, reject) => {
            this.convert().then(() => {
                this.getDuration().then(() => {
                    resolve();
                }).catch(err => reject(err));
            }).catch(err => reject(err));
        })
    }

    getDuration(){
        return new Promise((resolve, reject) => {
            if(this.duration)
                return resolve(this.duration);
            ytas.getVideoByID(this.link).then(video => {
                if(!video)
                    return reject("Couldn't get video.");
                this.duration = video.durationSeconds;
                resolve(video.durationSeconds); 
            }).catch(err => reject(err));
        });
    }

    convert(){
        return new Promise((resolve, reject) => {
            if(this.type == "spotify")
                snekfetch.get('https://www.googleapis.com/youtube/v3/search?part=snippet&key=' + auth.googleKey + '&maxResults=10&q=' + this.title).then(body =>{
                    let result = JSON.parse(body.text).items.find(track => track.id.kind == "youtube#video");
                    if(!result)
                        reject(err);
                    this.title = result.snippet.title;
                    this.link = result.id.videoId;
                    this.startTime = 0;
                    this.seeks = 0;
                    this.type = "youtube";
                    this.image = `https://img.youtube.com/vi/${result.id.videoId}/mqdefault.jpg`;
                    resolve(this);  
                }).catch(err => reject(err));
            else
                resolve();
        });
    }

    getRelated(dontRelate){
        return new Promise((resolve, reject) => {
            if(this.type == "youtube"){
                youTube.related(this.link, 5 , (err, result) => {
                    //console.log("Request - getRelated - " + this.textChannel.guild.name);
                    if(err) return reject(err);
                    let song = result.items.filter(r => dontRelate.indexOf(r.snippet.title) == -1).find(r => r.id.kind == "youtube#video");
                    if(!song)
                        song = result.items.find(r => r.id.kind == "youtube#video");
                    if(!song)
                        return reject("No sound found.");
                    resolve({title: song.snippet.title, link: song.id.videoId, type: "youtube", startTime: 0, seeks: 0, image: `https://img.youtube.com/vi/${song.id.videoId}/mqdefault.jpg`});
                });
            }
            else
                reject("Not youtube");
        });
    }
}