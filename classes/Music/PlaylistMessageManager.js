const {MessageEmbed, ReactionCollector} = require("discord.js");

module.exports = class PlaylistMessageManager
{
    constructor(playlist)
    {
        this.reactions = [  {emoji: "🛑", run: playlist.guild.client.commands.find(cmd => cmd.areYou("stop")).run},
                            {emoji: "⏯", run: playlist.guild.client.commands.find(cmd => cmd.areYou("pause")).run},
                            {emoji: "⏭", run: playlist.guild.client.commands.find(cmd => cmd.areYou("skip")).run}, 
                            {emoji: "🔀", run: playlist.guild.client.commands.find(cmd => cmd.areYou("shuffle")).run}
                         ];
        
        this.playlist = playlist;

        this.filter = (reaction, user) => !user.bot && this.reactions.find(r => r.emoji == reaction.emoji.name);

        this.textChannel = playlist.guild.defaultTextChannel;

        this.embed = new MessageEmbed({color: this.playlist.guild.me.displayColor,
                                    fields: [   {name: "Duration", value: "N/A", inline: true},
                                                {name: "Songs Left", value: "0", inline: true}
                                            ]});

        this.onCollect = (reaction, user) => {
            reaction.users.remove(reaction.users.find(u => !u.bot))
            this.reactions.find(react => reaction.emoji.name == react.emoji).run({msg: {    author: user,
                                                                                            member: playlist.guild.member(user),
                                                                                            channel: this.textChannel,
                                                                                            guild: playlist.guild,
                                                                                            client: playlist.guild.client   } });
        };
    }

    set message(val)
    {   
        this.collector ? this.collector.message = val : null;
    }

    get message()
    {
        return this.collector ? this.collector.message : null;
    }

    stop(reason)
    {
        this.update({title: ":octagonal_sign: Music playback stopped.", fields : [{name : "Reason", value : reason ? reason : "Unknown",}]});
        
        if(this.collector)
            this.collector.stop();

        this.collector = null;
        this.message = null;
    }

    addReactions()
    {
        this.message ? this.message.react(this.reactions[0].emoji).catch(e => e).then(() => {
            this.message ? this.message.react(this.reactions[1].emoji).catch(e => e).then(() => {
                this.message ? this.message.react(this.reactions[2].emoji).catch(e => e).then(() => {
                    this.message ? this.message.react(this.reactions[3].emoji).catch(e => e) : null;
                }) : null;
            }) : null;
        }) : null;
    }

    updateEmbed()
    {
        let song = this.playlist.queue.current;
        this.embed.setURL(song.url);
        this.embed.title = (this.playlist.dispatcher && this.playlist.dispatcher.paused ? ":pause_button: " : ":arrow_forward: ") + song.title;
        this.embed.setImage(song.image);
        this.embed.fields.find(field => field.name == "Duration").value = this.getDurationString(song.duration);
        this.embed.fields.find(field => field.name == "Songs Left").value = this.playlist.queue.length;
    }

    update(endedEmbed)
    {
        if(endedEmbed)
        {
            if(this.message)
                this.message.delete();
            return this.textChannel.send("", {embed: endedEmbed});
        }

        this.updateEmbed();
        
        if(!this.message)
        {
            this.textChannel.send("",{embed: this.embed}).then(msg => {
                this.message = msg;
                this.collector = new ReactionCollector(msg, this.filter).on("collect", this.onCollect); 
                this.addReactions();
            }).catch(err => console.log(err));
        }
        else if(this.textChannel.lastMessage.id != this.message.id)
        {
            this.message.delete();
            this.textChannel.send("",{embed: this.embed}).then(msg => {
                this.message = msg;
                this.addReactions();
            }).catch(err => console.log(err));
        }
        else
            this.message.edit("",{embed: this.embed})
                .catch(err => {
                    this.textChannel.send("",{embed: this.embed}).then(msg => {
                        this.message = msg;
                        this.addReactions();
                    }).catch(err => console.log(err))
                });
    }

    sendQueueMessage(msg, song)
    {
        var embed = new MessageEmbed();
        embed.description = "**Title\t-**\t`" + song.title + "`" + (song.tracks ? "\n**Tracks\t-**\t`" + song.tracks + "`": "\n**Position\t-**\t`" + this.playlist.queue.positionOf(song.title) + "`");
        embed.title = song.tracks ? ":notes: Playlist/Albm added to queue" : ":musical_note: Track added to queue";
        embed.setThumbnail(song.image ? song.image : song.songs[0].image);
        embed.setColor(msg.guild.me.displayColor);
        
        if(this.queueMessage)
            this.queueMessage.edit("", {embed}).then(m => this.queueMessage = null);
        else
            msg.channel.send("", {embed}).then(m => this.queueMessage = null);
    }

    getDurationString(time)
    {
        if(!time || isNaN(time))
            return "Unknown";
        var date = new Date(null);
        date.setSeconds(time); // specify value for SECONDS here
        return date.toISOString().substr(11, 8);
    }
}
