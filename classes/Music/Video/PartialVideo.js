const YoutubeVideo = require("./YoutubeVideo.js");
const snekfetch = require("snekfetch");

module.exports = class PartialVideo extends YoutubeVideo
{

    constructor(params, playlist)
    {
        super(params, playlist);
    }

    validate()
    {
        return new Promise((resolve, reject) => {
            this.convert().then(() => {
                this.getDuration().then(() => {
                    resolve();
                }).catch(err => reject(err));
            }).catch(err => reject(err));
        })
    }

    convert(){
        return new Promise((resolve, reject) => {
            this.playlist.retriever.youtubeByString(this.title).then(response => {
                let song = response.songs[0];
                this.title = song.title, this.link = song.link, this.startTime = song.startTime, this.type = song.type, this.url = song.url, this.image = song.image;
                resolve();
            }).catch(err => reject(err));
        });
    }
}