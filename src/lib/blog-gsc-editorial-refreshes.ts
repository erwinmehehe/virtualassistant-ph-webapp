import type { BlogPost, BlogInternalLink, BlogSection } from "@/lib/blog-types";

/** GSC page updates deliberately preserve the existing canonical, article content, and author. */
type GscEditorialPatch = {
  slug: string;
  metaTitle: string;
  description: string;
  quickAnswerQuestion?: string;
  quickAnswer?: string;
  additionalSections: BlogSection[];
  additionalLinks: BlogInternalLink[];
  additionalSources: { label: string; href: string }[];
  reviewNoteAdd?: string;
};

export const GSC_EDITORIAL_PATCHES: GscEditorialPatch[] = [
  {
    "slug": "average-hourly-rate-virtual-assistants-philippines",
    "metaTitle": "Filipino VA Hourly Rates 2026 | 93-Profile Data",
    "description": "See VAPH's 2026 snapshot of 93 stated Filipino VA hourly rates. Compare the historical $5 median, current $6 platform minimum and total hiring costs.",
    "additionalSections": [],
    "additionalLinks": [],
    "additionalSources": []
  },
  {
    "slug": "do-i-need-to-pay-sss-philhealth-and-pag-ibig-for-my-filipino-va",
    "metaTitle": "SSS, PhilHealth & Pag-IBIG for Filipino VAs",
    "description": "Do clients pay SSS, PhilHealth or Pag-IBIG for a Filipino VA? Review employee versus contractor classification and the official rules to verify first.",
    "quickAnswerQuestion": "Do foreign clients have to pay SSS, PhilHealth or Pag-IBIG for a Filipino VA?",
    "quickAnswer": "There is no universal yes or no for foreign clients hiring Filipino virtual assistants. Obligations depend on the real working relationship, whether applicable law treats the worker as an employee or genuinely self-employed, which entity engages the person, and the rules of each program. Review the arrangement with qualified Philippine advisers and current official guidance instead of relying on a contract label.",
    "additionalSections": [
      {
        "heading": "What to verify before deciding who is responsible for contributions",
        "questionHeading": "What facts should a client document before checking Philippine contribution obligations?",
        "paragraphs": [
          "A useful compliance inquiry begins with the real arrangement rather than an assumption that every remote virtual assistant is a contractor. Document who hires the person, who pays, who can end the relationship, who sets working methods and schedules, and whether a staffing company is involved. If the person is working from the Philippines for an overseas business, identify the responsible entities and jurisdictions before making a conclusion.",
          "The Philippine Social Security System publishes separate official guidance for employees, employers, and self-employed members. Its materials explain that registration and contribution processes differ by category. That information is important, but it does not classify a particular worker solely from their title or a paragraph in a contract. Current PhilHealth and Pag-IBIG coverage questions must also be checked with those programs, not inferred from the SSS category alone.",
          "Ask qualified Philippine counsel or an employment/payroll adviser to assess the actual facts and identify any additional cross-border obligations. Record the approved conclusion, who is responsible for registration or remittance, and when the decision must be revisited if the work changes. Avoid advising the assistant to register under an arbitrary category just to make paperwork simpler."
        ],
        "table": {
          "headers": [
            "Question for the review",
            "Record or evidence to collect"
          ],
          "rows": [
            [
              "Who engaged and pays the assistant?",
              "Agreement, employer or service-provider identities, invoice or payroll records"
            ],
            [
              "Who directs how the work is performed?",
              "Supervision, SOPs, shift rules and approval arrangements"
            ],
            [
              "Who can terminate the relationship?",
              "Actual decision authority and written agreement terms"
            ],
            [
              "What program rules may apply?",
              "Current guidance from SSS, PhilHealth and Pag-IBIG"
            ],
            [
              "Which jurisdictions are involved?",
              "Client entity, place where work is performed and legal advice"
            ],
            [
              "Who will keep compliance records?",
              "Named administrative owner, decision memo and review date"
            ]
          ]
        }
      },
      {
        "heading": "Use official SSS member categories as a reference, not a shortcut",
        "questionHeading": "What does current SSS guidance distinguish for employees and self-employed workers?",
        "paragraphs": [
          "SSS explains that an employer reports covered employees, while individuals entering genuine self-employment register under the self-employed member category. It also lists employer reporting and contribution responsibilities. These rules should be checked against the facts before anyone decides which instructions apply to a particular Filipino VA.",
          "Employers should not assume that paying through Wise, a bank transfer, a freelance marketplace or an agency makes the relationship legally independent. Workers should not assume that having an SSS number by itself settles contributions or status. The correct process may require professional review of how the engagement operates in practice.",
          "Read the official SSS membership guidance, the employer duties page, and the self-employed guidance, then verify updated program rules with the relevant agencies. The VAPH worker classification guide provides additional background but does not replace legal advice."
        ]
      }
    ],
    "additionalLinks": [
      {
        "label": "Filipino VA: Contractor vs Employee",
        "href": "/blog/filipino-va-contractor-vs-employee",
        "description": "Review the control test and the importance of the actual working relationship."
      }
    ],
    "additionalSources": [
      {
        "label": "SSS membership and member categories",
        "href": "https://www.sss.gov.ph/become-an-sss-member"
      },
      {
        "label": "SSS employer duties",
        "href": "https://www.sss.gov.ph/employer-er"
      },
      {
        "label": "SSS self-employed coverage",
        "href": "https://www.sss.gov.ph/self-employed"
      }
    ],
    "reviewNoteAdd": "Qualified Philippine legal or payroll review is necessary before applying these factors to a specific employment or contractor arrangement."
  }
];

export function applyGscEditorialPatch(post: BlogPost): BlogPost {
  const patch = GSC_EDITORIAL_PATCHES.find((entry) => entry.slug === post.slug);
  if (!patch) return post;
  const knownLinks = new Set(post.internalLinks.map((link) => link.href));
  const knownSources = new Set((post.sources || []).map((source) => source.href));
  return {
    ...post,
    metaTitle: patch.metaTitle,
    description: patch.description,
    ...(patch.quickAnswer ? { quickAnswer: patch.quickAnswer } : {}),
    ...(patch.quickAnswerQuestion ? { quickAnswerQuestion: patch.quickAnswerQuestion } : {}),
    sections: [...post.sections, ...patch.additionalSections],
    internalLinks: [...post.internalLinks, ...patch.additionalLinks.filter((link) => !knownLinks.has(link.href))],
    sources: [...(post.sources || []), ...patch.additionalSources.filter((source) => !knownSources.has(source.href))],
    reviewNote: [post.reviewNote, patch.reviewNoteAdd].filter(Boolean).join(" ") || undefined,
    updatedAt: "2026-10-24",
  };
}
