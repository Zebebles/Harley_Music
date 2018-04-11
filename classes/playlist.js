let auth;// = require("../resources/auth.json");
const Video = require("./video.js");
const PlaylistMessageManager = require('./playlistMessageManager.js');


module.exports = class Playlist extends PlaylistMessageManager{

    constructor(guild){
        auth = guild.client.auth;
        super(guild);
        this.init();
    }

    set message(msg)
    {
        super.message = msg;
    }
    set textChannel(channel)
    {
        super.textChannel = channel;
    }
    set qmessage(msg)
    {
        super.qmessage = msg;
    }
    set guild(guild)
    {
        super.guild = guild;
    }
    set paused(paused)
    {
        super.paused = paused;
    }
    set queue(val)
    {
        super.queue = val;
    }

    init()
    {
        if(this.timeout)
        {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        if(this.guild.voiceConnection)
        {
            this.guild.voiceConnection.disconnect();
            
            this.guild.client.voiceConnections.forEach(conn => {
                let done = false;
                conn.channel.members.forEach(mem => {
                    if(!done && this.textChannel.guild.members.filter(m => !m.user.bot).get(mem.id)){
                        done = true;
                        setTimeout( () => {
                            if(conn.dispatcher){
                                conn.dispatcher.pause();
                                conn.dispatcher.resume();
                            }
                        },250);
                    }
                });
            });
        }

        super.queue = [];
        super.paused = false;
        this.auto = false;
        this.dontRelate = [];
        if(this.message && this.message.collector && !this.message.collector.ended)
            super.message.collector.stop();
        if(this.message)
            super.message.clearReactions().catch(err => err);
        super.message = null;
        super.qmessage = null;
        super.textChannel = null;
        this.voiceChannel = null;
        this.guild.client.sendStatus(true, false);        
    }

    addSong(song, first){
        let vid = new Video(song, auth);
        if(!this.queue) this.queue = new Array();
        if(first)
            this.queue.splice(1, 0, vid);
        else
            this.queue.push(vid);
    }

    playNext(){
        this.guild.client.sendStatus(true);
        super.paused = false;        
        if(this.queue.length == 0){
            this.updateMessage("Ran of out songs to play.");
            this.init();
            return;
        }else if(this.textChannel.guild.voiceConnection && this.textChannel.guild.voiceConnection.channel.members.size == 1){
            this.textChannel.send("Looks like the voice channel is empty :c.  Pausing playback for now, you can resume it with `" + this.textChannel.guild.prefix + "resume`");
            this.paused = true;
            if(this.timeout)
                clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                if(this.paused == true && this.textChannel.guild.voiceConnection && this.textChannel.guild.voiceConnection.channel.members.size == 1){
                    this.updateMessage("Voice Channel empty for 15 minutes");
                    this.init();                    
                }
            },900000)
            return;
        }
        this.queue[0].validate().then( () => {
            this.updateMessage();
            if(!this.guild.voiceConnection)
            {
                if(this.voiceChannel)
                {
                    this.voiceChannel.join().then(conn =>
                    {
                        this.Play();
                    }).catch(err => {
                        this.updateMessage("Voice connection error.");
                        this.init();
                    });
                }else
                {
                    this.updateMessage("Voice connection error.")
                    this.init();
                }
            }
            else
                this.Play();
        }).catch(err => {
            delete this.queue.splice(0,1);
            this.playNext();
        });
    }

    Play(){
        this.queue[0].getStream().then( stream => {
            let thisSeeks = this.queue[0].seeks;
            let startSong = this.queue[0];
            
            if(!this.textChannel.guild.voiceConnection)
            {
                this.updateMessage("Voice connection error.")
                return this.init();
            }
            this.textChannel.guild.voiceConnection.playStream(
                stream,
                {volume: 0.5,
                bitrate: 64,
                seek: Math.floor(this.queue[0].startTime * 0.001)}
            ).on("error", (err) => {
                this.playNext();
            }).on("start", () => {
                if(this.queue[0].duration > 0)
                {
                    if(this.timeout)
                        clearTimeout(this.timeout);
                    this.timeout = setTimeout(() => {
                        dispatcher.end();
                    },(this.queue[0].duration*1000) - (25+this.queue[0].startTime));
                }
            }).on("end", reason => {
                if(reason == "dont" || this.queue.length == 0)
                    return;
                if(reason != "seek" && this.queue.length > 0){
                    this.queue[0].seeks = 0;
                    this.queue[0].startTime = 0;
                }
                if(this.queue.length == 1 && this.auto) 
                    this.queue[0].getRelated(this.dontRelate).then(song => {
                        this.dontRelate.push(this.queue[0].title);
                        if(this.dontRelate.length > 5)
                            this.dontRelate.splice(0,1);
                        this.queue.push(new Video(song, auth));
                        delete this.queue.splice(0,1);
                        this.playNext();
                    }).catch(err => {
                        if(err != "Not youtube") console.log(err);
                        delete this.queue.splice(0,1);
                        this.playNext();
                    });
                else{
                    delete this.queue.splice(0,1); //get rid of the lastsong                
                    this.playNext();
                }
            });
        }).catch(err => 
        {
            delete this.queue.splice(0,1);
            this.playNext();
        });
    }
}