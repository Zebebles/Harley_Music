const DBF = require('discordjs-bot-framework');

module.exports = class Hello extends DBF.Command{
    constructor(){
        super({
             name: "stop",
             triggers: ["stop", "leave", "dc", "disconnect"],
             group: "Music",
             ownerOnly : false,
             description: "Stops playing music and leaves the channel.",
             example: ">>stop",             
             guildOnly : true,
        });
    }
    run(params = {msg, args}){
        let msg = params.msg; let args = params.args;
        let channel = msg.guild.voiceConnection;
        let validation = msg.guild.playlist.validateCommand(msg,true);
        if(validation)
            return msg.channel.send(validation).catch(err => console.log(err));
        msg.guild.playlist.stop("Requested by <@" + msg.member + ">");        
    }

}