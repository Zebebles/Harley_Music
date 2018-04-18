const DBF = require('discordjs-bot-framework');


module.exports = class Hello extends DBF.Command{
    constructor(){
        super({
             name: "previous",
             triggers: ["prev", "back", "last"],
             group: "Music",
             ownerOnly : false,
             description: "Go backwards in the queue.",
             example: ">>prev number_of_tracks",             
             guildOnly : true,
             reqArgs : true,
        });
    }
    run(params = {msg, args}){
        let msg = params.msg; let args = params.args;
        let incrementN;
        let validation = msg.guild.playlist.validateCommand(msg,true);
        if(validation)
            return msg.channel.send(validation).catch(err => console.log(err));
        incrementN = parseInt(args) ? parseInt(args) : 1;
        msg.channel.send(`:track_next: Going back \`${msg.guild.playlist.queue.prev(incrementN)}\` tracks as requested by **${msg.member.displayName}**`).catch(err => console.log(err));
        msg.guild.playlist.dispatcher.destroy();
    }
}