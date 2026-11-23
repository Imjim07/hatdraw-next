<!-- Exported from the Claude Doc "Kadara: Copy Deck & Launch Plan" (rev 16), 2026-11-21. That doc is the source of truth: re-export it rather than editing this file. -->

# Kadara: Copy Deck & Launch Plan

2026-11-18 · yeh

## Voice and tone

Kadara sounds like a warm, organised Lagos friend: clear first, playful second. Every line should still make sense with the jokes taken out.

| Where | Tone | Example |
| --- | --- | --- |
| Secret Santa | Playful, festive, light Pidgin allowed | "Shake am. Nobody go draw themselves." |
| Ajo | Calm and exact, no jokes about money | "Turn 3: Chidi collects ₦160,000 on 1 Dec." |
| Gift Finder | Helpful, honest about who sells | "Sold by Ada's Candles. You'll order from them on WhatsApp." |
| Errors | Calm: what happened, then the fix | "That link looks broken. Ask your organiser to resend it." |
| Landing page | Confident, short, proud of the culture | "Fair draws, for whatever needs one." |

**Pidgin rules**

- Only in Secret Santa and celebration moments, at most one Pidgin phrase per screen.
- Never in instructions, prices, ajo, policies or error fixes. Everyone must be able to read those, including relatives abroad.
- A native Pidgin speaker reads every Pidgin line before launch.

**Writing rules**

- Screen sentences under 15 words, one idea each.
- Name the person, the amount and the date ("Femi", "₦15,000", "24 Dec"), never "your recipient" or "the budget".
- The first time a craft name appears on a page, give its meaning: "ṣẹ̀kẹ̀rẹ̀ (beaded calabash)".
- Keep the Yoruba tone marks.

| Use | Avoid | Why |
| --- | --- | --- |
| draw, pick, shake, unwrap | algorithm, randomise, generate | People, not software |
| organiser | admin, host, user | How groups actually talk |
| private link | token, URL | Plain words |
| fair, recorded | guaranteed, 100% secure | Promise only what's true |
| ajo, contribution | investment, returns, interest | Ajo is saving; investment words invite regulators and scams |
| sold by [vendor] | our products, we deliver | Vendors sell and deliver, not Kadara |

## Site map

The site has 12 pages, and each one does exactly one job. Two of them, Vendors and Privacy & terms, don't exist yet and are needed before launch.

| Page | Its one job | Main action |
| --- | --- | --- |
| `/` Landing | Explain Kadara and get people into a draw | Start a draw |
| `/draw` Secret Santa wizard | Set up and run a gift exchange | Shake the ṣẹ̀kẹ̀rẹ̀ |
| `/r` Reveal | Show one person their match | Beat the starch |
| `/ajo` Ajo setup | Create a group and its payout order | Draw the order |
| `/ajo/[id]` Ajo schedule | Show everyone the fair order and dates | Add to calendar |
| `/ajo/[id]/me` Member page | One member's turn, reminders, swaps | Remind me |
| `/ajo/[id]/admin` Organiser page | Run the draw, share links, announce turns | Copy announcement |
| `/gifts` Gift Finder | Find a gift by budget and person | Open a gift |
| `/gifts/[slug]` Gift page | Show one gift and who sells it | Order on WhatsApp |
| `/gifts/policy` Buying policy | Explain that vendors sell, deliver and refund | None |
| `/vendors` Sell on Kadara (new) | Recruit and vet gift vendors | Apply to list |
| `/privacy`, `/terms` (new) | Required: you now store emails and names | None |

## Landing page

The landing page leads with fair draws in general, then lets the visitor pick Secret Santa or ajo in the hero. Order: hero → what Kadara offers → how it works → Gift Finder → pricing → FAQ → footer.

### 1. Hero

- **Eyebrow:** Kádàrá · destiny
- **Headline:** Fair draws, for whatever needs one.
- **Subline:** Run your Secret Santa, settle your ajo payout order, or pick a giveaway winner. Everyone can see it was fair.
- **Mode toggle:** Secret Santa | Ajo payout order

|  | Secret Santa | Ajo payout order |
| --- | --- | --- |
| Line under toggle | Drop everyone's name in the ṣẹ̀kẹ̀rẹ̀. Each person gets a private link to see who they're gifting. | Draw your group's payout order once, in front of everyone, and share one schedule to WhatsApp. |
| Button | Start a Secret Santa | Draw an ajo order |
| Small print | Free up to 15 people · No sign-up | Free · Kadara never holds your money |

### 2. What Kadara offers

- **Heading:** One fair draw, many uses.
- **Subline:** Built for two Nigerian traditions, and ready for any event that needs a fair pick.

| Card | One line | Points | Link |
| --- | --- | --- | --- |
| Secret Santa | Everyone gets a private link and beats the starch to see who they're gifting. | Private links · Keep couples apart · Pass-the-phone mode | Start a Secret Santa |
| Ajo payout order | Draw the order once, in front of everyone. | Locked or live draw · Reminders before each turn · Swaps both members agree to | Draw an ajo order |
| Gift Finder | Gifts from trusted Nigerian vendors, by budget. | Browse by budget · Order on WhatsApp · Vendors deliver | Find a gift |
| Giveaway picker | For vendors: pick winners fairly, with a link your followers can check. | Coming soon | None (not clickable) |

**Promise row:** Fair and recorded · No sign-up · WhatsApp-first · Free for small groups · Draws never touch your money

### 3. How it works (follows the toggle)

| Step | Secret Santa | Ajo |
| --- | --- | --- |
| 1 | **String the names.** Add everyone, or paste your WhatsApp list. | **Add your members.** Set the amount, how often, and the start date. |
| 2 | **Shake the ṣẹ̀kẹ̀rẹ̀.** Nobody draws themselves. Couples can be kept apart. | **Draw in front of everyone.** Draw now, or live so the whole group watches. |
| 3 | **Beat the starch.** Each person taps their cloth three times to see their match. | **Share the schedule.** One link for the group chat, with reminders before every turn. |

### 4. Gift Finder teaser

- **Heading:** Know who you're gifting? Find them something good.
- **Line:** Gifts from Nigerian vendors, sorted by budget. You order straight from the vendor on WhatsApp.
- **Button:** Browse gifts

### 4a. Who it's for

> **Draft, 2026-11-23, waiting for approval.** Written in the deck's voice for the new section between "What Kadara offers" and "Pricing". Add it to the Claude Doc once approved, then re-export this file.

- **Eyebrow:** Who it's for
- **Heading:** Made for the groups you already run.
- **Subline:** Offices, churches, ajo groups and party planners. One fair draw everyone can see.

| Panel | Line | Link |
| --- | --- | --- |
| Offices and HR | Run the office Secret Santa without a spreadsheet. Everyone gets a private link. | Start an office draw |
| Churches and fellowships | Pair up the choir, the youth fellowship or the whole parish. Nobody draws themselves. | Start a fellowship draw |
| Ajo and thrift groups | Draw the payout order in front of everyone. Kadara never holds your money. | Draw an ajo order |
| Event planners | Add a gift exchange to weddings, birthdays and end-of-year parties in minutes. | Plan a gift exchange |
| Instagram vendors | Pick giveaway winners fairly, with a link your followers can check. | Coming soon |
| Gamers and streamers | Pick giveaway winners live on stream, with a result your chat can check. | Coming soon |

Never in this section: raffle, lottery, betting, jackpot, odds. No logos, testimonials, "trusted by" lines or usage numbers.

### 5. Pricing

The hat is gone, so "Small Hat" and "Big Hat" become circles, matching the ṣẹ̀kẹ̀rẹ̀ and ajo.

| Plan | People | Price | Line |
| --- | --- | --- | --- |
| Small circle | Up to 15 | Free | Friends and family. No payment, no sign-up |
| Mid circle | 16–50 | ₦1,500 per draw | Church fellowships, big families, small offices |
| Big circle | 51–500 | ₦7,500 per draw | Offices, churches and whole departments |
| Year pass | Up to 500 per draw | ₦15,000 once, for 12 months | Unlimited draws all year: Christmas, birthdays, team events. No auto-renewal |
| Ajo | Any size | Free | Kadara never holds money |

Prices are locked for launch. Review on 8 Dec: if fewer than 1 in 4 organisers who reach the payment screen pay for Mid circle, drop it to ₦1,000.

### 6. FAQ

- **Is it really random?** Yes. The draw runs on our server with secure randomness, so nobody can rig it, the organiser included.
- **Can the organiser see who got who?** Not unless they choose to. Links are encrypted, so the organiser can play too.
- **Does Kadara hold our ajo money?** No. Kadara draws the order and sends reminders. Your group pays the way it always has.
- **Do people need to sign up?** No. Everyone just opens their link.
- **Who sells the gifts?** Independent vendors. You order and pay on their WhatsApp, and they deliver.
- **What does Kadara mean?** From kádàrá (Yoruba) and kaddara (Hausa): destiny. Built by Capricorn Hub in Lagos.

### 7. Footer

- **Line:** Kadara · by Capricorn Hub · Made in Lagos
- **Links:** Secret Santa · Ajo · Gifts · Sell on Kadara · Privacy · Terms
- **Credit:** Motifs drawn in tribute to Yoruba adire makers

## Secret Santa flow

The Santa flow is the playful one: four wizard steps, the link hand-off, then the reveal. Copy for each screen, top to bottom:

| Screen | Heading | Helper text | Button |
| --- | --- | --- | --- |
| Step 1 | What's the occasion? | Name it, set a budget, and say where gifts change hands. | Next: add names |
| Step 2 | String the names | One name per line, or paste your WhatsApp list. Each name becomes a bead. | Next: house rules |
| Step 3 | House rules | Keep couples, siblings or flatmates apart. Turn on "Keep it secret from me" to play too. | Shake the ṣẹ̀kẹ̀rẹ̀ |
| Shaking | Shaking… | Making sure nobody draws themselves. | None |
| Results | [N] names drawn | Send each person only their own link. Even you can't see who got who. | WhatsApp · Copy link |
| Pass the phone | Pass the phone | Each person taps their name, unwraps in private, then passes it on. | That's me |

**WhatsApp message (sent per person)**

> 🎄 Hi [Name], you're in "[Event]" Secret Santa. Open your link to see who you're gifting. It's only for you, so don't forward it. [link]
>
**Reveal page**

| Moment | Copy |
| --- | --- |
| Before | **Hi [Name].** Your cloth is still covered in starch. Tap it three times to beat the starch off. |
| Explainer (small) | Adire makers beat dried starch off the cloth to reveal the pattern. |
| Mid-taps | Keep going, 2 more taps. / One more. |
| After | **This Christmas, you're gifting [Match].** Keep it to yourself. |
| Details | Budget ₦[X] · Gift day [date], [N] days to go · Where: [place] |
| Next step | See gifts under ₦[budget] → |
| Loop back | Run your own draw on Kadara |

**Paywall (more than 15 people)**

- **Heading:** [N] people in the circle
- **Line (16–50):** Draws up to 15 people are free. A circle of [N] is ₦1,500, paid once for this draw.
- **Line (51–500):** Draws up to 15 people are free. A circle of [N] is ₦7,500, paid once for this draw.
- **Button:** Pay ₦[price] and draw
- **Second option (small):** Running more than one draw this year? Get the Year pass for ₦15,000.
- **Year pass holder:** Year pass active until [date]. No payment needed.

**Errors**

- Under 3 names: You need at least 3 people for a Secret Santa.
- Rules too strict: Those keep-apart rules make a fair draw impossible. Remove one and try again.
- Broken link: This link looks broken. Ask your organiser to resend it.

## Ajo flow

Ajo copy is calm and exact: real names, amounts and dates on every screen, no jokes and no confetti. Every ajo screen carries the same line: **Kadara draws the order and sends reminders. It never holds or moves your money.**

| Screen | Heading | Helper text | Button |
| --- | --- | --- | --- |
| Setup 1 | Your ajo group | Name, amount per person, how often, start date. | Next: members |
| Setup 1 (live total) | Each turn pays ₦[amount × members] | Updates as you add members. | None |
| Setup 2 | Who's in? | Add every member. They'll each get a private link. | Next: agreed turns |
| Setup 3 | Any turns already agreed? | If your group agreed someone's turn before the draw, pin it here. Everyone will see it was agreed. | Next: review |
| Setup 4 | Check and create | [Summary]. Allow anonymous group size and amount for research (optional). | Create group |
| Hand-off | Your group is ready | Send each member their own link. Keep your organiser link private. | WhatsApp · Copy link |
| Draw choice | How do you want to draw? | **Draw now:** locked straight away; you can redraw within 10 minutes, and everyone sees that you did. **Draw live:** everyone watches together, and it can't be redrawn. | Draw now · Draw live |
| Live countdown | Drawing in 0:30 | Everyone with the link is watching. | None |
| Locked | Order locked | Drawn [date, time] · [never redrawn / redrawn once] | Share schedule |

**Schedule page labels:** Turn · Date · Collects · Amount · "Agreed before the draw" (pins) · "Next up" (highlight) · "Tolu ↔ Ada swapped turns, 5 Jan" (swaps) · Add to calendar.

**Member page:** Your turn: 3 · 1 Dec · ₦160,000. Buttons: Remind me by email · Add to calendar · Ask to swap.

**Swap messages**

- Request sent: Swap request sent to [Name]. Nothing changes until they agree.
- Incoming: [Name] wants to swap turns: their turn [X] ([date]) for your turn [Y] ([date]). Accept · Decline
- Confirmed: Done. You now collect on [date].

**Reminder email**

- **Subject:** [Group] ajo: [Name] collects on [date]
- **Body:** Contributions for [Group] are due by [date]. This turn, [Name] collects ₦[amount]. Kadara doesn't handle money, so pay the way your group agreed. [See schedule] · [Stop reminders]

**WhatsApp announcement (organiser copies per turn)**

> Turn [N]: [Name] collects ₦[amount] on [date]. Contributions due by then. Schedule: [link]
>
## Gift Finder

Orders go straight to each vendor's WhatsApp, so the copy must make one thing unmistakable: **the vendor sells, takes payment and delivers, not Kadara.** If a vendor lets a buyer down, the buyer should already know who to hold responsible.

| Place | Copy |
| --- | --- |
| Page heading | Find a gift they'll actually like |
| Subline | From Nigerian vendors we've checked. You order and pay on the vendor's WhatsApp. |
| Filters | Budget: Under ₦10k · ₦10–25k · ₦25–50k · ₦50k+ · For: Anyone · Her · Him · Kids · Colleague · Couple |
| Gift card | [Name] · ₦[price] · Sold by [Vendor] · Delivers in [areas] |
| Gift page button | Order from [Vendor] on WhatsApp |
| Under the button | You'll confirm the price, delivery fee and date with [Vendor] before you pay. Kadara doesn't take payment for gifts. |
| Vendor badge | Checked by Kadara (only once you've actually vetted them) |
| Empty state | Nothing under ₦[X] yet. Try a higher budget. |
| Out of stock | [Vendor] has sold out of this one. |

**Pre-filled WhatsApp message to the vendor**

> Hi [Vendor], I found your [Gift name] (₦[price]) on Kadara and I'd like to order. Ref: CDR-[code]
>
The **Ref code** matters: it's how you prove which orders Kadara sent each vendor, and later how you charge commission. Without it, you can't measure the store at all.

**Sell on Kadara page (`/vendors`)**

- **Heading:** Sell your gifts where Nigerians plan their gifting
- **Line:** People come to Kadara knowing who they're gifting and how much to spend. List your gifts, and orders come to your WhatsApp.
- **Requirements:** Active business WhatsApp · Real product photos · Clear delivery areas and times · Agree to the buyer policy
- **Button:** Apply to list

**Buying policy page (`/gifts/policy`)**: one heading each, written by you: Who sells (vendors, not Kadara) · Payment (to the vendor only; never pay anyone claiming to be Kadara) · Delivery · Refunds (the vendor's own policy, shown on their gift page) · Report a vendor.

**Code change from the earlier store prompt:** each product needs a vendor (name, WhatsApp number, delivery areas, refund line), the order button opens the vendor's WhatsApp instead of the store number, and the message carries the Ref code. I'll put that into the Claude Code prompt once this copy is settled.

## Microcopy library

The small words, reused everywhere so the site speaks with one voice.

| Moment | Secret Santa | Ajo and everywhere else |
| --- | --- | --- |
| Loading | Shaking the ṣẹ̀kẹ̀rẹ̀… | Dyeing the cloth… (adire loader) |
| Opening a link | Opening your cloth… | Loading your schedule… |
| Copied | Link copied | Link copied |
| Saved | Saved | Saved. We'll remind you 3 days before. |
| Duplicate name | Tolu is already in the circle | Tolu is already in this group |
| Network error | Couldn't reach Kadara. Check your connection and try again. | (same) |
| Empty list | Nobody in the ṣẹ̀kẹ̀rẹ̀ yet | No members yet |
| Success | E don land! Everyone's matched. | Order locked. |
| Confirm | Are you [Name]? Make sure nobody's looking. | Swap your turn with [Name]? |
| Destructive | Redraw? Everyone's links will change. | Redraw? Everyone will see the order was redrawn. |
| Theme toggle label | Light / Dark | Light / Dark |

The one Pidgin line here ("E don land!") follows the Pidgin rule: Santa only, a celebration moment, one per screen.

## Launch plan to Christmas

You have 37 days, and most office and church draws get set up in late November and early December. The plan has one hard rule: **no marketing until the site is live and has survived three real groups.** Every share before that sends people to something that isn't there.

(embedded chart)

The growth engine is already built into the product: every Secret Santa sends a private link to each person, and every reveal page ends with "Run your own draw on Kadara". One office draw of 30 people puts Kadara in front of 30 potential organisers. Your marketing job is to start enough first draws; the reveal page does the rest, or it doesn't, and you'll know by 1 Dec.

### Week by week

| Dates | Goal | What you do |
| --- | --- | --- |
| 18–24 Nov | Live and tested | Deploy. Run 3 real draws (family, friends, one office or church group). Fix what breaks. Screen-record the shake and the starch reveal for content. Set up the WhatsApp Business, Instagram and TikTok handles. |
| 24 Nov | Site live | Deadline. If it slips, everything below slips with it. |
| 25 Nov–1 Dec | Get organisers | Message 30 organisers by hand: office HR and admin staff, church youth leaders, friend-group planners. Offer to set up their draw with them. Post 3 short videos. Sign 5 vendors for the Gift Finder. |
| 2–10 Dec | Peak draws | Offices run their draws now. Ask every organiser who used Kadara to post the reveal in their status. Vendors share their Kadara gift pages. |
| 11–24 Dec | Gift Finder | Reveal pages push "See gifts under ₦[budget]". Post reveal reactions (with permission). Families running last-minute draws. |
| 26 Dec–5 Jan | Recap, then ajo | Post the numbers (draws, people matched). Pitch ajo payout draws to groups starting contributions in January. |

### Channels

| Channel | Why it works for Kadara | Cost |
| --- | --- | --- |
| WhatsApp, one-to-one to organisers | Organisers decide; one yes brings a whole group | Your time |
| WhatsApp status | The reveal is a natural status post | Free |
| TikTok and Instagram Reels | The shake and the starch reveal are made for short video | Free |
| Vendors | They share Kadara because it sends them orders | Free |
| Capricorn Hub clients and network | People who already trust you | Free |
| Paid ads | Only after week 2 shows the reveal page converts | Hold |

### What to measure (weekly)

- **Draws created**, and how many people they include.
- **Reveal-to-organiser rate:** of people who open a reveal, how many click "Run your own draw". This is the number that decides whether the loop works.
- **Paid draws** (over 15 people).
- **Gift orders by Ref code**, per vendor.

### Stress test

- If the reveal-to-organiser rate is near zero by 1 Dec, more posting won't fix it. Fix the reveal page's last screen first.
- 30 hand-sent messages beat 300 posts. Organisers need to be asked, not reached.
- Don't spend on ads to fill a funnel you haven't measured.
- Privacy and terms pages go live with the site: you're collecting names and emails from people who never signed up.
- Set up the email addresses before launch: info@, sales@ and support@kadaradraw.com in one shared inbox, plus reminders@ (sending only) and privacy@ (an alias of info@).
