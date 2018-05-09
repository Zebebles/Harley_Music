const Socket = require("../Socket.js");

module.exports = class childSocket extends Socket
{
    constructor(client)
    {
        const name = "load_user";
        
        const fn = (id) => 
            client.users.fetch(id).then(user => client.loadUser(user));

        super(client, name, fn);
    }
}