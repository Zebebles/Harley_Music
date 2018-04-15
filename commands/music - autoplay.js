const DBF = require('discordjs-bot-framework');
const snekfetch = require("snekfetch");
const yta = require("simple-youtube-api");

module.exports = class Hello extends DBF.Command{
    constructor(){
        super({
             name: "autoplay",
             triggers: ["auto"],
             group: "Music",
             ownerOnly : false,
             description: "When this is enabled, Harley will search YouTube for related songs to play when the queue is empty.",
             example: ">>autoplay",             
             guildOnly : true,
        });
    }
    run(params = {msg, args}){
        let msg = params.msg;
        const ytas = new yta(msg.client.auth.googleKey);
        if(!msg.author.donationTier)
            return msg.channel.send("This command has been made Donator-only, due to the fact that you could theoretically play songs forever with it.\nVisit **<http://www.harleybot.me/donate/>** for more information.");
        let validation = msg.guild.playlist.validateCommand(msg, true);
        if(validation)
            return msg.channel.send(validation).catch(err => console.log(err));

        if(msg.guild.playlist.auto)
            msg.channel.send("Auto play is now **OFF**").catch(err => console.log(err));
        else
            msg.channel.send("Auto play is now **ON**").catch(err => console.log(err));
        
        msg.guild.playlist.auto = !msg.guild.playlist.auto;
    }
}