// ==UserScript==
// @name         hackahackernews
// @description  Comment system enthancement. Highlights new comments/stories, marks stories you visited, adds "jump to new comment" links.
//               Uses localStorage to store IDs of seen/visited stories with corresponding timestamp/number of comments last seen.
// @homepageURL  https://github.com/raszpl/hackahackernews
// @author       Rasz_pl
// @version      0.5
// @date         2022-09-29
// @namespace    https://github.com/raszpl/hackahackernews
// @contact      citizenr@gmail.com
// @license      GNU/GPLv3 http://www.gnu.org/licenses/gpl-3.0.html
// @supportURL   https://github.com/raszpl/hackahackernews
// @match        https://news.ycombinator.com/*
// @grant        none
// ==/UserScript==

let css = '.notseen {background-color: #dff0d8 !important;}';
css += '.seenread {background-color: #d0a5bd !important;}';
css += '.newcomments {color: #d00000 !important;}';
css += '.newcomment {background-color: rgba(255, 149, 40, 0.16) !important; border: 2px solid red !important;}';
css += '.nextcomment {border: 1px solid red; color: red !important; width: 100%; text-align: center; display: block;}';
css += 'table.comment-tree { border-collapse: collapse; }';
let head = document.head || document.getElementsByTagName('head')[0];
let style = document.createElement('style');
style.type = 'text/css';
style.appendChild(document.createTextNode(css));
head.appendChild(style);

let itemarray, maxpost;
let stored, nextcommenthash, comment;
switch(document.getElementsByTagName('html')[0].getAttribute('op'))
{
  case "news":
    itemarray = Array.prototype.map.call(document.querySelectorAll('.athing:not(.comtr)'), function(x) { return x.id; });
    for (let i = 0; i < itemarray.length; i++)
    {
      if (!localStorage.getItem(itemarray[i]))
      {
        document.getElementById(itemarray[i]).className +=" notseen";
        localStorage.setItem(itemarray[i], 1);
      }
      else if (parseInt(localStorage.getItem(itemarray[i]).split(' ')[0])>1)
      {
        document.getElementById(itemarray[i]).className +=" seenread";
        if (parseInt(document.querySelector('.subtext > span.subline > a[href^="item?id='+itemarray[i]+'"]').innerText) > parseInt(localStorage.getItem(itemarray[i]).split(' ')[1]))
        {
          let fresh = parseInt(document.querySelector('.subtext > span.subline > a[href^="item?id='+itemarray[i]+'"]').innerText) - parseInt(localStorage.getItem(itemarray[i]).split(' ')[1]);
          document.querySelector('.subtext > span.subline > a[href^="item?id='+itemarray[i]+'"]').innerHTML += ' <a class="hhn_newcomments"><b>'+fresh+' new</b></a>';
        }
      }
    }
    break;

  case "item":
    stored = localStorage.getItem(document.querySelectorAll('.athing:not(.comtr)')[0].id) ? localStorage.getItem(document.querySelectorAll('.athing:not(.comtr)')[0].id) : "1 0";
    maxpost = parseInt(stored.split(' ')[0]);
    itemarray = Array.prototype.map.call(document.getElementsByClassName("athing comtr"), function(x) { return x.id; });

    nextcommenthash = false;
    for (let i = itemarray.length; i >= 0; i--)
    {
      if (itemarray[i]>maxpost)
      {
        if (nextcommenthash)
        {
          let font= document.createElement("a");
          font.className = "nextcomment";
          font.textContent = "Next";
          font.href = location.href.replace(location.hash,"") +"#"+nextcommenthash;
          font.setAttribute('next-unread', nextcommenthash);
          font.onclick = function(e) {
            document.getElementById(this.getAttribute('next-unread')).classList.remove("noshow");
            document.body.scrollTop += parseInt(document.getElementById(this.getAttribute('next-unread')).getBoundingClientRect().top) - e.clientY + 10;
            return false;
          };
          document.getElementById(itemarray[i]).appendChild(font);
        }

        document.getElementById(itemarray[i]).className +=" newcomment";
        nextcommenthash = itemarray[i];
      }
    }
    if (nextcommenthash)
    {
      window.location.hash = nextcommenthash;
      document.body.scrollTop -= 400;
    }
    maxpost = Math.max.apply(Math,itemarray.concat([1]));
    comment = Array.prototype.map.call(document.getElementsByClassName("athing comtr"), function(x) { return x.id; }).length;
    localStorage.setItem(document.querySelectorAll('.athing:not(.comtr)')[0].id, maxpost +" "+comment);
    break;

  case "threads":
    maxpost = parseInt(localStorage.getItem("mine"));
    itemarray = Array.prototype.map.call(document.getElementsByClassName("athing comtr"), function(x) { return x.id; });
    for (let i = 0; i < itemarray.length; i++)
    {
      if (itemarray[i]>maxpost)
      {
        document.getElementById(itemarray[i]).className +=" newcomment";
      }
    }
    maxpost = (maxpost > Math.max.apply(Math,itemarray.concat([1]))) ? maxpost : Math.max.apply(Math,itemarray.concat([1]));
    localStorage.setItem("mine", maxpost);
    break;

  case "reply":
    break;
}
