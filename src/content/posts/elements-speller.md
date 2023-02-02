---
title: Elements Speller
description: Try to spell a string using element abbreviations.
tags:
- javascript
date: 2023-02-02 13:26:54
---
My son's been kinda obsessed, recently, with what words can be spelled using element abbreviations. I suggested writing a program that could check whether any given string could be spelled, and then had to immediately try it myself because I wasn't sure, at first, how to do it. The main trick is in handling the possibility that using a one-letter element abbreviation where a two-letter element abbreviation is also possible could make an otherwise possible word look impossible (`frog`, for example).

I was able to come up with a solution using recursion that was pretty fun.

<p class="codepen" data-height="600" data-default-tab="js" data-slug-hash="oNMQaYK" data-user="neagle" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/neagle/pen/oNMQaYK">
  Spell with Elements</a> by Nate Eagle (<a href="https://codepen.io/neagle">@neagle</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>
