const DBF = require('discordjs-bot-framework');
const snekfetch = require("snekfetch");
const yts = require('youtube-search');
const Discord = require('discord.js');


module.exports = class Remove extends DBF.Command{
    constructor(){
        super({
             name: "remove",
             triggers: ["removetrack", "removesong", "deletesong", "deletetrack"],
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
        let track;
        if(!args.match(/\d+(-\d+)?/g) || args.replace(/\d+(-\d+)?/g,"") != "") //if args is not a number or a range of numbers
            track = playlist.queue.positionOf(playlist.queue.find(args))
        else{
            if(args.match(/\d+-\d+/g)) //if args is a range of numbers
            {
                let start = args.match(/\d+/g)[0];
                let end = args.match(/\d+/g)[1];
                if(start < 1 || end > msg.guild.playlist.queue.length-1)
                    return msg.channel.send("Please provide a range between `1** and `" + (msg.guild.playlist.queue.length-1) + "`").catch(err => console.log(err));

                playlist.queue.remove(start, (end-start)+1);
                return msg.channel.send("Removed `" + ((end-start)+1) + "` tracks from the queue!").catch(err => console.log(err));
            }
            track = args.match(/\d+/g)[0];
        }
        if(!track)
            return msg.channel.send("Couldn't find a track to remove under `" + args.substr(0, 100) + "`").catch(err => console.log(err));
        else if(track < 1 || track > msg.guild.playlist.queue.length-1)
            return msg.channel.send("Please provide a queue position between `1` and `" + (msg.guild.playlist.queue.length-1) + "`").catch(err => console.log(err));

        track = playlist.queue.remove(track);
        let embed = new Discord.MessageEmbed();
        embed.setTitle("Track removed from queue");
        embed.setColor(msg.guild.me.displayColor);
        embed.setDescription(track[0].title);
        embed.setThumbnail(track[0].image); 
        msg.channel.send("", {embed}).catch(err => console.log(err));
        
    }
}