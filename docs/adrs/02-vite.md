# Static Web App with OAuth Service

Date: Oct 18, 2023

## Context

## Decisions

We decided to [Vite](https://vitejs.dev/) for building the React app and to continue to use Netlify for the server-site routes. Netlify [recognizes vite projects out of the box](https://docs.netlify.com/integrations/frameworks/vite/) and starts the local vite server when running `netlify dev`.

## Consequences

The front-end is deployed to GitHub pages which gives us the nice URL we want: https://project-forms.github.io. The disadvantage is that GitHub pages does not support custom routing, so a URL such as /project-forms/demo/projects/1/issues/new can only be rendered by creating [a custom 404 page](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site).

## Alternatives

We also considered using Next.js or Remix. Remix was incompatible with the current version of Primer React (https://github.com/gr2m/remix-playground/pull/1). Next.js was the obvious choice. But in the end we decided for Vite because we wanted to keep deploying the final app to GitHub pages, because nothing beats a URL like https://project-forms.github.io.
