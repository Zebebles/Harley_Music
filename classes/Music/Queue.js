const Video = require("./Video/Video.js");

module.exports = class Queue
{
    constructor(playlist)
    {
        this.playlist = playlist;
        this.songs = ["filler"];
        this.index = -1;
    }

    get current()
    {
        return this.songs.length && this.index != -1 ? this.songs[0] : null;
    }

    get empty() //  RETURNS A BOOLEAN THAT SIGNIFIES IF THE QUEUE IS EMPTY OR NOT.
    {
        return (!this.songs.length || this.songs[0] == "filler" || this.index > this.songs.length-1) ? true : false;
    }

    get length()
    {
        return this.songs.length;
    }

    songAt(ind) //  RETURNS THE SONG AT THE IND PROVIDED.
    {
        return (ind == null || isNaN(ind) || this.songs.length <= (this.index+ind) || this.index-ind < 0) ? null : this.songs[this.index + ind];
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
        if(!isNaN(number) && ((!this.loop && this.index + number > this.songs.length) || number < 0))
            throw Error("Number provided either isnt a number or is more songs that there are in the queue.");
        else if(!isNaN(number))
            this.index += number;
        else
            this.index++;

        if(this.index >= this.songs.length)
        {
            if(this.loop)
            {
                this.index = 0 + (this.index - this.songs.length);
                this.loop--;
            }
            else
                this.clear();
        }
        console.log(this.index);
    }

    prev(number)
    {
        let toDecrement = 2;
        if(!isNaN(number) && (this.index - number < -1 || number < 0))
            throw Error("Can't go back that many songs.");
        else if(!isNaN(number))
            toDecrement += number;
        else if(this.playlist.dispatcher && this.playlist.dispatcher.time > 10000)  //  IF THE DISPATCHER HAS BEEN PLAYING FOR OVER 10 SECONDS, GO BACK TO THE START OF THE SONG.
            toDecrement = 1;
        this.index -= toDecrement;
    }

    repeat() //  REPEATS THE CURRENT SONG
    {
        if(this.songs.length)
            this.songs.splice(0,0,this.songs[this.index]);
    }

    loop()
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
    }

    add(song, first)  //  ADDS A SONG TO THE ARRAY
    {
        if(!song || !(song instanceof Video))
            throw Error ("Must provide a song to add, and the song must be an instance of Video class");
        if(first)
            this.songs.splice(this.index+1, 0, song);
        else
            this.songs.push(song);
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