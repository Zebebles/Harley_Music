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
        if(!msg.member.voiceChannel.joinable || !msg.member.voiceChannel.speakable) 
            return msg.channel.send("I can't join that voice channel.").catch(err => console.log(err));
        if(msg.guild.playlist.qing)
            return msg.channel.send("Please wait until the current song or playlist has finished being added before queueing something else.").catch(err => console.log(err));
        if(!msg.client.spotify.expiry || msg.client.spotify.expiry-200 < Date.now()){
            return msg.client.spotify.clientCredentialsGrant().then(data => 
            {
                msg.client.spotify.expiry = Date.now() + data.body['expires_in'];
                msg.client.spotify.setAccessToken(data.body['access_token']);
                msg.client.commands.find(c => c.areYou('play')).run(params);
            });
        }

        let playNext = false;
        if(args.match(/-(\s*)?(next|first)/gi))
        {
            playNext = true;
            args = args.replace(/-(\s*)?(next|first)/gi, "");            
        }

        let choose = false;
        if(args.match(/-(\s*)?(choose|pick)/gi))
        {
            choose = true;
            args = args.replace(/-(\s*)?(choose|pick)/gi, "");            
        }

        let shuffle = false;
        if(args.match(/-(\s*)?(shuffle)/gi))
        {
            shuffle = true;
            args = args.replace(/-(\s*)?(shuffle)/gi, "");            
        }

        let qm = msg.channel.send("",{embed: {title: "🔎 Searching for song/playlist ...", color: msg.guild.me.displayColor}}).then(qm => 
        {
            msg.guild.playlist.messageManager.queueMessage = qm;
            msg.guild.playlist.retriever.retrieveSongs(args).then(function(result)
            {
                qm.edit("",{embed: {title: "⌛ Queueing songs ...", color: msg.guild.me.displayColor}}).then(qm => 
                {
                    if(!result.tracks && choose && result.songs.length > 1)
                        chooseSongs(result.songs,qm).then(choice => {
                            msg.guild.playlist.addSong(choice, playNext);
                            finish(choice);
                        }).catch(sendWarn);
                    else if(!result.tracks)
                    {
                        msg.guild.playlist.addSong(result.songs[0], playNext);
                        finish(result.songs[0]);
                    }
                    else
                    {
                        result.songs.forEach(song => msg.guild.playlist.addSong(song));
                        finish(result);
                    }
                }).catch(sendWarn);
            }).catch(sendWarn);
        }).catch(sendWarn);

        function finish(song)
        {
            msg.guild.playlist.messageManager.textChannel = msg.channel;
            msg.guild.playlist.messageManager.sendQueueMessage(msg, song); //send the "song is queued message"
                
            if(shuffle)
                msg.guild.playlist.queue.shuffle();
            if(!msg.guild.voiceConnection)
                msg.member.voiceChannel.join().then(() => msg.guild.playlist.next()).catch(err => msg.guild.playlist.stop("Couldn't connect to channel.\n"+err));
        }

        function sendWarn(error)
        {
            console.log(error);
            if(msg.guild.playlist.messageManager.queueMessage)
                return msg.guild.playlist.messageManager.queueMessage.edit("", {embed: {title: "⚠ Error queuing song/playlist.", color: 16106519, description: "**Reason:** " + error}})
                        .then(m => msg.guild.playlist.messageManager.queueMessage = null)
                        .catch(err => console.log(err)); //delete the "searching for" messaging
        
            msg.channel.send("", {embed: {title: "⚠ Error queuing song/playlist", color: 16106519, description: "**Reason:** " + error}})
                .then(m => msg.guild.playlist.messageManager.queueMessage = null)
                .catch(console.log); //delete the "searching for" messaging
        }

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
                            return reject("Selection canceled.");
                        
                        let choice = collected.content.match(/\d{1}/g);
                        if(!choice || !choice.length)
                            return reject("That isn't a valid choice.");
                        choice = parseInt(choice[0]);
                        if(choice > songs.length || choice < 0)
                            return reject("That isn't a valid choice.");
    
                        resolve(songs[choice]);
                    }).catch(reject);
                }).catch(reject);
            });
        }
    }
}
