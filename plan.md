# Plan: Anaxi MVP

```json
[
  {
    "category": "auth",
    "description": "ORCID OAuth login creates a session and stores user profile",
    "steps": [
      "Navigate to landing page while logged out",
      "Click 'Sign in with ORCID'",
      "Complete ORCID OAuth flow",
      "Verify redirect back with valid session cookie",
      "Verify user row created in DB with ORCID iD and display name",
      "Refresh page — verify session persists",
      "Try accessing protected route without session — verify redirect to login"
    ],
    "passes": false
  },
  {
    "category": "integration",
    "description": "arXiv paper search returns relevant results via arXiv API",
    "steps": [
      "Enter a query in the search bar (e.g. 'attention is all you need')",
      "Verify results list with title, authors, date, abstract excerpt",
      "Search a nonsense string — verify empty state, no crash",
      "Search with special characters — verify graceful handling",
      "Verify pagination works for queries with many results"
    ],
    "passes": false
  },
  {
    "category": "functional",
    "description": "Paper page renders arXiv HTML version as primary display",
    "steps": [
      "Navigate to a paper page for a known arXiv ID with HTML version",
      "Verify paper renders as readable HTML (not PDF embed)",
      "Verify title, authors, abstract, and body text are present",
      "Verify math/LaTeX renders correctly",
      "Try a paper ID that does not exist — verify 404 state"
    ],
    "passes": false
  },
  {
    "category": "functional",
    "description": "PDF.js fallback renders for papers without arXiv HTML version",
    "steps": [
      "Navigate to a paper page for an arXiv ID without HTML version",
      "Verify PDF viewer loads with PDF.js",
      "Verify PDF is scrollable and readable",
      "Verify annotations UI is disabled or shows 'PDF mode' notice"
    ],
    "passes": false
  },
  {
    "category": "functional",
    "description": "User can create an inline annotation by selecting text in HTML paper",
    "steps": [
      "Open a paper in HTML mode while logged in",
      "Select a text span in the paper body",
      "Verify annotation popover appears",
      "Type a comment and submit",
      "Verify annotation is saved and highlighted text is visually marked",
      "Reload page — verify annotation persists",
      "Try selecting text while logged out — verify prompt to log in, no crash"
    ],
    "passes": false
  },
  {
    "category": "functional",
    "description": "Kindle-style highlight count shown on frequently annotated text spans",
    "steps": [
      "Create 2+ annotations on overlapping text spans in a paper",
      "Verify a count indicator (e.g. '3 highlights') appears on that span",
      "Click the indicator — verify all annotations on that span are shown",
      "Verify spans with only 1 annotation still show the count",
      "Verify count updates after a new annotation is added without full page reload"
    ],
    "passes": false
  },
  {
    "category": "functional",
    "description": "Annotations from older paper versions are archived when text changes",
    "steps": [
      "Create an annotation on a specific text span (v1 of a paper)",
      "Simulate paper version update where that text span no longer exists",
      "Verify annotation is archived (not deleted) with 'from earlier version' label",
      "Verify annotations whose text is unchanged still appear correctly",
      "Verify archived annotations are accessible but visually distinct"
    ],
    "passes": false
  },
  {
    "category": "functional",
    "description": "Annotations can be upvoted; top-ranked shown first in sidebar",
    "steps": [
      "Open annotation sidebar on a paper with multiple annotations",
      "Upvote an annotation — verify score increments",
      "Try upvoting own annotation — verify blocked",
      "Toggle upvote — verify it can be undone",
      "Switch annotation sort to 'by rating' — verify reorder by score",
      "Switch back to chronological — verify original order"
    ],
    "passes": false
  },
  {
    "category": "functional",
    "description": "Paper-level discussion thread allows threaded comments",
    "steps": [
      "Navigate to a paper page",
      "Post a top-level comment in the discussion section",
      "Verify comment appears with author and timestamp",
      "Reply to that comment — verify thread nesting",
      "Verify comments are sorted chronologically by default",
      "Post comment while logged out — verify prompt to log in"
    ],
    "passes": false
  },
  {
    "category": "functional",
    "description": "Users can upvote and downvote comments; score is displayed but not used for default sort",
    "steps": [
      "Upvote a comment — verify score increments",
      "Downvote a comment — verify score decrements",
      "Try voting on own comment — verify it is blocked",
      "Toggle vote — verify it can be undone",
      "Switch sort to 'by rating' — verify comments reorder by score",
      "Switch back to chronological — verify original order restored"
    ],
    "passes": false
  },
  {
    "category": "functional",
    "description": "Users can flag a comment for moderation review",
    "steps": [
      "Click 'flag' on a comment",
      "Select reason (ad hominem / coercion / intimidation / other)",
      "Verify flag is recorded in DB",
      "Flag same comment twice — verify duplicate is blocked",
      "Verify flagged comments remain visible (not auto-hidden)"
    ],
    "passes": false
  },
  {
    "category": "functional",
    "description": "User profile page displays ORCID info and activity",
    "steps": [
      "Navigate to own profile",
      "Verify display name and ORCID iD shown",
      "Verify list of annotations and comments the user made",
      "Navigate to another user's profile — verify their activity visible",
      "Verify no edit controls on another user's profile"
    ],
    "passes": false
  }
]
```
