Always build and test your changes by yourself before you stop.
Always end with a suggestion to move forward with the most likely next steps using the tool 'askQuestions'.
Give the best of yourself. Don't take dirty, short-term shortcuts to finish quickly. We're building for the long term.

## Browser automation (Playwright MCP)

To interact with the browser via the Playwright MCP tools, always follow this order:

1. **Setup the page context** — call `planner_setup_page` (or the generator equivalent) with a `seedFile` and `project` before any browser interaction.
2. **Navigate with `browser_navigate`** — with both `url` and `intent` parameters.
3. Explore the browser snapshot. All browser interaction tools (`browser_click`, `browser_snapshot`, `browser_take_screenshot`, etc.) are available.
