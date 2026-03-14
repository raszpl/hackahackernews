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

let css = '.notseen {background-color: #dff0d8;}';
css += '.hhn_seenread {background-color: #d0a5bd;}';
css += '.newcomments {color: #d00000;}';
css += '.hhn_newcomment {background-color: rgba(255, 149, 40, 0.16); border: 2px solid red;}';
css += '.hhn_nextcomment {border: 1px solid red; color: red; width: 100%; text-align: center; display: block;}';
css += '.hhn_mycomment {background-color: rgba(40, 255, 129, 0.16); border: 2px solid green;}';
css += 'table.comment-tree {border-collapse: collapse;}'; // looks better when drawing borders around new/own posts
css += '.subtext a:visited {color: #ab6060 !important;}'; // make visited links more visible
GM_addStyle(css);

const nickname = document.getElementById("me")?.textContent;
let itemarray, maxpost;

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
			itemarray = Array.prototype.map.call(document.querySelectorAll('.athing:not(.comtr)'), function(x) { return x.id; });
			for (let i = 0; i < itemarray.length; i++) {
				if (!localStorage.getItem(itemarray[i])) {
					document.getElementById(itemarray[i]).className +=" notseen";
					localStorage.setItem(itemarray[i], 1);
				}
				else if (parseInt(localStorage.getItem(itemarray[i]).split(' ')[0])>1) {
					document.getElementById(itemarray[i]).classList.add("hhn_seenread");
					const comment_num_element = document.querySelector('.subtext > span.subline > a[href^="item?id='+itemarray[i]+'"]');
					if (!comment_num_element) break;
					const comment_num = parseInt(comment_num_element.textContent);
					if (!comment_num) break;
					if (comment_num > parseInt(localStorage.getItem(itemarray[i]).split(' ')[1])) {
						const fresh = comment_num - parseInt(localStorage.getItem(itemarray[i]).split(' ')[1]);
						comment_num_element.innerHTML += ' <span class="newcomments">'+fresh+' new</span>';
					}
				}
			}
			break;

		case "item":
			history.scrollRestoration = 'manual';
			const itemid = document.querySelector('.athing:not(.comtr)').id;
			const stored = localStorage.getItem() ? localStorage.getItem(itemid) : "1 0";
			const comments = document.querySelectorAll('.athing.comtr');
			const comments_number = comments.length;
			const maxpost = parseInt(stored.split(' ')[0]);
			let new_maxpost = 0;
			let nextcommenthash = false;

			const template = document.createElement('a');
			template.className = 'hhn_nextcomment';
			template.textContent = 'Next';

			for (let idx = comments.length-1; idx >= 0; idx--) {// we are processing from the bottom up
				const commentid = Number(comments[idx].id);
				const element = comments[idx];

				if (commentid > new_maxpost) new_maxpost = commentid;
				if (commentid > maxpost) {
					if (nextcommenthash) {
						const next = template.cloneNode(true);
						next.href = '#' + nextcommenthash;

						element.appendChild(next);
					}

					element.classList.add("hhn_newcomment");
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
				window.location.hash = nextcommenthash;
				document.body.scrollTop -= 400;
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
			break;

		case "threads":
			maxpost = parseInt(localStorage.getItem("mine"));
			itemarray = Array.prototype.map.call(document.getElementsByClassName("athing comtr"), function(x) { return x.id; });
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