const DBF = require('discordjs-bot-framework');
const snekfetch = require("snekfetch");

module.exports = class Clear extends DBF.Command{
    constructor(){
        super({
             name: "clear",
             triggers: ["clear", "empty"],
             group: "Music",
             ownerOnly : false,
             description: "Clears the queue of all songs.",
             example: ">>clear",             
             guildOnly : true,
        });
    }
    run(params = {msg, args}){
        let msg = params.msg; let args = params.args;
        let channel = msg.guild.voiceConnection;
        let playlist = msg.guild.playlist;
        let validation = msg.guild.playlist.validateCommand(msg,true);
        if(validation)
            return msg.channel.send(validation).catch(err => console.log(err));
        let current = playlist.queue.current;
        let total = playlist.queue.length;
        playlist.queue.clear();
        playlist.queue.songs[0] = current;
        msg.channel.send("Cleared `" + (total-1) + "` tracks from the queue.");
    }

}