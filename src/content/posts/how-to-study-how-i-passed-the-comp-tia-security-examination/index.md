---
title: "How to Study: How I Passed the CompTIA Security+ Examination"
description: Passing a certification exam isn't easy, especially with a compressed timeline. (I had a week!)
tags:
- certification
date: 2023-08-13 09:23:53
---
I was recently moved onto a new contract at work and told that I would need to get a level of access to interact with the client's systems that would require three certifications, and one of them had to be [CompTIA Security+](https://www.comptia.org/certifications/security). I raised my eyebrows: that's definitely outside my wheelhouse. I've been a "full-stack" engineer for the last four years at my present company, but the preponderance of my skills and experience are in design and front-end development.

I'd only had one certification before: [AWS Cloud Practitioner](https://aws.amazon.com/certification/certified-cloud-practitioner/), which I'd let expire a couple years ago. It's a foundational, entry-level exam (in other words, it's easier than all the others), and even it was a _reasonably_ difficult exam that gave me a lot of useful context I wouldn't otherwise have had on AWS's ecosystem and its core organizing principles and value proposition.

The first thing I did was study for and re-take the Cloud Practitioner exam. I used [A Cloud Guru](https://www.pluralsight.com/cloud-guru), which I had used last time around and liked. They recently had a sale and I purchased a year's-worth of personal access for a reasonable price.

My supervisor asked: how long would it take me to prepare for the Security+ exam? I researched some training options and, based on the hours of course instruction listed combined with homework and self-study, estimated four weeks. My supervisor thought that was reasonable. After going back to HR, though, he ended up coming back with a different plan: a [Security+ Certification Boot Camp](https://trainingcamp.com/training/comptia-security-plus-certification-bootcamp/) that would run for _four days_. I could attend virtually, but it would be a classroom setting. It was expensive, but, of course, my employer has to pay me for the time I'm studying, so if it can really work on that timeline, it could be worth it for them. But four days? I gulped, said, "Sounds great!" and got ready for an interesting week.

On Friday, I took the test remotely and passed with a 775/950, with a minimum passing score of 750. I thought I'd take the time to reflect on my experience and write down some of lessons that I'm taking away.

## What's valuable about certifications?

Certifications have obvious benefits: some roles require them, so they can be connected to tangible increases in responsibility and compensation. And they can make you a more attractive hire. Part of the benefit comes from the fact that, in my experience, they're not easy. Having them demonstrates real knowledge.

But I'm going to focus on another angle: they provide a unique and powerful form of education, _especially_ for people without technical degrees, and for people with certain personalities.

I'm a liberal arts graduate: I went to [a weird school in Annapolis, MD](https://www.sjc.edu/) where we studied great books for four years. I wouldn't trade that experience for anything, and it hasn't stopped me from having a great career in tech. But it does mean my expertise is sometimes more _narrow_ than _broad_. I started making webpages on my own and never stopped: I know a ton about CSS, JavaScript, and all sorts of the details in making sites. But there are a lot of things I never got around to learning on my own. What _is_ the difference between TCP and UDP? I get how private/public keys work in terms of my workflow, but do I really understand the chain of authority involved in the public key infrastructure (PKI) that makes encryption work?

I won't run through my areas of ignorance exhaustively: my ego can't take it. But my point is that there's a lot that I think people with technical degrees got run through at least once in school that I've never really _needed_ to know. And certifications, especially foundational certifications like the ones I've gotten so far, are a powerful way to get to know an entire landscape.

I also think some people are, by nature or habit, just a little better about figuring out the big picture on their own. Me? I'm more of a details guy, which works both for and against me. I do great when I get to sink my teeth into particular problems and work them with creativity, enthusiasm, and focus. But I'm sometimes a little too impatient: I'd rather start building that new feature than spend a day getting the lay of the land. If you're at all like me, getting broad certification in some core technologies might help you understand the environment you work in better.

## What is the CompTIA Security+ ce cert?

The Security+ certification is a broad, foundational certification in IT Security. It's "a mile wide and an inch deep," which means it covers a lot of territory but doesn't require deep expertise in any particular aspect of it. I tried to get a sense of its difficulty by poking around online, and the most accurate statement I read anywhere is that it just varies according to the individual. For an experienced Ops person, it might be pretty easy. I got the sense that for people like me, who don't normally work most of the subjects covered, it's considered reasonably difficult. Apparently about 50% of first-time takers fail.

I'm going to try to avoid dwelling too much on the specific aspects of Security+, though, and focus on the general take-aways I had about approaching studying for certifications and tests in general.

## Training Camp's Boot Camp

The format for my Boot Camp was three-and-a-half days of full-on instruction with a teacher in a real room somewhere with some in-person students and the rest of us attending via Zoom. It was supposed to be about eight hours of instruction, I think, but the reality was that we never ended before 6:30 or so. After that, we had at least 1 - 2 hours of homework assigned. The trainer's advice? "Forget YouTube, forget all your normal stuff. Just eat, sleep, and breathe Security+ this week, pass the test, and pick back up where you left off."

I'm a little suspicious about such a compressed format: I don't know if that's the best formula for long-term retention. However, I found that the quality of instruction and the techniques used were much higher quality than any previous instructor-led technical training I'd received.

### Pre-Testing and Review

The most important strategy from my perspective was the instructor's use of [pre-testing](https://www.techlearning.com/news/the-power-of-pretesting-why-and-how-to-implement-low-stakes-tests#:~:text=Implementing%20Pretesting%20in%20the%20Classroom,-Pan%20encourages%20educators&text=He%20adds%2C%20%E2%80%9CIt's%20a%20way,easy%20to%20implement%2C%20Pan%20says.) and **review**.

Each night we were assigned homework, which consisted of memorizing some information and completing questions from a practice test. The practice test was long, much longer than the actual exam, and the number of questions assigned ranged from 50 or so to well over 100. And every night, they asked us to do questions from sections we hadn't covered yet. Why would they do that?

It's a technique called pre-testing, and it engages students' brains in a powerful way by showing them that they _don't_ already know everything (something our brain likes to believe) and directing their attention to exactly _what_ they don't know. Rather than a general "how much do I think I know about encryption?" you get a whole lot of specific information about what things you _do_ already know (I know about RSA vs elliptical encryption and why the latter is better, I know why special characters aren't useful for password security) and what things I _don't_ already know. And you'd better believe that when I heard the answers to the questions that stumped me being discussed in the next day's lesson, my brain was _ready_ for them, and primed to pay attention and prioritize remembering those answers.

You can employ this technique on your own: look for quizzes or tests on a subject you want to learn _before_ you spend time studying it. Can't find anything? Ask [ChatGPT](https://chat.openai.com/) to write one for you.

We also spent at least an hour, sometimes more, at the beginning of the day reviewing, in depth, every question we requested going over. And this was high-quality review: not telling us the correct answer (which was in the practice test, anyway), but going through the reasoning and details related to every possible answer. Because the questions selected came from us, the students, it took two important things into consideration: a) what we, ourselves, needed most help with, and b) what wasn't covered as thoroughly or even effectively during the initial classroom discussion. No matter how good the instructor is, there will be parts they cover more or less effectively, and structuring review time this way allowed us to naturally direct time to the things we needed the most.

It can be hard, as a teacher (and I was one, for a year after college!), not to focus on your _lesson plan_, and that all-important list of what _you want to impart_. But you have to find ways to change that focus, because learning is not mostly about you, as a teacher: it's about your students and what you can work with them to receive. Spending time on review questions is _not_ time lost, with no items on the curriculum getting checked off: it was some of the most valuable instruction time we had.

## Diagrams and sketches

During their explanations, the instructor often used a digital stylus to draw and type directly onto the slides. This, accompanying the verbal explanations, helped me remember more of the subjects he covered. I can still remember the color and position of some of the explanations. It's very clear that it pulled in more of my attention than verbal explanations on their own would have. Humans are sensing creatures, and the more of those senses you can pull in to the act of communication, the more strands there are to help things stick.

This insight may be as old as blackboards, but it's worth preserving the insight into the digital age of virtual teaching: maybe a Wacom tablet is a worthwhile investment if you're spending much time at all training people virtually.

## The importance of writing

Similarly, the instructor recommended physically writing one's notes. He said (and I've read this a number of places before) that evidence seems to show that writing notes by hand produces greater retention than typing. He said that making flash cards can also be worthwhile, though the reality is that _making_ them is probably more beneficial than _using_ them. So make them twice!

I'm going to confess that I didn't take this advice: I love to type, and I type quickly, and I couldn't convince myself to abandon it as a crutch. What I did do was use my [daily note in Obsidian](https://help.obsidian.md/Plugins/Daily+notes) to take notes throughout, and tried as much as possible to put things in my own words rather than re-type what the instructor said. That forced me to reprocess the idea rather than simply repeating a sequence of words.

## The instructor's delivery style

This is something I didn't have much control over, but I just want to call it out for anyone that's ever in the position of being a trainer. It's not easy to listen to someone for days in a row and keep your mind engaged. But your trainer's skills with projection, intonation, and use of examples can go a long way in helping you.

This instructor spoke loudly--sometimes comically so, to be honest--and really varied their intonation. They spoke with a lot of expression and intensity. And they also very frequently threw in vivid examples from their own career to illustrate different concepts. These examples were funny and sometimes shocking, but they were _enormously_ helpful for remembering concepts. I'll never forget the concept of [chain of custody](https://www.cisa.gov/sites/default/files/publications/cisa-insights_chain-of-custody-and-ci-systems_508.pdf) in cyber security forensics, due to the story he told about how much work was thrown out the window one time when a case a friend of his had worked nine months on was irrevocably broken by one person who left some hard drives where they were temporarily unsupervised.

## What I did while the instructor talked

I found that what I did while the instructor talked was one of the most crucial pieces of virtual learning. Sitting at my desk and paying attention and typing notes was okay, but there were a few problems with it: I got tired, and the temptation to check email / Twitter was always there. I'd ignore it five times, then cave on the sixth. I speculate that resisting that temptation takes a little bit of willpower every time, and that we have a finite supply of willpower. Getting comfortable somewhere I couldn't touch my phone or anything else was worse: within half an hour I was ready to fall asleep.

By far the best approach for me turned out to be using Zoom on my phone, putting on my over-ear Bose headphones, and walking around the house doing minor chores. Empty the dishwasher, clean spots on the wall that I'd never noticed, move things back to the rooms they should be in; anything that didn't really take much thought or attention. Being physically active let me focus on what was being discussed.

But what about notes, you ask! My experience was that notes were less valuable than paying full, steady attention. This class, like most classes, provided plenty of study materials. Why do I need to recreate my own? It was more valuable, in my opinion, to be fully present for the presentation and discussion of those topics by the instructor.

I think this is a core insight for a lot of life: get rid of the note-taking, the photo-taking, the record-making. Try to experience things as fully as possible. Even if you don't remember everything that way, you give it the best chance to _change_ you, and to change how you interact with those ideas later. It will make the time spent studying later more effective. It will make the time you spend enjoying the memories of that ride through Pirates of the Caribbean more pleasant.

## Study with ChatGPT

ChatGPT is changing the world shockingly quickly. Right now, we're limited more by what it occurs to us to ask of it than by its own powers. One of the many, many things it does well is act as a study partner.

The first night, I asked it:

> Good evening! I'm doing some homework for this evening, and we're supposed to memorize some of the most important port numbers and what protocols they're matched to. This is the list we've been given. Could you help me memorize these? I'll give you the list, and then I'd like you to randomly ask me about the msg format and protocol for different ports from the list. When you tell me whether I was right or wrong, I'd love it if you wanted to drop in any small bits of trivia or context that you think would help them stick in my head. Ready? Here's the list:
>
> 22 TCP -> SSH -> also used by SCP/SFTP
> 23 TCP -> Telnet -> plaintext cli
> 53 UDP -> DNS
> 69 UDP -> TFTP (trivial) file transfer protocol, small files only, no directory browsing
> 80 TCP -> HTTP
> 443 TCP -> HTTPS
> 445 TCP -> SMB, Server Message Block, windows file sharing over tcp

And it [worked great](https://chat.openai.com/share/8997d55f-0a1c-4b0f-8b50-6b26bcc0b3cd).

## What's next?

I have to get one more certification soon for work, and I'm not sure what it will be, yet. After that, I think the next step for me, personally, would be to get the [AWS Certified Developer - Associate](https://aws.amazon.com/certification/certified-developer-associate/) certification, using [A Cloud Guru's course](https://www.pluralsight.com/cloud-guru/courses/aws-certified-developer-associate-dva-c02). Wish me luck!
