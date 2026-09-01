RoZAG Social Hub production website

This build contains the public website and its Dashboard front end.

1. Upload the public-site files to the same web root as the current website.
2. Upload the contents of the dashboard folder to the existing /dashboard/ public folder.
3. Do not remove or replace the working dashboard backend files (app.py,
   passenger_wsgi.py, requirements.txt, or environment configuration).
4. Clear the browser cache or perform a hard refresh after publishing.

The public website now links directly to /dashboard/ from the navigation,
header action and status panel. The dashboard no longer presents as a test
environment and uses the supplied RoZAG logo.
