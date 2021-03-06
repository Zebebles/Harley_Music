const Discord = require('discord.js');
const snekfetch = require("snekfetch");
const SC = require("node-soundcloud");
const spotify = require("spotify-web-api-node");
const yta = require("simple-youtube-api");
let ytas;
const ypi = require("youtube-playlist-info");
const Video = require("./Video/Video.js"), YoutubeVideo = require("./Video/YoutubeVideo.js"), SoundcloudVideo = require("./Video/SoundcloudVideo.js"), PartialVideo = require("./Video/PartialVideo.js");


module.exports = class VideoRetriever
{
    constructor(playlist)
    {
        this.playlist = playlist;
        this.client = playlist.guild.client;
        this.auth = playlist.auth;
        ytas = new yta(playlist.auth.googleKey);

        //  INITIATE THE SPOTIFY AUTH IF IT HASN'T ALREADY BEEN INITIATED
        if(!this.client.spotify)
        {
            this.client.spotify = new spotify({
                clientId: this.auth.spotifyId,
                clientSecret: this.auth.spotifySecret
            });

            this.client.spotify.clientCredentialsGrant().then(data => {
                this.client.spotify.expiry = Date.now() + data.body['expires_in'];
                this.client.spotify.setAccessToken(data.body['access_token']);
            });
        }
    }

    search(identifier) // RETURNS A PROMISE WITH AN ARRAY OF SONG OBJECTS RETRIEVED FROM THE IDENTIFIER, AND PLAYLIST INFO.  I.E. THEN(TRACKS, PLAYLISTINFO)
    {
        if(identifier.match(/soundcloud.com\//gi))
            return this.soundcloud(identifier);
        else if(identifier.match(/open.spotify.com/gi) || identifier.match(/spotify:(track|user|playlist|album)/gi))
            return this.spotify(identifier);
        else if(identifier.match(/([?&]v=|[&?]list=)/gi))
            return this.youtube(identifier);
        else
            return this.youtubeByString(identifier, true);
    }

    youtubeByString(identifier, notMusic) //  SINGLE WILL BE SET IF WE JUST WANT TO RETRIEVE ONE TRACK, OTHERWISE IT'LL GET 5.
    {
        let auth = this.auth;

        const resolveTrack = track => {
            return {   
                link    :   track.id.videoId,
                url     :   `https://www.youtube.com/watch?v=${track.id.videoId}`,
                type    :   "youtube",
                title   :   track.snippet.title,
                duration    :   null,
                startTime   :   0,
                image   :   `https://img.youtube.com/vi/${track.id.videoId}/mqdefault.jpg`}
        }

        return new Promise(function(resolve, reject)
        {
            snekfetch.get('https://www.googleapis.com/youtube/v3/search'
                            +'?part=snippet'
                            +'&type=video'
                            +(notMusic ? "" : '&videoCategoryId=10')   //  MUSIC IS CATEGORY 10. FILTERS NON-MUSIC RESULTS UNLESS SPECIFIED OTHERWISE
                            +'&key=' + auth.googleKey
                            +'&maxResults=5'
                            +'&q=' + encodeURIComponent(identifier))
            .then(body =>{
                let tracks = body.body.items.filter(track => track.title != "Deleted video" && track.title != "Private video");
                if(!tracks || !tracks.length)
                    return reject({friendly: "No tracks found."});
                resolve({songs  :   tracks.map(resolveTrack)});
            }).catch(err => reject({friendly: "Error searching for tracks."}));
        });
    }

    youtube(identifier)
    {
        let auth = this.auth;
        return new Promise(function(resolve, reject)
        {
            if(identifier.match(/[?&]list=/gi))
                return playlist(identifier.match(/[?&]list=.[^&\s]*/gi)[0].replace(/[?&]list=/gi, ""));
            else if(identifier.match(/[?&]v=/gi))
                return track(identifier.match(/[?&]v=.[^&\s]*/gi)[0].replace(/[?&]v=/gi, ""));
            else
                return reject({friendly: "That isn't a valid youtbe URL"});

            function track(id)
            {
                ytas.getVideoByID(id).then(vid => {
                    if(!vid || !vid.title || vid.title == "Deleted video" || vid.title == "Private video")
                        return reject({friendly: "Private / Deleted / Region locked."});
                    resolve({songs  :   [{
                        link    :   vid.id,
                        url     :   `https://www.youtube.com/watch?v=${vid.id}`,
                        type    :   "youtube",
                        title   :   vid.title,
                        duration    :   vid.durationSeconds,
                        startTime   :   0,
                        image   :   `https://img.youtube.com/vi/${vid.id}/mqdefault.jpg`
                    }]});
                }).catch(err => reject({friendly : "Couldn't find that video"}));
            }

            function playlist(id)
            {
                const resolveTrack = track => {
                    return {   
                        link    :   track.resourceId.videoId,
                        url     :   `https://www.youtube.com/watch?v=${track.resourceId.videoId}`,
                        type    :   "youtube",
                        title   :   track.title,
                        duration    :   null,
                        startTime   :   0,
                        image   :   `https://img.youtube.com/vi/${track.resourceId.videoId}/mqdefault.jpg`}
                }

                ypi(auth.googleKey, id).then(function(items) { //search for the playlist (tracks)
                    if(!items || !items.length)
                        return reject({friendly: "Could not get Playlist."});
                    snekfetch.get('https://www.googleapis.com/youtube/v3/playlists?part=snippet&key=' + auth.googleKey + '&id=' + id ).then(body =>{ //get the title and what not from the playlist
                        let playlistInfo = body.body.items[0];
                        items = items.filter(item => item.title != "Deleted video" && item.title != "Private video");
                        if(items.length == 0)
                            return reject({friendly: "Playlist has no valid tracks."});
                        resolve({   songs   :   items.map(resolveTrack),
                                    title   :   playlistInfo.snippet.title, 
                                    tracks  :   items.length
                                });
                    }).catch(err => reject({friendly: "Could not get that Playlist."}));
                }).catch(err => reject({friendly : "Could not get that Playlist."}));
            }
        })
        

    }

    soundcloud(url)
    {
        let auth = this.auth;
        
        const resolveTrack = track => {
            return {
                link    :   track.stream_url,
                url     :   track.permalink_url,
                type    :   "soundcloud",
                title	:   track.title,
                duration    :   track.duration/1000,
                startTime   :   0,
                image   :   track.artwork_url 
                                ? track.artwork_url.replace("large", "t500x500") 
                                : "http://www.stickpng.com/assets/images/580b57fcd9996e24bc43c537.png"
            }
        }
        return new Promise(function(resolve, reject)
        {
            snekfetch.get("https://api.soundcloud.com/resolve?url=" + url + "&client_id=" + auth.scID).then(response => {
                if(response.status != 200 || !response.text)
                    return reject({friendly: "Couldn't get track/playlist"});
                if(response.body.kind == "track")
                    return track(response.body);
                else
                    return playlist(response.body);
            }).catch((err) => reject({friendly: "Couldn't get that track."}))

            function track(track)
            {
                if(!track.title)
                    return reject({friendly : "Track could not be resolved"});
                resolve({songs: [resolveTrack(track)]});
            }

            function playlist(playlist)
            {
                if(!playlist.tracks || !playlist.tracks.length)
                    return resolve({friendly: "Playlist had no tracks."});
                resolve({songs  :   playlist.tracks.map(resolveTrack), 
                        tracks :   playlist.tracks.length,
                        title: playlist.title});
            }
        })
    }

    spotify(url)
    {
        let client = this.client;
        return new Promise(function(resolve, reject)
        {
            authorize().then( () => {
                if(url.match(/user(\/|:)/gi) && url.match(/playlist(\/|:)/gi))
                    return playlist(url.match(/user(\/|:).[^\/:\s?]*/gi)[0].replace(/user(\/|:)/gi, ""),
                                    url.match(/playlist(\/|:).[^\/:\s?]*/gi)[0].replace(/playlist(\/|:)/gi,""));
                else if(url.match(/track(\/|:)/gi))
                    return track(url.match(/track(\/|:).[^\/:\s?]*/gi)[0].replace(/track(\/|:)/gi,""));
                else if(url.match(/album(\/|:)/gi))
                    return album(url.match(/album(\/|:).[^\/:\s?]*/gi)[0].replace(/album(\/|:)/gi,""));
                else
                    return reject({friendly: "That doesn't look like a valid spotify url."});
            }).catch(err => reject({friendly: "Failed authorizing spotify client", error: err}));

            function playlist(userID, playlistID)
            {
                client.spotify.getPlaylist(userID, playlistID).then(data => {
                    if(!data || !data.body || !data.body.tracks.items || !data.body.tracks.items.length)
                        return resolve({friendly: "Couldn't get playlist."});
                    return resolve(
                        {songs: data.body.tracks.items.map(track => {
                            return {
                                type    :   "partial",
                                title   :   track.track.artists[0].name + " - " + track.track.name,
                                image   :   "http://www.stickpng.com/assets/images/59b5bb466dbe923c39853e00.png"
                            }}), 
                        title  :   data.body.name,
                        tracks  :   data.body.tracks.items.length
                    });
                }).catch(err => reject({friendly: "Couldn't resolve playlist"}));
            }

            function track(trackID)
            {
                client.spotify.getTrack(trackID).then(data => {
                    if(!data || !data.body)
                        return reject({friendly: "Couldn't get track."});
                    return resolve(
                        {songs    :   [{
                            type    :   "partial",
                            title   :   data.body.album.artists[0].name + " - " + data.body.name,
                            image   :   "http://www.stickpng.com/assets/images/59b5bb466dbe923c39853e00.png"}]
                        });
                }).catch(err => reject({friendly: "Couldn't resolve track."}));
            }

            function album(albumID)
            {
                client.spotify.getAlbum(albumID).then(data => {
                    if(!data || !data.body || !data.body.tracks.items || !data.body.tracks.items.length)
                        return reject({friendly: "Couldn't get album."});
                    return resolve(
                        {songs: data.body.tracks.items.map(track => {
                            return {
                                type    :   "partial",
                                title   :   track.artists[0].name + " - " + track.name,
                                image   :   "http://www.stickpng.com/assets/images/59b5bb466dbe923c39853e00.png"
                            }}),
                        title  :   data.body.name,
                        tracks  :   data.body.tracks.items.length
                    })
                }).catch(err => reject({friendly : "Couldn't resolve album"}));
            }

            
            function authorize()
            {
                return new Promise((resolve, reject) => {
                    if(!client.spotify.expiry || client.spotify.expiry-200 < Date.now()){   /*  RE-AUTHORIZE SPOTIFY IF NEED BE.    */
                        return client.spotify.clientCredentialsGrant().then(data => 
                        {
                            client.spotify.expiry = Date.now() + data.body['expires_in'];
                            client.spotify.setAccessToken(data.body['access_token']);
                            resolve();
                        }).catch(err => reject(err))
                    }
                    else
                        resolve();
                });
            }
        });
    }
}