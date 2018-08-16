# hackahackernews

Hackernews(https://news.ycombinator.com) comment/viewed improvements userscript. 

![news](https://github.com/raszpl/hackahackernews/raw/master/news.png)

- [21.] black font - unvisited story link, purple highlight - visited HN comments, red - 60 unseen comments.
- [22.] grey font - visited story link, green highlight - new HN story
- [23.] no highlight - unvisited HN comments
- [24.] black font - unvisited story link, green highlight - new HN story
- [25.] grey font - visited story link, purple highlight - visited HN comments, red - 8 unseen comments.

![comment](https://github.com/raszpl/hackahackernews/raw/master/comment.png)

- red border/orange tint for new comments
- NEXT button in upper right corner jumps to the next new comment



Designed and tested on Chrome/Vivaldi/Opera using Tampermonkey. Uses localStorage to store "ID" = "highest ID, comments last seen" key/value pair.