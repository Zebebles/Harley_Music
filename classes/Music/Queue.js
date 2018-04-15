const Video = require("./Video/Video.js");

module.exports = class Queue
{
    constructor(playlist)
    {
        this.playlist = playlist;
        this.songs = ["filler"];
    }

    get current()
    {
        return this.songs.length ? this.songs[0] : null;
    }

    get empty() //  RETURNS A BOOLEAN THAT SIGNIFIES IF THE QUEUE IS EMPTY OR NOT.
    {
        return !this.songs.length || this.songs[0] == "filler" ? true : false;
    }

    get length()
    {
        return this.songs.length;
    }

    songAt(ind) //  RETURNS THE SONG AT THE IND PROVIDED.
    {
        return (ind == null || isNaN(ind) || this.songs.length <= ind) ? null : this.songs[ind];
    }

    positionOf(ident)
    {
        return ident ? this.songs.indexOf(this.find(ident)) : null;
    }

    find(ident)
    {
        return ident ? this.songAt(ident) || this.songs.find(song => song.title && song.title.toLowerCase().includes(ident.toLowerCase())) : null;
    }

    next(number)  //  MOVES THE QUEUE FORWARD BY ONE POSITION UNLESS NUMBER IS PROVIDED, THEN IT WILL SKIP NUMBER SONGS.
    {
        if(!isNaN(number) && number > this.songs.length)
            throw Error("Number provided either isnt a number or is more songs that there are in the queue.");
        else if(!isNaN(number))
            this.songs.splice(0,number);
        else
            this.songs.splice(0,1);
    }

    repeat() //  REPEATS THE CURRENT SONG
    {
        if(this.songs.length)
            this.songs.splice(0,0,this.songs[0]);
    }

    shuffle()   //  SHUFFLES THE ARRAY OF SONGS
    {
        for (var i = this.songs.length - 1; i > 1; i--) {
            var j = Math.floor(Math.random() * (i + 1)+1);
            var temp = this.songs[i];
            this.songs[i] = this.songs[j];
            this.songs[j] = temp;
        }
    }

    clear() //  REMOVES ALL THE SONGS FROM THE QUEUE
    {
        this.songs = ["filler"];
    }

    add(song)  //  ADDS A SONG TO THE ARRAY
    {
        if(!song || !(song instanceof Video))
            return Error ("Must provide a song to add, and the song must be an instance of Video class");
        this.songs.push(song);
    }

    addAt(song, ind)
    {
        if(!song || !(song instanceof Video))
            return Error ("Must provide a song to add, and the song must be an instance of Video class");
        ind = ind ? ind : 1;
        this.songs.splice(ind,0,song);
    }

    remove(song, amount)    //  SONG CAN BE A VIDEO OR A STRING THAT IDENTIFIES THE VIDEO (TITLE)
    {                       //  OR AN ARRAY INDEX.  IF SONG IS AN ARRAY INDEX AND AMOUNT IS SET, THEN THE AMOUNT OF SONGS WILL BE REMOVED STARTING AT SONGS[SONG]
        let removed;
        if(song instanceof Video && this.songs.find(s => s == song))
            removed = this.songs.splice(this.songs.indexOf(song), 1);
        else if(isNaN(song)) //IF SONG IS NOT A NUMBER (PROBABLY A STRING)
            removed = this.songs.splice(this.songs.indexOf(this.findSong(song)),1);
        else
        {
            if(amount && !isNaN(amount))
                removed = this.songs.splice(song, amount);
            else
                removed = this.songs.splice(song, 1);
        }

        return removed && removed.length ? removed : null; 
    }

}