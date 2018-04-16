const DBF = require('discordjs-bot-framework');
const Discord = require('discord.js');
const snekfetch = require("snekfetch");
const request = require("request");
const SC = require("node-soundcloud");
const spotify = require("spotify-web-api-node");
const yta = require("simple-youtube-api");
let ytas;
var Promise = require("bluebird");
const ypi = require("youtube-playlist-info");


module.exports = class Hello extends DBF.Command{
    constructor(){
        super({
             name: "play",
             triggers: ["p"],
             group: "Music",
             ownerOnly : false,
             description: "Plays a YouTube, Spotify, or Soundcloud song/playlist in the voice channel. -next will add the song to the top of the queue. -choose will let you choose 1 of the first 5 search results.",
             example: ">>play song_name or url (-choose) (-shuffle) (-next)\n>>play never gonna give you up (-next)  (-shuffle) (-choose)\n>>play youtube_url (-next) (-shuffle) \n>>play spotify_url (-next) (-shuffle) \n>>play soundcloud_url  (-shuffle) (-next)",             
             guildOnly : true,
             reqArgs: true,
             reqBotPerms : ["CONNECT", "SPEAK", "EMBED_LINKS", "MANAGE_MESSAGES", "ADD_REACTIONS"]
        });
    }

    run(params = {msg, args}){
        let msg = params.msg; let args = params.args;
        ytas = new yta(msg.client.auth.googleKey);
        let channel = msg.member.voiceChannel;
        
        if((!args || args == "")) 
            return msg.channel.send("**Usage:**\t`" + msg.guild.prefix + "play <url, song name, or lyrics> -first (optional) -choose (optional)`").catch(err => console.log(err));
        let validation = msg.guild.playlist.validateCommand(msg);
        if(validation)
            return msg.channel.send(validation).catch(err => console.log(err));
        if(!msg.guild.voiceConnection && (!msg.member.voiceChannel.joinable || !msg.member.voiceChannel.speakable)) 
            return msg.channel.send("I can't join that voice channel.").catch(err => console.log(err));
        if(msg.guild.playlist.qing) /*  BECAUSE QUEING TWO SONGS AT THE SAME TIME W/ DIFFERENT COMMANDS CAN BE PROBLEMATIC  */
            return msg.channel.send("Please wait until the current song or playlist has finished being added before queueing something else.").catch(err => console.log(err));

        /*
            THESE ARE THE OPTIONAL ARGUMENTS
        */
        let playNext = false;
        if(args.match(/-(\s*)?(next|first)/gi)) /*  WILL ADD THE SONG TO THE FRONT OF THE QUEUE */
        {
            playNext = true;
            args = args.replace(/-(\s*)?(next|first)/gi, "");            
        }

        let choose = false;
        if(args.match(/-(\s*)?(choose|pick)/gi))    /*  WILL GIVE THE USER A CHOICE OF 5 SONGS  */
        {
            choose = true;
            args = args.replace(/-(\s*)?(choose|pick)/gi, "");            
        }

        let shuffle = false;
        if(args.match(/-(\s*)?(shuffle)/gi))    /*  WILL SHUFFLE THE QUEUE ONCE THE SONG HAS BEEN ADDED */
        {
            shuffle = true;
            args = args.replace(/-(\s*)?(shuffle)/gi, "");            
        }
                                /*  USER FEEDBACK.  TELL THEM THAT WE ARE SEARCHING FOR SONGS   */
        let qm = msg.channel.send("",{embed: {title: "🔎 Searching for song/playlist ...", color: msg.guild.me.displayColor}}).then(qm =>   
        {
            msg.guild.playlist.messageManager.queueMessage = qm;
            msg.guild.playlist.retriever.search(args).then(function(result)  /*  THIS CALLS THE VideoRetriever CLASS AND TRIES TO RETRIEVE A SONG/PLAYLIST FROM THE COMMAND ARGS.
                                                                                        RESULT IS AN OBEJECT THEMED AS FOLLOWS: {   songs  :   [] (array of songs found),
                                                                                                                                    title  :   playlist title (only present if a playlist is returned),
                                                                                                                                    tracks :   the number of tracks in the playlist (only present if playlist is returned)
                                                                                    */
            {                   /*  USER FEEDBACK.  TELL THEM THAT WE ARE NOW QUEUEING THE SONGS  */                                                         
                qm.edit("",{embed: {title: "⌛ Queueing songs ...", color: msg.guild.me.displayColor}}).then(qm => 
                {
                    if(!result.tracks && choose && result.songs.length > 1)  /*    IF NOT PLAYLIST + IF CHOOSING + IF MORE THAN 1 SONG WAS RETURNED    */
                        chooseSongs(result.songs,qm).then(choice => {   /*  CALLS A FUNCTION THAT ASKS THE USER FOR THEIR CHOICE AND RETURNS IT */
                            msg.guild.playlist.addSong(choice, playNext);
                            finish(choice);
                        }).catch(sendWarn);
                    else if(!result.tracks) /*  IF THE USER DOESN'T WANT TO CHOOSE, AND RESULT IS NOT A PLAYLIST    */
                    {
                        msg.guild.playlist.addSong(result.songs[0], playNext);
                        finish(result.songs[0]);
                    }
                    else    /*  IF retrieveSongs() RETURNED A PLAYLIST */
                    {
                        result.songs.forEach(song => msg.guild.playlist.addSong(song));
                        finish(result);
                    }
                }).catch(err => sendWarn({friendly: "Unknown", error: err}));
            }).catch(sendWarn);
        }).catch(err => sendWarn({friendly: "Unknown", error: err}));

        /*
            THIS FUNCTION IS CALLED ONCE THE SONG/PLAYLIST HAS BEEN FOUND/CHOSEN AND ADDED TO THE QUEUE
            SENDS THE FINAL QUEUED MESSAGE.
        */
        function finish(song)
        {
            msg.guild.playlist.messageManager.textChannel = msg.channel;
            msg.guild.playlist.messageManager.sendQueueMessage(msg, song); //send the "song is queued message"
                
            if(shuffle)
            {
                msg.guild.playlist.queue.shuffle();
                msg.channel.send(":twisted_rightwards_arrows: Queue shuffled.  Use `" + msg.client.prefix + "queue` to view next 5 songs.").catch(err => console.log(err));
            }
            if(!msg.guild.voiceConnection)
                msg.member.voiceChannel.join().then(() => msg.guild.playlist.next()).catch(err => msg.guild.playlist.stop("Couldn't connect to channel.\n"+err));
        }

        /*  
            THIS FUNCTION IS CALLED WHENEVER AN ERROR OCCURS.
            IT SENDS THE USER-FRIENDLY ERROR INTO THE TEXT CHANNEL, AND LOGS THE NON-USER FRIENDLY ERROR.
        */
        function sendWarn(error)
        {
            if(error.error || !error.friendly)
                console.log(error.error || error);
            if(msg.guild.playlist.messageManager.queueMessage)
                return msg.guild.playlist.messageManager.queueMessage.edit("", {embed: {title: "⚠ Error queuing song/playlist.", color: 16106519, description: "**Reason:** " + (error.friendly || "Unknown")}})
                        .then(m => msg.guild.playlist.messageManager.queueMessage = null)
                        .catch(console.log); //delete the "searching for" messaging
        
            msg.channel.send("", {embed: {title: "⚠ Error queuing song/playlist", color: 16106519, description: "**Reason:** "  + (error.friendly || "Unknown")}})
                .then(m => msg.guild.playlist.messageManager.queueMessage = null)
                .catch(console.log); //delete the "searching for" messaging
        }

        /*
            THIS IS THE FUNCTION THAT IS CALLED WHEN THE USER WANTS TO CHOOSE FROM THE 5 SONGS FOUND.
            IT SENDS ALL THE SONGS IN A MESSAGE, AND ASKS THEM TO ENTER THEIR CHOICE.
            RETURNS THE CHOSEN SONG, REJECTS ANY ERROR OR IF THERE WAS NO SONG CHOSEN.
        */
        function chooseSongs(songs, qm)
        {
            return new Promise((resolve, reject) => {
                let message = "";
                for(var i = 0; i < songs.length; i++)
                    message += "\n`" + (i+1) + "`\t-\t`" + songs[i].title + "`";   
                message += "\n\nEnter your choice or type `cancel`.\nExample: `1` will choose the first option.";
                qm.edit(message, {embed : null}).then(qm => {
                    const filter = m => m.author.id == msg.author.id;
                    qm.channel.awaitMessages(filter, {max: 1, time: 15000}).then(collected => 
                    {
                        collected = collected.first();

                        if(collected.content.toLowerCase() == "cancel")
                            return reject({friendly: "Track selection canceled."});
                        
                        let choice = collected.content.match(/\d{1}/g);
                        if(!choice || !choice.length)
                            return reject({friendly: "That isn't a valid choice."});
                        choice = parseInt(choice[0])-1;
                        if(isNaN(choice) || choice > songs.length || choice < 0)
                            return reject({friendly: "That isn't a valid choice."});
    
                        resolve(songs[choice]);
                    }).catch(err => reject({friendly : "Couldn't collect your choice", error : err}));
                }).catch(err => reject({friendly : "Couldn't collect your choice", error : err}));
            });
        }
    }
}
