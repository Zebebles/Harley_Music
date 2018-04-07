const mysql = require("mysql");
var Promise = require("bluebird");
module.exports = function () {

    this.loadPrefixes = function (conn, guilds) {
        return new Promise(function (resolve, reject) {
            conn.query("use Guilds", (err, res) => {
                if (err) return reject(err);
                guilds.forEach(guild => {
                    conn.query("SELECT * FROM Guilds WHERE id = " + guild.id + " LIMIT 1;", (err, res) => {
                        if (err) return reject(err);
                        if (res.length != 0)
                            conn.query("SELECT * FROM Prefixes WHERE id = " + guild.id + " LIMIT 1", (err, res) => {
                                if (err)
                                    return reject(err);
                                if (res.length != 0)
                                    guild.prefix = res[0].prefix;
                            });
                        if (guild.id == guilds[guilds.length - 1].id)
                            resolve(conn);
                    });
                });
            });
        });
    }

    this.loadDisabledCommands = function (conn,guilds) {
        return new Promise((resolve, reject) => {
            conn.query("Use Guilds", (err, res) => {
                if (err)
                    return reject(err);
                guilds.forEach(guild => {
                    conn.query("SELECT * FROM DisabledCommands WHERE guildId = " + guild.id, (err, res) => {
                        if (err)
                            return reject(err);
                        guild.disabledCommands = new Array();
                        guild.channels.filter(ch => ch.type == "text").forEach(ch => ch.disabledCommands = new Array());
                        res.forEach(result => {
                            if (result.channelId == "all")
                                guild.disabledCommands.push(result.command);
                            else if (guild.channels.get(result.channelId))
                                guild.channels.get(result.channelId).disabledCommands.push(result.command);
                        });
                    });
                    if (guild.id == guilds[guilds.length - 1].id) {
                        setTimeout(() => {
                            resolve(conn);
                        }, 1);
                    }
                });
            });
        });
    }

    this.loadUsersDB = function(conn, client){
        return new Promise((resolve, reject) => {
            conn.query("Use Users", (err, res) => {
                if(err)
                    reject(err);
                conn.query("SELECT * FROM Donators;", (err, res) => {
                    if(err)
                        return reject(err);
                    res.forEach(tuple => {
                        client.fetchUser(tuple.id).then(user => {
                            if(user)
                            {
                                if(tuple.tier)
                                    user.donationTier = tuple.tier;
                                if(tuple.expires)
                                    user.donationExpires = tuple.expires;
                            }
                        }).catch(err => err);                                       
                    });
                    resolve(conn);
                });
            });
        });
    }

    this.loadUser = function(conn, user){
        return new Promise((resolve, reject) => {
            conn.query("Use Users", (err, res) => {
                if(err)
                    return reject(err);
                conn.query("select * from Donators WHERE id = '" + user.id + "';", (err, res) => {
                    if(err || !res || !res.length || res.length == 0 || !res[0]){
                        return resolve(conn);                        
                    }
                    if(res[0].tier)
                        user.donationTier = res[0].tier;
                    else if(user.donationTier)
                        user.donationTier = null;
                    if(res[0].expires)
                        user.donationExpires = res[0].expires;
                    else if(user.donationExpires)
                        user.donationExpires = null;
                    resolve(conn);
                });
            }); 
        });
    }
}