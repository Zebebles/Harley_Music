const DBF = require("discordjs-bot-framework");
const Discord = require("discord.js");
const mysql = require("mysql");
const Playlist = require("./Music/Playlist.js");
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
            guild.playlist = new Playlist(guild);
            this.loadGuilds([guild]);
            this.socketManager.sendStatus(true);   
            this.loadUsers(this);
        });

        this.on("channelCreate", channel => 
        {
            channel.disabledCommands = [];
        });

        this.on("guildDelete", guild => 
        {
            this.socketManager.sendStatus(true);
        });

        this.on("guildMemberAdd", member => 
        {
            this.loadUser(member.user);
        });
    }

    getDefaultChannel(guild)
    {
        if(!guild)
            return;
        if(guild.defaultRole.permissions.has("ADMINISTRATOR"))
            return guild.channels.filter(ch => ch.type == "text").sort((a,b) => a.position-b.position).first();
        else
            return guild.channels.filter(ch => ch.type == "text" && ch.permissionsFor(guild.me).has("SEND_MESSAGES") && ch.permissionsFor(guild.defaultRole).has("SEND_MESSAGES")).sort((a,b) => a.position-b.position).first();
    }

    loadUsers(client){
        var conn = mysql.createConnection({
            host: this.auth.sqlServer,
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
            host: this.auth.sqlServer,
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
    
    loadGuilds(guilds) {
        var conn = mysql.createConnection({
            host: this.auth.sqlServer,
            user: "root",
            password: this.auth.password
        });
        conn.connect(function (err) {
            if(err)
                return console.log(err);
            loadPrefixes(conn, guilds).then(conn => {
                    loadDisabledCommands(conn, guilds).then(conn => {
                        conn.end();
                    }).catch(err => {
                        conn.end();
                    });
            }).catch(err => console.log(err)); //catch loadPrefixes
        });

        guilds.forEach(guild => {
            guild.defaultTextChannel = this.getDefaultChannel(guild);
        });
    }
}
module.exports = myClient;