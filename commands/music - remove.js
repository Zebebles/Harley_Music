const DBF = require('discordjs-bot-framework');
const snekfetch = require("snekfetch");
const yts = require('youtube-search');
const Discord = require('discord.js');


module.exports = class Remove extends DBF.Command{
    constructor(){
        super({
             name: "remove",
             triggers: ["delete"],
             group: "Music",
             ownerOnly : false,
             description: "Removes specified track or range of tracks from the queue.",
             example: ">>remove song_name or queue_position or range\n>>remove never gonna give you up\n>>remove 1\n>>remove 1-5",             
             guildOnly : true,
             reqArgs: true,
             reqBotPerms : ["EMBED_LINKS"]
        });
    }
    run(params = {msg, args}){
        let msg = params.msg; let args = params.args;
        let channel = msg.guild.voiceConnection;
        let playlist = msg.guild.playlist;
        let validation = msg.guild.playlist.validateCommand(msg,true);
        if(validation)
            return msg.channel.send(validation).catch(err => console.log(err));

        let removed = playlist.queue.remove(args)

        if(!removed)
            return msg.channel.send("Couldn't find a track to remove under `" + args.substr(0, 100) + "`").catch(err => console.log(err));

        msg.channel.send("", {embed: new Discord.MessageEmbed({  title: "Track removed from queue",  color: msg.guild.me.displayColor,
                                description: removed[0].title}).setThumbnail(removed[0].image)})
                        .catch(err => console.log(err));
        
    }
}