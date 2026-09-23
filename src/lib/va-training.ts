import type { CompletionKey } from "./profile-completeness";

/**
 * Free training for Virtual Assistants.
 *
 * Every lesson ends at a field the recruiter actually reads, so finishing the
 * course and finishing the profile are the same act: progress is derived from
 * the profile itself rather than stored, and nothing here is ever paid for or
 * affects whether someone is shortlisted.
 *
 * Ordered by how much each field weighs in the profile score, so the lessons
 * that move a VA toward the public directory come first.
 */

export type TrainingLesson = {
  /** The profile field this lesson gets finished. */
  key: CompletionKey;
  title: string;
  minutes: number;
  /** Why a recruiter cares, in the VA's own interest. */
  why: string;
  /** Concrete moves, written as instructions. */
  steps: string[];
  /** A weak and a strong version of the same thing. */
  example?: { weak: string; strong: string };
};

export const TRAINING_LESSONS: TrainingLesson[] = [
  {
    key: "bio",
    title: "Write a summary a client can picture",
    minutes: 6,
    why: "This is the longest thing a client reads about you, and it is where most profiles sound identical. Specifics are what separate you.",
    steps: [
      "Open with the work you do and who you do it for, not adjectives about yourself.",
      "Name the tools you actually use day to day, spelled the way clients search for them.",
      "Give one result with a number in it: hours saved, tickets handled, invoices processed each month.",
      "Say what a week working with you looks like, so a client can imagine handing work over.",
      "Keep it to 80 to 150 words. Longer is not stronger."
    ],
    example: {
      weak: "I am a hardworking and detail-oriented virtual assistant. I am a fast learner and can work under pressure with minimal supervision.",
      strong: "I run inboxes and calendars for two US property managers. I clear 60 to 80 emails a day in Gmail, keep AppFolio notes current, and schedule maintenance visits so nothing sits unanswered overnight. Most weeks I also prepare the Monday owner report."
    }
  },
  {
    key: "skills",
    title: "Pick skills clients search for",
    minutes: 4,
    why: "Recruiters filter by skill. A skill you leave out is a shortlist you never appear in, no matter how good you are at it.",
    steps: [
      "List five things you have genuinely been paid to do, not things you are willing to learn.",
      "Use the plain industry term: 'calendar management', not 'schedule wizard'.",
      "Split broad skills into the parts clients hire for, such as 'invoice processing' rather than only 'bookkeeping'.",
      "Leave off anything you would not want to be tested on in an interview."
    ]
  },
  {
    key: "headline",
    title: "Write a headline that earns the next click",
    minutes: 3,
    why: "Your headline is shown next to your name everywhere in the system. It decides whether a busy client opens your profile at all.",
    steps: [
      "Lead with the role, then the specialty: 'Executive Assistant | Inbox & Calendar for Founders'.",
      "Name an industry or a tool if you have real depth in one.",
      "Cut words that describe everyone: hardworking, passionate, dedicated, reliable.",
      "Aim for 40 to 70 characters so it is not cut off on small screens."
    ],
    example: {
      weak: "Hardworking Virtual Assistant | Open for work",
      strong: "Ecommerce VA | Shopify Orders, Returns & Customer Support"
    }
  },
  {
    key: "photo",
    title: "Take a profile photo that looks hireable",
    minutes: 5,
    why: "A profile with no photo is held back from the public directory entirely, and clients skip past the ones that have none.",
    steps: [
      "Face a window in daytime. Natural light on your face beats any filter.",
      "Frame from the chest up, eyes about a third from the top, plain wall behind you.",
      "Wear what you would wear to a client video call.",
      "No sunglasses, no group photos cropped down, no heavy filters.",
      "A recent phone camera is fine. Steady and well lit matters more than the device."
    ]
  },
  {
    key: "experience",
    title: "Count your experience honestly",
    minutes: 2,
    why: "The public directory needs at least two years, and clients ask about this on the first call. An inflated number falls apart in minutes.",
    steps: [
      "Count paid work in the kind of role you are applying for, including local office work.",
      "Include freelance and part-time months; they add up.",
      "Do not round up. If a client hears three years and your stories cover one, you lose the role and the trust."
    ]
  },
  {
    key: "availability",
    title: "Set hours you can genuinely keep",
    minutes: 2,
    why: "Clients match on overlap with their working day. Promising hours you cannot hold is the fastest way to lose a placement in week two.",
    steps: [
      "Give the hours you can commit every week, not your best possible week.",
      "Account for the client's timezone: say what part of their day you can actually cover.",
      "If you already have a client, subtract those hours before you answer."
    ]
  },
  {
    key: "rate",
    title: "Set a rate you can defend",
    minutes: 4,
    why: "A rate far below the others reads as inexperience rather than value, and it caps what you earn for years. A rate you cannot justify loses the call.",
    steps: [
      "Look at what VAs with your skills and years are asking, and sit inside that band.",
      "Be ready with one sentence on what the client gets for it.",
      "Think in monthly terms too: your hourly rate times your weekly hours times four.",
      "Raising a rate later with the same client is harder than setting it correctly now."
    ]
  },
  {
    key: "category",
    title: "Choose the right specialty",
    minutes: 2,
    why: "Your category decides which client requests you appear in. The wrong one makes you invisible to the work you want.",
    steps: [
      "Pick where most of your paid experience sits, not the field you hope to move into.",
      "If two fit, choose the one you could be interviewed on tomorrow.",
      "Put the second one in your skills instead."
    ]
  },
  {
    key: "tools",
    title: "List the tools you can be dropped into",
    minutes: 3,
    why: "Clients search by their own stack. Matching on a tool is often what gets you shortlisted ahead of someone more experienced.",
    steps: [
      "Name at least three you can use without training on day one.",
      "Spell them the way the company does: QuickBooks, HubSpot, Canva, Xero, Shopify.",
      "Include the unglamorous ones: Google Workspace, Excel, Slack, Zoom.",
      "Leave out anything you have only watched a tutorial about."
    ]
  },
  {
    key: "resume",
    title: "Upload a resume that matches your profile",
    minutes: 5,
    why: "Your recruiter reads it before recommending you. Gaps between your resume and your profile raise questions you will not be in the room to answer.",
    steps: [
      "Use the same dates, job titles and tools as your profile here.",
      "Put the most relevant role first, even if it is not the most recent.",
      "Keep it to two pages, in PDF.",
      "Name the file with your name, not 'resume-final-v3'."
    ]
  },
  {
    key: "portfolio",
    title: "Show one piece of real work",
    minutes: 6,
    why: "One concrete sample settles more doubt than a page of claims. Most profiles have none, so this is cheap separation.",
    steps: [
      "Pick something small and finished: a report, a tracker, a caption set, a process document.",
      "Remove client names, logos and any figures you were not free to share.",
      "Add one line saying what the task was and what changed because of your work.",
      "A Google Drive link set to view-only is enough. It does not need a website."
    ]
  }
];

export const TOTAL_TRAINING_MINUTES = TRAINING_LESSONS.reduce((sum, lesson) => sum + lesson.minutes, 0);
