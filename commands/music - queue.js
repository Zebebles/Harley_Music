const DBF = require('discordjs-bot-framework');
const snekfetch = require("snekfetch");
const yts = require('youtube-search');
const Discord = require("discord.js");

module.exports = class Queue extends DBF.Command{
    constructor(){
        super({
             name: "queue",
             triggers: ["que", "q"],
             group: "Music",
             ownerOnly : false,
             description: "Take a look at which songs are queued.",
             example: ">>queue page_number",             
             guildOnly : true,
             reqArgs : true,
             reqBotPerms : ["EMBED_LINKS"]
        });
    }
    run(params = {msg, args}){
        let msg = params.msg; let args = params.args;
        let channel = msg.guild.voiceConnection;
        let playlist = msg.guild.playlist;
        let validation = msg.guild.playlist.validateCommand(msg,true);
        if(validation)
            return msg.channel.send(validation).catch(err => console.log(err));
        let page;
        if(args) page = parseInt(args);
        if(!page || isNaN(page)) page = 1;
        page--;
        let pages = Math.ceil(playlist.queue.left/5);
        if(page >= pages)
            page = pages-1;
        
        let embed = generateMessage(page);
        let qm;
        if(embed)    
            qm = msg.channel.send("", {embed}).catch(err => console.log(err));
        else
            return msg.channel.send("Please enter a page number between `1` and `" + (pages-1) + "`").catch(err => console.log(err));

        if(qm && msg.guild.me.hasPermission("MANAGE_MESSAGES") && msg.guild.me.hasPermission("ADD_REACTIONS") && pages > 1)
            qm.then(m => m.react("⬅").catch(err => console.log(err))
            .then(prev => m.react("➡").catch(err => console.log(err)).then(next => {
                const filter = (r,user) => user.id != m.client.user.id && (r.emoji.name == prev.emoji.name || r.emoji.name == next.emoji.name);
                let collector = new Discord.ReactionCollector(m, filter);
                
                var timeout = setTimeout(() => {
                    m.reactions.removeAll().catch(err => err);
                    collector.stop();
                },10000);

                collector.on("collect", reaction => {
                    clearTimeout(timeout);
                    reaction.users.remove(reaction.users.find(u => !u.bot)).catch(err => err);
                    if(reaction.emoji.name == prev.emoji.name)
                    {
                        page--;
                        if(page < 0)
                            page = pages-1;
                    }
                    else
                    {
                        page++;
                        if(page >= pages)
                            page = 0;
                    }
                    embed = generateMessage(page);
                    m.edit("", {embed}).catch(err => console.log(err));
                    timeout = setTimeout(() => {
                        m.reactions.removeAll().catch(err => err);
                        collector.stop();
                    },10000);
                });
            })));
    
    
        function generateMessage(page){
            let message = "";
            let done = false;
            let ind = 0;
            for(let i = 1+(5*page); i < 6+(5*page) && i < playlist.queue.left+1; i++){
                ind++;
                message += "\n**" + i + "**\t-\t`" + playlist.queue.songAt(i).title + "`";
            }

            if(message != ""){
                let myEmbed = new Discord.MessageEmbed();
                myEmbed.setColor(msg.guild.me.displayColor);
                myEmbed.setTitle("Showing page " + (page+1) + " of " + (pages) + ".");
                myEmbed.setDescription(message);
                myEmbed.setFooter("Showing " + ind + " of " + (playlist.queue.length-1) + " songs.");
                
                return myEmbed;
            }else
                return null;
        }
    }

}