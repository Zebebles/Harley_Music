const Video = require("./Video.js");
const yta = require("simple-youtube-api");
let ytas;
const yt = require("youtube-node");
const ytdl = require("ytdl-core");
const youTube = new yt();
var Promise = require("bluebird");

module.exports = class YoutubeVideo extends Video
{
    constructor(params, playlist)
    {
        super(params, playlist);
        ytas = new yta(this.auth.googleKey);
        youTube.setKey(this.auth.googleKey);
    }

    getStream()
    {
        return new Promise((resolve, reject) => {
            try{
                let stream = this.duration && this.duration > 0 ? ytdl(this.link,{quality: [250,171,139,18]}) : ytdl(this.link,{quality: 91});
                
                if(stream instanceof Error)
                    return reject(stream);

                const doResolve = () => {
                    stream.removeListener('response', doResolve);
                    stream.removeListener('error', doReject);
                    resolve(stream);
                }
                stream.on("response",doResolve);
                
                const doReject = (err) => {
                    stream.removeListener('response', doResolve);
                    stream.removeListener('error', doReject);
                    reject(err);
                }
                stream.on('error', doReject);
            }
            catch(err)
            {
                reject(err); //should just make it skip the song
            }
        });
    }

    validate()
    {
        return new Promise((resolve, reject) => {
            this.getDuration().then(() => {
                resolve();
            }).catch(err => reject(err));
        })
    }

    getDuration()
    {
        return new Promise((resolve, reject) => {
            if(this.duration)
                return resolve(this.duration);
            ytas.getVideoByID(this.link).then(video => {    //  TODO    :   USE SNEKFETCH AND YOUTUBE API TO JUST GET CONTENTDETAILS OR FILEDETAILS (WHICHEVER IS SMALLER AND HAS DURATION)
                if(!video)
                    return reject("Couldn't get video.");
                this.duration = video.durationSeconds;
                resolve(video.durationSeconds); 
            }).catch(err => reject(err));
        });
    }

    getRelated(dontRelate)  //TODO  :   FILTER NON MUSIC RESULTS IF POSSIBLE.
    {
        return new Promise((resolve, reject) => {
            youTube.related(this.link, 5 , (err, result) => {
                if(err) 
                    return reject(err);
                let song =  result.items.filter(r => dontRelate.indexOf(r.snippet.title) == -1).find(r => r.id.kind == "youtube#video")
                        ||  result.items.find(r => r.id.kind == "youtube#video");
                if(!song)
                    return reject("No sound found.");
                resolve({title: song.snippet.title, link: song.id.videoId, type: "youtube", startTime: 0, image: `https://img.youtube.com/vi/${song.id.videoId}/mqdefault.jpg`, url : `https://www.youtube.com/watch?v=${song.id.videoId}`});
            });
        });
    }
}