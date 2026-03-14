// ==UserScript==
// @name		hackahackernews
// @description	Comment system enthancement. Highlights new comments/stories, marks stories you visited, adds "jump to new comment" links. localStorage stores IDs of seen/visited stories with corresponding timestamp/number of comments last seen.
// @homepageURL	https://github.com/raszpl/hackahackernews
// @author		Rasz_pl (citizenr@gmail.com)
// @version		0.6.1
// @namespace	https://github.com/raszpl/hackahackernews
// @license		GNU/GPLv3 http://www.gnu.org/licenses/gpl-3.0.html
// @updateURL	https://github.com/raszpl/hackahackernews
// @downloadURL	https://github.com/raszpl/hackahackernews
// @supportURL	https://github.com/raszpl/hackahackernews/issues
// @match		https://news.ycombinator.com/*
// @grant		GM_addStyle
// @grant		GM_getValue
// @grant		GM_setValue
// ==/UserScript==

let css = '#hnmain:not(.hhn_show_all) .hhn_invisible {display: none;}';
css += '.hhn_btn {color: inherit; background-color: transparent; border: 0; padding: 0; outline:0; font-family: inherit;}';
css += '.hhn_btnpressed {color: white !important;}';
css += '.hhn_notseen {background-color: #dff0d8;}';
css += '.hhn_seenread {background-color: #d0a5bd;}';
css += '.hhn_newcomments {color: #d00000; font-weight: bolder;}';
css += '.hhn_newcomment {background-color: rgba(255, 149, 40, 0.16); border: 2px solid red;}';
css += '.hhn_nextcomment {border: 1px solid red; color: red; width: 100%; text-align: center; display: block;}';
css += '.hhn_mycomment {background-color: rgba(40, 255, 129, 0.16); border: 2px solid green;}';
css += 'table.comment-tree {border-collapse: collapse;}'; // looks better when drawing borders around new/own posts
css += '.subtext a:visited {color: #ab6060 !important;}'; // make visited links more visible
GM_addStyle(css);

const nickname = document.getElementById("me")?.textContent;

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
	switch(document.getElementsByTagName('html')[0].getAttribute('op')) {
		case "news":
			{ // "show all" button disables filtering
				const button = document.createElement("button");
				button.textContent = "show all";
				button.className = "hhn_btn";
				button.checked = GM_getValue("showall", false);
				if (button.checked) {
					document.getElementById("hnmain").classList.toggle('hhn_show_all', button.checked);
					button.classList.add("hhn_btnpressed");
				}
				const pagetop = document.querySelector(".pagetop");
				pagetop.appendChild(document.createTextNode(" | "));
				pagetop.appendChild(button);
				button.addEventListener("click", function() {
					this.checked = !this.checked; // Smack it up, flip it, rub it down
					document.getElementById("hnmain").classList.toggle('hhn_show_all', this.checked);
					button.classList.toggle('hhn_btnpressed', this.checked);
					GM_setValue("showall", this.checked);
				});
			}

			// prepare a list of all articles, query their status in our database
			news(Array.from(document.querySelectorAll('.athing:not(.comtr)'), x => [Number(x.id), x]));
			break;

		case "item":
			{
				const item_element = document.querySelector('.athing:not(.comtr)');
				item([[Number(item_element.id), item_element]]);
			}
			break;

		case "threads":
			const maxpost = parseInt(localStorage.getItem("mine"));
			const itemarray = Array.prototype.map.call(document.getElementsByClassName("athing comtr"), function(x) { return x.id; });
			for (let i = 0; i < itemarray.length; i++) {
				if (itemarray[i]>maxpost) {
					document.getElementById(itemarray[i]).classList.add("hhn_newcomment");
				}
			}
			maxpost = (maxpost > Math.max.apply(Math,itemarray.concat([1]))) ? maxpost : Math.max.apply(Math,itemarray.concat([1]));
			localStorage.setItem("mine", maxpost);
			break;

		case "reply":
			break;
	}
}

function news(itemarray) {
	for (let i = 0; i < itemarray.length; i++) {
		const item_id = itemarray[i][0];
		const item_element = itemarray[i][1];
		const gotItem = localStorage.getItem(itemarray[i]);

		if (!gotItem) {
			localStorage.setItem(item_id, 1);
			item_element.classList.add("hhn_notseen");
		}
		else if (parseInt(gotItem.split(' ')[0])>1) {
			item_element.classList.add("hhn_seenread");
			const comment_num_element = item_element.nextElementSibling.querySelector('span.subline > a[href^="item?id='+item_id+'"]');
			if (!comment_num_element) break;
			const comment_num = parseInt(comment_num_element.textContent);
			if (!comment_num) break;
			if (comment_num > parseInt(gotItem.split(' ')[1])) {
				const span = document.createElement('span');
				span.className = 'hhn_newcomments';
				span.textContent = (comment_num - parseInt(gotItem.split(' ')[1])) + ' new';

				comment_num_element.append(' ', span);
			}
		}
	}
}

function item(keys) {
	history.scrollRestoration = 'manual';
	const itemid = keys[0][0];
	const comments = document.querySelectorAll('.athing.comtr');
	const comments_number = comments.length;
	const stored = localStorage.getItem() ? localStorage.getItem(itemid) : "1 0";
	const maxpost = parseInt(stored.split(' ')[0]);
	let new_maxpost = 0;
	let nextcommenthash = false;

	const template = document.createElement('a');
	template.className = 'hhn_nextcomment';
	template.textContent = 'Next';

	for (let idx = comments.length-1; idx >= 0; idx--) { // we are processing from the bottom up
		const commentid = Number(comments[idx].id);
		const element = comments[idx];

		if (commentid > new_maxpost) new_maxpost = commentid;
		if (commentid > maxpost) {
			if (nextcommenthash) {
				const next = template.cloneNode(true);
				next.href = '#' + nextcommenthash;

				element.appendChild(next);
			}
			element.classList.add('hhn_newcomment');
			nextcommenthash = commentid;
		}
		// moderated/removed posts have no hnuser element so lets make sure this one does before comparison
		if (nickname && element.querySelector('.hnuser')?.textContent == nickname) {
			element.classList.add('hhn_mycomment');
		}
	}
	// create global listener if we have Next anchors
	if (nextcommenthash) {
		document.querySelector('table.comment-tree')?.addEventListener('click', e => {
			if (e.target.className != 'hhn_nextcomment') return;

			const target = document.getElementById(e.target.hash.slice(1));
			target.classList.remove('noshow');

			const scrollingElement = document.scrollingElement || document.documentElement;
			scrollingElement.scrollTop += target.getBoundingClientRect().top - e.clientY + 10;

			e.preventDefault();
		});
	}
	// consider scroll only if its not the first time we open this page
	if (nextcommenthash && (maxpost > 0)) {
		const nextcommenthash_element = document.getElementById(nextcommenthash);
		nextcommenthash_element.classList.remove('noshow'); // make sure nextcommenthash is visible in the first place, otherwise auto scroll wont work
		const scrollingElement = document.scrollingElement || document.documentElement;
		// fine scroll placing first new comment right in the middle of screen
		scrollingElement.scrollTop -= window.innerHeight/2 - nextcommenthash_element.getBoundingClientRect().top - nextcommenthash_element.getBoundingClientRect().height/2;
	}
	// handling manual scrollRestoration in case of #hash in URL
	else if (location.hash) {
		nextcommenthash = location.hash.slice(1);
		location.hash = '';
		location.hash = nextcommenthash;
	}

	// posts with parent element are not the main threads, dont track those
	if (!document.querySelector('.athing:not(.comtr) .par') && document.querySelector('.fatitem .score')) {
		localStorage.setItem(itemid, new_maxpost +" "+ comments_number);
	}
}