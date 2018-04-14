const DBF = require('discordjs-bot-framework');
const snekfetch = require("snekfetch");
const yta = require("simple-youtube-api");
const ytas = new yta('AIzaSyC3OGAw7qu6sA1XyQJLExw_Mn73Iw7KMDA');

module.exports = class Hello extends DBF.Command{
    constructor(){
        super({
             name: "repeat",
             triggers: ["repeat", "replay", "playagain"],
             group: "Music",
             ownerOnly : false,
             description: "Play the current song again.",
             example: ">>repeat",             
             guildOnly : true,
        });
    }
    run(params = {msg, args}){
        let msg = params.msg; let args = params.args;
        let playlist = msg.guild.playlist;
        let validation = msg.guild.playlist.validateCommand(msg,true);
        if(validation)
            return msg.channel.send(validation).catch(err => console.log(err));
        playlist.queue.repeat();
        msg.channel.send(":repeat_one: `" + playlist.queue.current.title + "` will play again.").catch(err => console.log(err));
    }

}