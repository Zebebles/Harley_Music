const DBF = require("discordjs-bot-framework");
const Discord = require("discord.js");
const mysql = require("mysql");
const Playlist = require("./playlist.js");
const fetch = require("node-fetch");
const snekfetch = require("snekfetch");
var Promise = require("bluebird");
const auth = require('../resources/auth.json');
require("../unlisted/mysql_functions.js")();

class myClient extends DBF.Client {
    constructor(options = {}) {
        super(options);

        this.on("guildCreate", guild => 
        {
            guild.defaultTextChannel = this.getDefaultChannel(guild);
            guild.prefix = this.prefix;
            guild.playlist = new Playlist(guild);
            guild.disabledCommands = new Array();
            guild.channels.filter(ch => ch.type == "text").forEach(ch => ch.disabledCommands = new Array());
            this.sendStatus(true);   
            this.loadUsers(this);
        });

        this.on("channelCreate", channel => 
        {
            channel.disabledCommands = new Array();
        });

        this.on("channelDelete", channel => 
        {
            if (channel.disableCommands)
                channel.disabledCommands.forEach(cmd => this.enableCommand(channel.guild, channel.id, cmd));
        });

        this.on("guildDelete", guild => 
        {
            this.sendStatus(true);
        });

        this.on("guildMemberAdd", member => 
        {
            this.loadUser(member.user);
        });
    }

    getDefaultChannel(guild)
    {
        if(guild.defaultRole.hasPermission("ADMINISTRATOR"))
            return guild.channels.filter(ch => ch.type == "text").sort((a,b) => a.position-b.position).first();
        else if(guild.defaultRole.hasPermission("SEND_MESSAGES"))
            return guild.channels.filter(ch => ch.type == "text" && !ch.permissionOverwrites.find(overwrite => overwrite.id == guild.defaultRole.id && new Discord.Permissions(overwrite.deny).has("SEND_MESSAGES"))).sort((a,b) => a.position-b.position).first();
        else
            return guild.channels.filter(ch => ch.type == "text" && ch.permissionOverwrites.find(overwrite => overwrite.id == guild.defaultRole.id && new Discord.Permissions(overwrite.allow).has("SEND_MESSAGES"))).sort((a,b) => a.position-b.position).first();
    }

    sendStatus(extended){
        let status = {
            status: this.user.presence.status,
            guilds: this.guilds.size,
            connections: this.voiceConnections.size,
            connlist: []
        };
        if(extended)
            this.voiceConnections.forEach(conn => 
                status.connlist.push({
                    id: conn.channel.guild.id,
                    guild: conn.channel.guild.name,
                    length: conn.channel.guild.playlist.queue.length,
                    members: conn.channel.members.size
                }));
        snekfetch.post("http://"+this.auth.webserver + "/servers/status")
                .send({status})
                .end()
                .catch(err => {
                    console.log("ERROR SENDING STATUS\n<br/>"+err);
                });
        return status;
    }

    register(){
        return new Promise((resolve, reject) => {
            snekfetch.get("http://"+auth.webserver+"/servers/register?pw=" + auth.password).then(response => {
                if(response.status != 200)
                    return console.log("Error re-registering server");
                snekfetch.get("http://"+auth.webserver + "/servers/auth").then(authResponse => {
                    if(authResponse.status != 200)
                        return console.log("Error fetching auth.");
                    this.auth = JSON.parse(authResponse.text);
                }).catch(err => console.log("Error Authorising)"));
            }).catch(err => console.log("Error Registering server"));
        })
    }

    loadUsers(client){
        var conn = mysql.createConnection({
            host: this.auth.webserver.split(":")[0],
            user: "root",
            password: this.auth.password
        });
        
        conn.connect(function(err) {
            if(err)
                return console.log(err);
            loadUsersDB(conn, client).then(conn => {
                console.log("Successfully loaded " + client.users.size + " users.");
            }).finally(() => {
                conn.end();
            }).catch(err => console.log("Error loading users.\n" + err));
        });
    }

    loadUser(user)
    {
        var conn = mysql.createConnection({
            host: this.auth.webserver.split(":")[0],
            user: "root",
            password: this.auth.password
        });

        conn.connect(function(err) {
            if(err)
                return console.log(err);
            loadUser(conn, user).catch(err => {
                console.log("Error loading user " + user.username + ".\n" + err);
            }).finally(() => {
                conn.end();
            });
        });
    }
    
    loadGuilds(client) {
        var conn = mysql.createConnection({
            host: this.auth.webserver.split(":")[0],
            user: "root",
            password: this.auth.password
        });
        conn.connect(function (err) {
            if(err)
                return console.log(err);
            loadPrefixes(conn, client).then(conn => {
                console.log("Successfully loaded prefixes for " + client.guilds.size + " servers!");
                    loadDisabledCommands(conn, client).then(conn => {
                        console.log("Successfully loaded disabled commands for " + client.guilds.size + " servers!");
                        conn.end();
                    }).catch(err => {
                        console.log("Error: " + err);
                        conn.end();
                    });
            }).catch(err => console.log(err)); //catch loadPrefixes
        });

        client.guilds.forEach(guild => {
            guild.defaultTextChannel = this.getDefaultChannel(guild);
        });
    }
}
module.exports = myClient;