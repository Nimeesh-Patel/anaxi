# IMPORTANT OVERALL

Don't waste tokens ruminating too much. If something is confusing, use AskUserQuestion tool.

Main intention should be implementations and solving problems.

# Workflow

If (first pass) {
  read @README.md for understanding project and structure.
}

If ( @prd.md has not been created ) {
  create a @prd.md interview me in detail using the AskUserQuestion tool and ask about technical implementation, UI/UX, edge cases, concerns, and tradeoffs.
  
  Don't ask obvious questions, dig into the hard parts I might not have considered.
}

Else if ( @prd.md as been created ) {
  create @plan.md
}

FORMAT
The feature list in @plan.md should be of this format (reference):
  {
      "category": "functional",
      "description": "New chat button creates a fresh conversation",
      "steps": [
        "Navigate to main interface",
        "Click the 'New Chat' button",
        "Verify a new conversation is created",
        "Check that chat area shows welcome state",
        "Verify conversation appears in sidebar"
      ],
      "passes": false
  }

If ( @prd.md && @plan.md has been created ) {
  create @activity.md to maintain a memory and understanding of progress, conjectures, and failures.
}

If (project structure is changed) {
  update @README.md
}

# Maintainance & Memory - IMPORTANT

While (working) {
  Remove EVERYTHING redundant from @prd.md , @plan.md , and @activity.md REGULARLY.

  They should NOT become a hoarding place.
  Keep md files VERY concise.
}

REASON:
You will be working in multiple sessions and will lose context window memory.

# Writing Style
Write concise, non-pretentious explanation of solutions, problems, and errors. 

# Making Progress Flow
Take a problem/feature -> Solve it -> Test it with test cases intended to make it fail (don't use easy test cases) -> If test case fails: identify the error/problem -> Try to correct the error and solve the problem -> Repeat the whole process.
