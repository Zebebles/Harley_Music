
module.exports = class PlaylistMessageManager{
    constructor(guild)
    {
        this.guild = guild;
    }

    updateMessage(reason){
        var embed = new Discord.RichEmbed();
        if(!this.textChannel || !this.guild.channels.find(ch => ch.id == this.textChannel.id))
            this.textChannel = this.guild.defaultTextChannel;
        embed.setColor(this.guild.me.displayColor);            
        if(!reason){
            if(this.paused)
                embed.setTitle(":pause_button: " + this.queue[0].title);
            else    
                embed.setTitle(":arrow_forward: " + this.queue[0].title);
            
            embed.addField("Duration", this.getDurationString(this.queue[0].duration), true);
            embed.addField("Songs Left", this.queue.length-1, true)
            embed.setImage(this.queue[0].image.replace("large", "t500x500"));
            if(this.queue[0].type == "youtube")
                embed.setURL("https://www.youtube.com/watch?v=" + this.queue[0].link);
            else   
                embed.setURL(this.queue[0].url);
        }else{
            embed.setTitle(":octagonal_sign: Music playback stopped");
            embed.addField("Reason", reason);
            if(this.message)
            {
                if(this.message.collector)
                    this.message.collector.stop();
                this.message.delete().catch(err => err);
            }
            return this.textChannel.send("", {embed}).catch(err => console.log(err));
        }
        let playingmessage;
        if(!this.message)
            playingmessage = this.textChannel.send("", {embed}).then(m => this.message = m);
        else if(this.textChannel.lastMessageID != this.message.id && !this.paused){
            if(this.message.collector)
                this.message.collector.stop();
            this.message.delete().catch(err => err);
            playingmessage = this.textChannel.send("", {embed}).then(m => this.message = m);
        }else{
            playingmessage = this.message.edit("", {embed}).catch(err => this.textChannel.send("", {embed}).then(m => this.message = m));
            if(reason)
                playingmessage.then(m => m.clearReactions());
            return;
        }
        if(!this.textChannel.guild.me.hasPermission("MANAGE_MESSAGES") || !this.textChannel.guild.me.hasPermission("ADD_REACTIONS"))
            return; //dont do the message reactions if you dont have perms.
        
        playingmessage.then(message => {
            message.react("🛑").catch(err => (err))
            .then(stop => message.react("⏯").catch(err => (err))
            .then(playpause => message.react("⏭").catch(err => (err))
            .then(next => message.react("🔀").catch(err => (err))
            .then(shuffle => {
                if(!this.textChannel || (message.collector && !message.collector.ended))
                    return;
                const filter = (r,user) => user.id != message.client.user.id && (r.emoji.name == stop.emoji.name || r.emoji.name == playpause.emoji.name || r.emoji.name == next.emoji.name || r.emoji.name == shuffle.emoji.name);
                message.collector = new Discord.ReactionCollector(message, filter);
                message.collector.on("collect", reaction => {
                    message.author = reaction.users.find(u => !u.bot);
                    message.member = message.guild.member(reaction.users.find(u => !u.bot));
                    reaction.remove(reaction.users.find(u => !u.bot)).then(() => {
                        if(reaction.emoji.name == stop.emoji.name)
                            message.client.commands.find(cmd => cmd.areYou("stop")).run({msg: message});
                        else if(reaction.emoji.name == next.emoji.name)
                            message.client.commands.find(cmd => cmd.areYou("skip")).run({msg: message});
                        else if(reaction.emoji.name == playpause.emoji.name)
                            message.client.commands.find(cmd => cmd.areYou("pause")).run({msg: message});
                        else if(reaction.emoji.name == shuffle.emoji.name)
                            message.client.commands.find(cmd => cmd.areYou("shuffle")).run({msg: message});
                    });
                });
            }))));
        });
    }

    sendQueueMessage(msg, song){
        var embed = new Discord.RichEmbed();
        embed.addField("Name", song.title);
        if(!msg.guild.me)
            return;
        embed.setColor(msg.guild.me.displayColor);
        if(song.type == "spotify" && !song.image)
            embed.setThumbnail("http://www.stickpng.com/assets/images/59b5bb466dbe923c39853e00.png");
        else if(!song.tracks)
            embed.setThumbnail(song.image);
        
        if(song.tracks){
            embed.setTitle(":notes: Playlist/Album added to queue");
            embed.addField("Number of tracks", song.tracks);
        }else{
            embed.setTitle(":musical_note: Track added to queue");
            embed.addField("Duration", this.getDurationString(song.duration), true);
            embed.addField("Position", this.queue.indexOf(this.queue.find(s => s.title == song.title)), true);
        }
        if(this.qmessage)
            this.qmessage.edit("", {embed}).then(m => this.qmessage = null);
        else
            msg.channel.send("", {embed}).then(m => this.qmessage = null);
    }

    getDurationString(time){
        var date = new Date(null);
        date.setSeconds(time); // specify value for SECONDS here
        return date.toISOString().substr(11, 8);
    }
}