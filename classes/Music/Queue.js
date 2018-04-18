const Video = require("./Video/Video.js");

module.exports = class Queue
{
    constructor(playlist)
    {
        this.playlist = playlist;
        this.songs = ["filler"];
        this.index = -1;
        this.loop = 0;
    }

    get current()
    {
        return this.songs.length && this.index != -1 ? this.songs[this.index] : null;
    }

    get empty() //  RETURNS A BOOLEAN THAT SIGNIFIES IF THE QUEUE IS EMPTY OR NOT.
    {
        return (this.songs.length == 0 || this.songs[0] == "filler" || this.left <= 0 || this.index >= this.songs.length) ? true : false;
    }

    get length()
    {
        return this.songs.length;
    }

    get left()
    {
        return this.songs.length - this.index+1;
    }

    songAt(ind) //  RETURNS THE SONG AT THE IND PROVIDED.
    {
        return (ind == null || isNaN(ind) || (this.index+ind) >= this.songs.length || (this.index+ind) < 0) ? null : this.songs[this.index + ind];
    }

    positionOf(ident)
    {
        return ident ? this.songs.lastIndexOf(this.find(ident)) : null;
    }

    find(ident)
    {
        return ident ? this.songAt(ident) || this.songs.find(song => song.title && song.title.toLowerCase().includes(ident.toLowerCase())) : null;
    }

    next(number)  //  MOVES THE QUEUE FORWARD BY ONE POSITION UNLESS NUMBER IS PROVIDED, THEN IT WILL SKIP NUMBER SONGS.
    {
        if(!isNaN(number) && number < 0)
            throw Error("Can't skip that many songs.");
        else if(!isNaN(number))
            this.index += number;
        else
            this.index++;

        if(this.index >= this.songs.length)
        {
            if(this.loop > 0)
            {
                this.index = 0 + (this.index - this.songs.length);
                this.loop--;
            }
        }
    }

    prev(number)
    {
        let toDecrement = 2;
        if(!isNaN(number) && number < 0)
            throw Error("Number must be positive");
        else if(!isNaN(number))
            toDecrement = 1+number;
        this.index -= toDecrement;
        if(this.index < -1)
            this.index = -1;
    }

    repeat() //  REPEATS THE CURRENT SONG
    {
        if(this.songs.length)
            this.songs.splice(0,0,this.songs[this.index]);
    }

    doLoop()
    {
        this.loop++;
        return this.loop;
    }

    shuffle()   //  SHUFFLES THE ARRAY OF SONGS
    {
        for (var i = this.songs.length - 1; i > this.index+1; i--) {
            var j = Math.floor(Math.random() * (i + 1)+this.index+1);
            var temp = this.songs[i];
            this.songs[i] = this.songs[j];
            this.songs[j] = temp;
        }
    }

    clear() //  REMOVES ALL THE SONGS FROM THE QUEUE
    {
        this.songs = ["filler"];
        this.index = -1;
        this.loop = 0;
    }

    add(song, first)  //  ADDS A SONG TO THE ARRAY
    {
        if(!song || !(song instanceof Video))
            throw Error ("Must provide a song to add, and the song must be an instance of Video class");
        if(first)
            this.songs.splice(this.index+1, 0, song);
        else
            this.songs.push(song);

        if(this.songs[0] == "filler")
            this.songs.splice(0,1);
    }

    remove(song, amount)    //  SONG CAN BE A VIDEO OR A STRING THAT IDENTIFIES THE VIDEO (TITLE)
    {                       //  OR AN ARRAY INDEX.  IF SONG IS AN ARRAY INDEX AND AMOUNT IS SET, THEN THE AMOUNT OF SONGS WILL BE REMOVED STARTING AT SONGS[SONG]
        let removed;
        if(song instanceof Video && this.songs.find(s => s == song))
            removed = this.songs.splice(this.songs.lastIndexOf(song), 1);
        else if(isNaN(song)) //IF SONG IS NOT A NUMBER (PROBABLY A STRING)
            removed = this.songs.splice(this.songs.lastIndexOf(this.findSong(song)),1);
        else
        {
            if(amount && !isNaN(amount))
                removed = this.songs.splice(this.index+song, amount);
            else
                removed = this.songs.splice(this.index+song, 1);
        }

        return removed && removed.length ? removed : null; 
    }

}