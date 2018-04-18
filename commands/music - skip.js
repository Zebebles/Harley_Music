const DBF = require('discordjs-bot-framework');


module.exports = class Hello extends DBF.Command{
    constructor(){
        super({
             name: "skip",
             triggers: ["skip", "next"],
             group: "Music",
             ownerOnly : false,
             description: "Skip the current song.",
             example: ">>skip number_of_tracks",             
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
        
        if(incrementN > 1) 
        {
            msg.channel.send(`:track_next: Skipping \`${incrementN}\` tracks as requested by **${msg.member.displayName}**`).catch(err => console.log(err));
            msg.guild.playlist.queue.next(incrementN-1);    //  -1 BECAUSE ONE WILL BE SKIPPED ON PLAYLIST.NEXT();
        }

        msg.guild.playlist.dispatcher.destroy();
    }
}