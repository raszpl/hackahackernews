// ==UserScript==
// @name         hackahackernews
// @namespace    http://tampermonkey.net/
// @version      0.1
// @author       Rasz_pl (citizenr@gmail.com)
// @description  Comment system enthancement. Highlights new comments/stories, marks stories you visited.
//               Uses localStorage to store IDs of seen/visited stories with corresponding timestamp/number of comments last seen.
// @match        https://news.ycombinator.com/*
// @grant        none
// ==/UserScript==

css = '.notseen {background-color: #dff0d8 !important;}';
css += ' .seenread {background-color: #d0a5bd !important;}';
css += ' .newcomments {color: #d00000 !important;}';
css += ' .newcomment {background-color: rgba(255, 149, 40, 0.16) !important; border: 2px solid red !important;}';
css += 'table.comment-tree { border-collapse: collapse; }';
head = document.head || document.getElementsByTagName('head')[0];
style = document.createElement('style');
style.type = 'text/css';
style.appendChild(document.createTextNode(css));
//    console.log(style);
head.appendChild(style);

switch(document.getElementsByTagName('html')[0].getAttribute('op')) {
  case "news":
    var aaa = Array.prototype.map.call(document.querySelectorAll('.athing:not(.comtr)'), function(x) {  return x.id; });
    for (var i = 0, len = aaa.length; i < len; i++) {
      if (!localStorage.getItem(aaa[i])) {
        document.getElementById(aaa[i]).className +=" notseen";
        localStorage.setItem(aaa[i], 1);
      }
      else if (parseInt(localStorage.getItem(aaa[i]).split(' ')[0])>1) {
        document.getElementById(aaa[i]).className +=" seenread";
        if (parseInt(document.querySelectorAll('.subtext > a[href^="item?id='+aaa[i]+'"]')[0].innerHTML) > parseInt(localStorage.getItem(aaa[i]).split(' ')[1])) {
          var fresh = parseInt(document.querySelectorAll('.subtext > a[href^="item?id='+aaa[i]+'"]')[0].innerHTML) - parseInt(localStorage.getItem(aaa[i]).split(' ')[1]);
          document.querySelectorAll('.subtext > a[href^="item?id='+aaa[i]+'"]')[0].innerHTML += '<a class="newcomments"><b> '+fresh+' new</b></a>';
        }
      }
    }
    break;

  case "item":
    var stored = localStorage.getItem(document.querySelectorAll('.athing:not(.comtr)')[0].id) ? localStorage.getItem(document.querySelectorAll('.athing:not(.comtr)')[0].id) : "1 0";
    var max = parseInt(stored.split(' ')[0]);
    var aaa = Array.prototype.map.call(document.getElementsByClassName("athing comtr"), function(x) {  return x.id; });
    for (var i = 0, len = aaa.length; i < len; i++) {
      if (aaa[i]>max) {
        document.getElementById(aaa[i]).className +=" newcomment";
      }
    }
    max = Math.max.apply(Math,aaa.concat([1]));
    var comment = Array.prototype.map.call(document.getElementsByClassName("athing comtr"), function(x) {  return x.id; }).length;
    localStorage.setItem(document.querySelectorAll('.athing:not(.comtr)')[0].id, max +" "+comment);
    break;

  case "threads":
    var max = parseInt(localStorage.getItem("mine"));
    var aaa = Array.prototype.map.call(document.getElementsByClassName("athing comtr"), function(x) {  return x.id; });
    for (var i = 0, len = aaa.length; i < len; i++) {
      if (aaa[i]>max) {
        document.getElementById(aaa[i]).className +=" newcomment";
      }
    }
    max = (max > Math.max.apply(Math,aaa.concat([1]))) ? max : Math.max.apply(Math,aaa.concat([1]));
    localStorage.setItem("mine", max);
    break;

  case "reply":
    break;
}

