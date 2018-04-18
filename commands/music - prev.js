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
        incrementN = parseInt(args);
        incrementN = incrementN && incrementN > 0 ? incrementN : 1; 
        let skipped = msg.guild.playlist.queue.prev(incrementN)-1;
        
        if(skipped > 1)
            msg.channel.send(`:track_previous: Going back \`${skipped}\` tracks as requested by **${msg.member.displayName}**`).catch(err => console.log(err));
        
        msg.guild.playlist.dispatcher.destroy();
    }
}