let auth;
const Video = require("./Video/Video.js"), YoutubeVideo = require("./Video/YoutubeVideo.js"), SoundcloudVideo = require("./Video/SoundcloudVideo.js"), PartialVideo = require("./Video/PartialVideo.js");
const PlaylistMessageManager = require('./PlaylistMessageManager.js');
const Queue = require("./Queue.js");
const VideoRetriever = require('./VideoRetriever.js');
const Promise = require("bluebird");

module.exports = class Playlist{

    constructor(guild){
        this.guild = guild;
        auth = guild.client.auth;
        this.auth = auth;
        this.dontRelate = [];

        this.queue = new Queue(this);
        this.retriever = new VideoRetriever(this);
        this.messageManager = new PlaylistMessageManager(this);
    }

    stop(reason, error)
    {
        if(error)
            console.log(error);
        delete this.dispatcher;
        this.dispatcher = null;
        this.auto = false;
        this.dontRelate = [];
        this.queue.clear();
        
        reason ? this.messageManager.stop(reason) : this.messageManager.stop("There was an error.");

        this.timeout ? clearTimeout(this.timeout) : null;

        /*
            THERE'S AN ERROR WHERE IF SOMEONE IN A DIFFERENT GUILD LISTENING TO MUSIC AND THEY'RE IN THE GUILD THAT THE BOT LEAVES, THEY'LL STOP BEING
            ABLE TO HEAR THE BOT UNTIL THEY LEAVE THE CHANNEL AND REJOIN.  THIS PAUSES AND RESUMES PLAYBACK REALLY QUICKLY SO THEY CAN HEAR IT AGAIN.
            TODO: TEST IF THIS IS FIXED IN MASTER.
        */
        if(this.guild.voiceConnection)
        {
            this.guild.voiceConnection.disconnect();
            
            this.guild.client.voiceConnections.forEach(conn => {
                let done = false;
                conn.channel.members.forEach(mem => {
                    if(!done && this.guild.members.get(mem.id))
                    {
                        done = true;    //  SO IT ONLY DOES EACH CONNECTION ONCE
                        setTimeout( () => {
                            if(conn.dispatcher)
                            {
                                conn.dispatcher.pause();
                                conn.dispatcher.resume();
                            }
                        },250);
                    }
                });
            });
        }
    }

    handleError(error)
    {
        console.log(error);
        this.next();
    }

    addSong(song, first)
    {
        let vid;
        if(song.type == "youtube")
            vid = new YoutubeVideo(song, this);
        else if(song.type == "soundcloud")
            vid = new SoundcloudVideo(song, this);
        else if(song.type == "spotify" || song.type == "partial")
            vid = new PartialVideo(song, this);
        else
            throw Error("Valid song types are: 'youtube', 'soundcloud', 'spotify' or 'partial'");

        this.queue.add(vid,first);
    }

    next()
    {
        this.guild.client.sendStatus(true);
        this.queue.next();
        if(this.queue.empty)//STOP THE PLAYBACK
            return this.stop("Ran of out songs to play.");
        else if(this.guild.voiceConnection && this.guild.voiceConnection.channel.members.size == 1)
        {
            this.messageManager.textChannel.send("Looks like the voice channel is empty :c.  Pausing playback for now, you can resume it with `" + this.guild.prefix + "resume`");
            if(this.timeout)
                clearTimeout(this.timeout);
            return this.timeout = setTimeout(() => {
                if((this.dispatcher && this.dispatcher.paused) && this.guild.voiceConnection && this.guild.voiceConnection.channel.members.size == 1)
                    this.stop("Voice Channel empty for 15 minutes");
            },900000);
        }
        this.queue.current.validate().then( () => {
            this.messageManager.update();
            if(!this.guild.voiceConnection)
            {
                if(this.guild.me.voiceChannel)
                    this.guild.me.voiceChannel.join()
                        .then(() => this.play())
                        .catch(err => this.stop("Voice connection error.", stop));
                else
                    this.stop("Voice connection error.");
            }
            else
                this.play();
        }).catch((err) => this.handleError(err));
    }

    play()
    {
        this.queue.current.getStream().then( stream => {            
            if(!this.guild.voiceConnection)
                return this.stop("Voice connection error.");
            this.dispatcher = this.guild.voiceConnection.play(
                stream,
                {   volume: 0.5,
                    bitrate: 64,    }
            ).on("end", reason => {
                if(this.queue.empty)    //  WON'T RUN NEXT() WHEN STOP() STOPS THE DISPATCHER EARLY
                    return;
                if(this.queue.length == 1 && this.auto) 
                    this.queue.current.getRelated(this.dontRelate).then(song => {
                        this.dontRelate.push(this.queue.current.title);
                        if(this.dontRelate.length > 5)
                            this.dontRelate.splice(0,1);
                        this.queue.add(new YoutubeVideo(song, this));
                        this.next();
                    }).catch(err => err != "Not youtube" ?  console.log(err) : null);
                else
                    this.next();
            })
            .on("error", (err) => this.handleError(err))
            .on("disconnect", (err) => this.handleError(err))
            .on("failed", (err) => this.handleError(err))
        }).catch((err) => this.handleError(err));
    }

    pause()
    {
        if(!this.dispatcher)
            return;
        if(this.dispatcher.paused)
            this.dispatcher.resume();
        else
            this.dispatcher.pause();

        this.messageManager.update();
    }

    validateCommand(msg, needQueue, needPlaying) // validates a message and returns the error if there is one.
    {                                            // needQueue means there must be at least one track queued.
        if(!msg.member.voiceChannel)                
            return "You must be in a voice channel for that.";
        
        if(msg.guild.me.voiceConnection && (msg.member.guild.me.voiceChannel.id != msg.member.voiceChannel.id))
            return "We have to be in the same voice channel as me for that.";
        
        if(needQueue && (this.queue.empty && !this.dispatcher))
            return "There must be at least one track queued for that.\nUse `" + msg.guild.prefix + "play song_name|url` to play a track.";
        
        if(needPlaying && (!this.guild.voiceConnection || !this.guild.voiceConnection.dispatcher || this.dispatcher.paused))
            return "There must be something playing for that.\nUse `" + msg.guild.prefix + "play song_name|url` to play a track.";
        
        let djrole = msg.guild.roles.find(r => r.name.match(/dj[^a-zA-Z]|[^a-zA-Z]dj/gi) || r.name.toLowerCase() == "dj");
        if(djrole && msg.member.guild.me.voiceChannel && msg.member.guild.me.voiceChannel.members.find(m => m.roles.find(r => r.id == djrole.id)) && !msg.member.roles.find(r => r.id == djrole.id))
            return "The role `" + djrole.name + "` has been recognised as a DJ role, and at least one person in the channel has it. You must have this role to interact with the music.";
        
        return false;
    }
}