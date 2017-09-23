# hackahackernews

Hackernews(https://news.ycombinator.com) comment/viewed improvements userscript. 

- purple highlight for stories you visited and read comments
- keeps track of read comments, displays number of fresh ones
- green highlight for new stories, makes easier skipping already seen ones

![news](https://github.com/raszpl/hackahackernews/raw/master/news.png)

- red border/orange tint for new comments
![comment](https://github.com/raszpl/hackahackernews/raw/master/comment.png)


Designed and tested on Chrome/Vivaldi/Opera using Tampermonkey. Uses localStorage to store "ID" = "highest ID, comments last seen" key/value pair.