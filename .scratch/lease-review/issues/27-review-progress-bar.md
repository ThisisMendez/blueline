# 27. Show progress while reading an agreement

Status: ready-for-agent

Add an accessible activity bar on the existing “Reading your agreement” screen. Show the completed PDF read and the active server check, then open the report when the response arrives. The server currently sends one response for the whole check. Use an indeterminate bar during that request. Add a percentage only if the server can report actual progress.

Honor reduced-motion preferences. Keep missing documents, retry, and timeout states visible and actionable. Check on desktop and mobile with a delayed response, including a timeout and a successful retry. The activity bar should disappear on failure.
