const DBF = require('discordjs-bot-framework');


module.exports = class Hello extends DBF.Command{
    constructor(){
        super({
             name: "shuffle",
             triggers: ["mix", "mash"],
             group: "Music",
             ownerOnly : false,
             description: "Shuffles the queue.",
             example: ">>shuffle",             
             guildOnly : true,
        });
    }
    run(params = {msg, args}){
        let msg = params.msg; let args = params.args;
        let channel = msg.guild.voiceConnection;
        let validation = msg.guild.playlist.validateCommand(msg,true);
        if(validation)
            return msg.channel.send(validation).catch(err => console.log(err));

        msg.guild.playlist.queue.shuffle();

        msg.channel.send(":twisted_rightwards_arrows: Queue shuffled.  Use `" + msg.client.prefix + "queue` to view next 5 songs.").catch(err => console.log(err));

    }

}   