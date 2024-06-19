# Contributing

### Setting up Project Forms on your local machine:
1. Clone the Project Forms repository to your local machine.

2. Verify you have an up to date version of `node` installed by running `node --version`. If `node` is not installed, follow one of the options for download at [Nodejs.org/](https://nodejs.org/en).

3. Navigate inside the cloned Project Forms repository file to copy to the .env file. To view the .env file, run `ls -a` in your terminal to show all files. **Run `cp .env.example .env` to copy the .env file.**

4. Open the .env file in your code editor (for Visual Studio Code, run `code [file_name]`).

### Registering your GitHub app:

5. Go to [Developer Settings](https://github.com/settings/apps) in [GitHub settings](https://github.com/settings/) and select [**New GitHub App**](https://github.com/settings/apps/new). Log in with your credentials.

6. Give your GitHub app an easily identifialbe name.

Tips: Prefix the name with your username such as `[username] Project Forms`.
Human readable names with spaces are fine, no underscores or hyphens required.

7. You can set the Homepage URl to the [Project Forms repository URL](https://github.com/project-forms/project-forms.github.io).

8. Set the Callback URL to your local server URL for authentication and authorization, so use the same URL as the one set in your `.env` file.

The post-installation URL can be left blank if it is not needed. It is for when a user installs your app and you want to authorize them.

You can remove the check for an active Webhook.

9. For Permissions:

Repository Settings:
Set Issues to Read and write.
Metadata will automatically be set as Read-only as a requirement.

Organization Permissions:
Set Projects to Read and write.

Account Permissions can be left as they are with No Access for all.

The GitHub app can be installed Only on this account.

Now you're ready to **Create Your GitHub app**!


### Starting the dev server and using Project Forms

A private key isn't needed yet. First, set credentials:

10. Take the newly generated Client Id to put into your .env file.

11. Generate a client secret and also copy it into your .env file.

12. In the GitHub Developer Settings sidebar under Install App, press **Install**. You can select to install under All Repositories or only Select Repositories.

13. Run `npm run dev` to start the dev server. Log in with GitHub and authorize your GitHub app.

By default it will redirect you to localhost:XXXX/project-forms/demo/projects/1/issues/new

This should be set to something like `localhost:XXXX/[USERNAME]/[YOUR_REPO_NAME]/projects/1/issues/new`

14. i. GitHub apps do not work on user repositories, so create a test organization to run this GitHub app if you don't already have one.

ii. Inside of that test org create a test repo (feel free to set Visibility to Public and select to add a README file).

iii. Inside of that test repo, create a test project. and optinally set the visibility of the project to public.

15. On GitHub's Developer Settings, go into Advanced in the sidebar to make your app public.

16. Under GitHub apps, select to install your app on your test organization for all repositories.

You should now be able to use Project Forms to create issues!