const Video = require("./Video.js");
const req = require("request");

module.exports = class SoundcloudVideo extends Video
{

    constructor(params,playlist)
    {
        super(params, playlist);
    }

    getStream()
    {
        return new Promise((resolve, reject) => {
            try{
                let stream = req(this.link + "?client_id=" + this.auth.scID)
                
                if(stream instanceof Error)
                    return reject(stream);

                const doResolve = (stream) => {
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
            resolve();
        });
    }

    getRelated()
    {
        return new Promise((resolve, reject) => reject());
    }
}
