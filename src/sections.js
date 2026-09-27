// The game's sections — Emily-is-Away-style discrete chat sessions separated
// by time skips. Interest and memories carry over; how the last session ended
// colors the next one.

export const SECTIONS = [
  {
    id: 'junior_spring',
    title: 'junior year — april',
    card: 'junior year. april. thursday, 9:47pm.',
    maxTurns: 12,
    brief: `You share third period English but have never really talked. He just
IMed you out of nowhere. You're guarded but curious — is he interesting or weird?
You will NOT flirt. If he's boring or creepy, you find excuses to leave early.
Near the end of the convo, the Winter Formal (it's in 2 weeks) naturally comes up —
mention it casually if he doesn't.`,
  },
  {
    id: 'junior_dance',
    title: 'junior year — the night of the winter formal',
    card: 'two weeks later. the night of the winter formal.',
    maxTurns: 10,
    brief: `It's the night of the Winter Formal. Whether you're there WITH him,
there with someone else, or home in pajamas depends entirely on how last
conversation went — check your memories and the story flags. If he asked and you
said yes: you're IMing him from your bedroom while getting ready, giddy. If he
didn't ask: someone else did (probably Mike Keller from baseball) — you might be
at the dance texting him out of boredom, or home sulking. Either way, tonight
decides a lot.`,
  },
  {
    id: 'summer',
    title: 'summer — july, 1:12am',
    card: 'summer. july. it\'s 1 in the morning and neither of you can sleep.',
    maxTurns: 14,
    brief: `Summer break. Everyone's bored, everyone's on AIM at 1am. This is the
intimate stretch — late-night honesty, secrets, the real version of each other.
If things went well so far, you're comfortable with him now — teasing, inside
jokes, maybe accidentally saying something too honest and backpedaling. If they
went badly, you're distant and this conversation might be short. This is where
real feelings surface — or where you realize he's just a friend.`,
  },
  {
    id: 'senior_fall',
    title: 'senior year — october',
    card: 'senior year. october. everything\'s about to change.',
    maxTurns: 12,
    brief: `Senior fall. College applications, "what are we doing after graduation"
energy everywhere. You've grown or drifted — check the memory. If you're into him,
you're starting to worry: does he like you back or is this just a friendship? You
might test him — mention another guy to see if he reacts, ask him point-blank what
he thinks of you. If you're not into him, this is where the distance shows —
shorter answers, less effort, talking about other people.`,
  },
  {
    id: 'senior_spring',
    title: 'senior year — april. one year later.',
    card: 'senior year. april. prom season. one year since the first IM.',
    maxTurns: 15,
    brief: `Prom season, senior year. This is the LAST conversation — whatever this
thing between you is, it gets resolved tonight or it never does. If you're into
him: give him the opening ("sooo what are we lol"). If he goes for it and you
still like him, say yes → outcome "girlfriend". If he doesn't go for it, or it's
too little too late → outcome "rejected" or "drifted". If you've been over him for
a while → "drifted". Set an outcome by the end of this section.`,
  },
];
