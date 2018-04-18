const DBF = require('discordjs-bot-framework');
const snekfetch = require("snekfetch");
const yta = require("simple-youtube-api");
const ytas = new yta('AIzaSyC3OGAw7qu6sA1XyQJLExw_Mn73Iw7KMDA');

module.exports = class Hello extends DBF.Command{
    constructor(){
        super({
             name: "loop",
             triggers: [],
             group: "Music",
             ownerOnly : false,
             description: "Loop through the queue again when it's empty.",
             example: ">>loop",             
             guildOnly : true,
        });
    }
    run(params = {msg, args}){
        let msg = params.msg; let args = params.args;
        let playlist = msg.guild.playlist;
        let validation = msg.guild.playlist.validateCommand(msg,true);
        if(validation)
            return msg.channel.send(validation).catch(err => console.log(err));
        msg.channel.send(":repeat: The queue will now be played `" + playlist.queue.doLoop() + "` times.").catch(err => console.log(err));
    }

}