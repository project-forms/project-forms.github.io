# Contributing

### Initial setup:

1. Clone the Project Forms repository to your local machine.

2. Verify you have an up to date version of `node` installed by running `node --version`. If `node` is not installed, follow one of the options for download at [Nodejs.org/](https://nodejs.org/en).

3. Run `npm install`.

### Running tests only:

Run tests locally

```
npm test
```

### Setting up Project Forms on your local machine:

1. Navigate inside the cloned Project Forms repository file to copy to the .env file. To view the .env file, run `ls -a` in your terminal to show all files. **Run `cp .env.example .env` to copy the .env file.**

2. Open the .env file in your code editor (for Visual Studio Code, run `code .env`).

### Registering your GitHub app:

3. Go to [Developer Settings](https://github.com/settings/apps) in [GitHub settings](https://github.com/settings/) and select [**New GitHub App**](https://github.com/settings/apps/new). Log in with your credentials.

4. Give your GitHub app an easily identifiable name.

Tips: Prefix the name with your username such as `[username] Project Forms`.
Human readable names with spaces are fine, no underscores or hyphens required.

5. You can set the Homepage URL to the [Project Forms repository URL](https://github.com/project-forms/project-forms.github.io).

6. Set the Callback URL to `http://localhost` for authentication and authorization, so use the same URL as the one set in your `.env` file.

The post-installation URL can be left blank.

Remove the check for an active Webhook.

7. For Permissions:

   - Repository Settings:
     Set Issues to Read and write.
     Metadata will automatically be set as Read-only as a requirement.

   - Organization Permissions:
     Set Projects to Read and write.

   - Account Permissions can be left as they are with No Access for all.

8. Set the GitHub app to be able to be installed on Any Account.

Now you're ready to **Create Your GitHub app**!


### Starting the dev server and using Project Forms

A private key isn't needed yet. First, set credentials:

9. Take the newly generated Client Id to put into your `.env` file.

10. Generate a client secret and also copy it into your `.env` file.

11. Project Forms does not yet work on user repositories, so for now:
    - Create a test organization to run this GitHub app if you don't already have one.

    - Inside of that test org create a test repo (feel free to set Visibility to Public and select to add a README file).

    - Inside of that test repo, create a test project and optionally set the visibility of the project to public.

12. Under GitHub apps, select to install your app on your test organization for all repositories.

13. Run `npm run dev` to start the dev server. Log in with GitHub and authorize your GitHub app.

    By default you will be redirected to http://localhost:8888/project-forms/demo/projects/1/issues/new

    This should be set to something like `localhost:8888/[USERNAME]/[YOUR_REPO_NAME]/projects/1/issues/new`

You should now be able to use Project Forms to create issues!