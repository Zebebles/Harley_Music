const DBF = require('discordjs-bot-framework');

module.exports = class Hello extends DBF.Command{
    constructor(){
        super({
             name: "summon",
             triggers: ["join", "come"],
             group: "Music",
             ownerOnly : false,
             description: "Summons Harley to the voice channel",
             example: ">>summon",             
             guildOnly : true,
             reqBotPerms: ["CONNECT","SPEAK"]
        });
    }
    run(params = {msg, args}){
        let msg = params.msg;
        let validation = msg.guild.playlist.validateCommand(msg, true);
        if(validation)
            return msg.channel.send(validation).catch(err => console.log(err));
        if(!msg.member.voiceChannel)
            return msg.channel.send("You have to be in a voice channel to summon me.");
        if(!msg.member.voiceChannel.joinable || !msg.member.voiceChannel.speakable)
            return msg.channel.send("I can't join that channel.");
        msg.member.voiceChannel.join().catch(err => console.log(err));
    }
}