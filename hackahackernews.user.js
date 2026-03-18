// ==UserScript==
// @name		hackahackernews
// @description	Comment system enthancement. Highlights new comments/stories, marks stories you visited, adds "jump to new comment" links. localStorage stores IDs of seen/visited stories with corresponding timestamp/number of comments last seen.
// @homepageURL	https://github.com/raszpl/hackahackernews
// @author		Rasz_pl (citizenr@gmail.com)
// @version		0.7
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

// localStorage format. Key is item ID, value is:
//	"1" - "seen" it, didnt click
//	"3" - "interacted", entered empty comments section
//	"maxpost comments" - "interacted", entered populated comments section, saved state
//		maxpost = timestamp of newest comment seen
//		comments = number of comments seen

let css = '#hnmain:not(.hhn_show_all) .hhn_invisible {display: none;}';
css += '.hhn_btn {color: inherit; background-color: transparent; border: 0; padding: 0; outline:0; font-family: inherit;}';
css += '.hhn_btnpressed {color: white !important;}';
css += '.hhn_notseen {background-color: #dff0d8;}';
css += '.hhn_seenread {background-color: #d0a5bd;}';
css += '.hhn_newcomments {color: #d00000; font-weight: bolder;}';
css += '.hhn_newcomment {background-color: rgba(255, 149, 40, 0.16); border: 2px solid red;}';
css += '.hhn_nextcomment {border: 1px solid red; width: 100%; text-align: center; display: block;}';
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
			{
				const maxpost = parseInt(GM_getValue("mine", 0));
				let new_maxpost = 0;
				const itemarray = Array.from(document.querySelectorAll('.athing.comtr'), x => Number(x.id));
				for (const commentid of itemarray) {
					if (commentid > new_maxpost) new_maxpost = commentid;
					if (commentid > maxpost) {
						document.getElementById(commentid).classList.add("hhn_newcomment");
					}
				}
				if (new_maxpost > maxpost) {
					GM_setValue("mine", new_maxpost);
				}
			}
			break;

		case "reply":
			break;
	}
}

function news(itemarray) {
	for (let i = 0; i < itemarray.length; i++) {
		const item_id = itemarray[i][0];
		const item_element = itemarray[i][1];
		const gotItem = getItem(itemarray[i]);

		switch(gotItem.status) {
			case "new":
				setItem(item_id, 1);
				item_element.classList.add("hhn_notseen");
				break;
			case "seen": // only saw once and never interacted with it, we probably dont want to see it again
				item_element.classList.add("hhn_invisible");
				item_element.nextElementSibling.classList.add("hhn_invisible");
				item_element.nextElementSibling.nextElementSibling.classList.add("hhn_invisible");
				break;
			case "interacted": // seen and opened comments
				item_element.classList.add("hhn_seenread");
				{
					const comment_num_element = item_element.nextElementSibling.querySelector('span.subline > a[href^="item?id='+item_id+'"]');
					if (!comment_num_element) break;
					const comment_num = parseInt(comment_num_element.textContent);
					if (!comment_num) break;
					if (comment_num > gotItem.comments) {
						const span = document.createElement('span');
						span.className = 'hhn_newcomments';
						span.textContent = (comment_num - gotItem.comments) + ' new';

						comment_num_element.append(' ', span);
					}
				}
				break;
		}
	}
}

function item(keys) {
	history.scrollRestoration = 'manual';
	const item_id = keys[0][0];
	const comments = document.querySelectorAll('.athing.comtr');
	const comments_number = comments.length;
	const maxpost = getItem(item_id).maxpost;
	let new_maxpost = 0;
	let nextcommenthash = false;

	if (!comments_number) { // no comments, can end early
		// save only main item threads, skip saving individual comments
		if (document.querySelector('.fatitem .score')) {
			setItem(item_id, 3);
		}
		return;
	}

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
		setItem(item_id, new_maxpost +" "+ comments_number);
	}
}

function setItem(key, value){
	if (localStorage.getItem(key) == value) return;
	try {
		localStorage.setItem(key, value);
	}
	catch (e) {
		if (e.name.toLowerCase().includes("quota")) {
			alert("Error: Local Storage size limit exceeded.");
		}
		else {
			alert("Error: Saving to local storage.");
		}
	}
}

function getItem(key){
	try {
		const gotitem = localStorage.getItem(key);
		const splititem = gotitem?.split(' ');
		if (!gotitem) {
			return {status:"new", maxpost: 0, comments: 0};
		}
		else if (splititem.length >= 2) {
			return {status:"interacted", maxpost: parseInt(splititem[0]), comments: parseInt(splititem[1])};
		}
		else {
			switch(gotitem) {
				case "1":
					return {status:"seen", maxpost: 0, comments: 0};
					break;
				case "2":
					return {status:"clicked", maxpost: 0, comments: 0};
					break;
				case "3":
					return {status:"interacted", maxpost: 0, comments: 0};
					break;
				default:
					alert("getItem: You should never see this message. Something wrong with localStorage key:" + gotitem);
					// dummy empty value
					return {status:"interacted", maxpost: 0, comments: 0};
			}
		}
	}
	catch (e) {
		alert("Error: Accessing local storage.");
		return null;
	}
}