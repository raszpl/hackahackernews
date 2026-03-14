// ==UserScript==
// @name         hackahackernews
// @description  Comment system enthancement. Highlights new comments/stories, marks stories you visited, adds "jump to new comment" links. localStorage stores IDs of seen/visited stories with corresponding timestamp/number of comments last seen.
// @homepageURL  https://github.com/raszpl/hackahackernews
// @author       Rasz_pl (citizenr@gmail.com)
// @version      0.6.1
// @namespace    https://github.com/raszpl/hackahackernews
// @license      GNU/GPLv3 http://www.gnu.org/licenses/gpl-3.0.html
// @updateURL    https://github.com/raszpl/hackahackernews
// @downloadURL  https://github.com/raszpl/hackahackernews
// @supportURL   https://github.com/raszpl/hackahackernews/issues
// @match        https://news.ycombinator.com/*
// @grant		GM_addStyle
// @grant		GM_getValue
// @grant		GM_setValue
// ==/UserScript==

let css = '.notseen {background-color: #dff0d8;}';
css += '.seenread {background-color: #d0a5bd;}';
css += '.newcomments {color: #d00000;}';
css += '.newcomment {background-color: rgba(255, 149, 40, 0.16); border: 2px solid red;}';
css += '.nextcomment {border: 1px solid red; color: red; width: 100%; text-align: center; display: block;}';
css += '.hhn_mycomment {background-color: rgba(40, 255, 129, 0.16); border: 2px solid green;}';
css += 'table.comment-tree {border-collapse: collapse;}'; // looks better when drawing borders around new/own posts
css += '.subtext a:visited {color: #ab6060 !important;}'; // make visited links more visible
GM_addStyle(css);

const nickname = document.getElementById("me")?.textContent;
let itemarray, maxpost;
let stored, nextcommenthash, comment;

// Use IntersectionObserver.isIntersecting to make sure we only annotate and store data we actually saw, ignore tabs opened in the background until made active. Browser crash no longer loses background tab reading progress.
const observe = new IntersectionObserver(entries => {
	for (const entry of entries) {
		if (entry.isIntersecting) {
			observe.disconnect();
			annotate();
		}
	}
},{});
observe.observe(document.getElementById("hnmain"));

function annotate() {
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
          document.querySelector('.subtext > span.subline > a[href^="item?id='+itemarray[i]+'"]').innerHTML += ' <a class="newcomments"><b>'+fresh+' new</b></a>';
        }
      }
    }
    break;

  case "item":
	const itemid = document.querySelectorAll('.athing:not(.comtr)')[0].id;
    const stored = localStorage.getItem() ? localStorage.getItem(itemid) : "1 0";
	const comments = document.querySelectorAll('.athing.comtr');
	const comments_number = comments.length;
	const maxpost = parseInt(stored.split(' ')[0]);
	let new_maxpost = 0;
	nextcommenthash = false;

    for (let idx = comments.length-1; idx >= 0; idx--) // we are processing from the bottom up
    {
		const commentid = Number(comments[idx].id);
		const element = comments[idx];

		if (commentid > new_maxpost) new_maxpost = commentid;
		if (commentid > maxpost)
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
          element.appendChild(font);
        }

        element.classList.add("newcomment");
        nextcommenthash = commentid;
      }
		// moderated/removed posts have no hnuser element so lets make sure this one does before comparison
		if (nickname && element.querySelector('.hnuser')?.textContent == nickname) {
			element.classList.add('hhn_mycomment');
		}
	}
    if (nextcommenthash)
    {
      window.location.hash = nextcommenthash;
      document.body.scrollTop -= 400;
    }

    localStorage.setItem(itemid, new_maxpost +" "+ comments_number);
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
}