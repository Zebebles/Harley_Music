const DBF = require('discordjs-bot-framework');


module.exports = class Pause extends DBF.Command{
    constructor(){
        super({
             name: "pause",
             triggers: ["pause", "resume" , "unpause", "freeze"],
             group: "Music",
             ownerOnly : false,
             description: "Pauses / Un-pauses the current playing track.",
             example: ">>pause",             
             guildOnly : true,
        });
    }
    run(params = {msg, args}){
        let msg = params.msg; let args = params.args;
        let validation = msg.guild.playlist.validateCommand(msg);
        if(validation)
            return msg.channel.send(validation).catch(err => console.log(err));
     
        msg.guild.playlist.pause();

    }
}