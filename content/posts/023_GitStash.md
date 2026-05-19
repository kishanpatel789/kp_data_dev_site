Title: Git Stash
Date: 2026-04-16
Slug: git-stash
Tags: git, command-line
Summary: What's that git stash? 
Status: draft

You know how to `git push` and `git pull`.

You've worked with `git merge`. When you're feeling spunky, you may even `git rebase`. 🤓

But there's one git command you've avoided: `git stash`. This esoteric command has eluded you. But no longer.

Let's see how `git stash` can make your workflow as smooth as my newborn's bottom.

## When would I use this?

`git stash` saves your local changes changes and reverts the working directory to the last commit (i.e. `HEAD`). That's useful when you're not quite ready to make a record in the commit history. And that might happen in a few scenarios.

**Scenario 1**: You're in deep work, cranking out some code for a new feature.

*Ping*. The boss says there's a bug in the `main` branch you need to look at. But you're not in a good spot to save (i.e. commit) your work. 🙁

```text
> git status
On branch new-feature
Untracked files:
  (use "git add <file>..." to include in what will be committed)
        awesome_code_here.txt

nothing added to commit but untracked files present (use "git add" to track)
```

That new file `awesome_code_here.txt` isn't ready to commit. No worries. You stash your dev work on the `new-feature` branch:

```text
> git stash -u -m "I'll be back, baby"
Saved working directory and index state On new-feature: I'll be back, baby

> git status
On branch new-feature
nothing to commit, working tree clean
```

You use `git stash` to save your work and reset the working directory. (We'll talk about the `-u` and `-m` flags later.)

Then you jump over to the `main` branch to fix the bug. When you're done with battle, you return to your work:

```text
> git switch main
Switched to branch 'main'

> # fix the bug...

> git switch new-feature
Switched to branch 'new-feature'

> git status
On branch new-feature
nothing to commit, working tree clean
```

Once back on the `new-feature` branch, you use `git pop` to reapply the changes saved in the stash. This restores your working state before your boss called you. Now you can continue working on `awesome_code_here.txt`.

```text
> git stash pop
Already up to date.
On branch new-feature
Untracked files:
  (use "git add <file>..." to include in what will be committed)
       awesome_code_here.txt

nothing added to commit but untracked files present (use "git add" to track)
Dropped refs/stash@{0} (d32db6e265fd2c68d0291dfc222441a151eff6c2)
```

**Scenario 2**: Oops, I'm working on `main`

You start the day eager to start work. You make changes and are about to commit... only to realize you're still on the `main` branch. 😱

```text
> git status
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   file.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

Unfortunately, your team policy prohibits direct commits to `main`. These changes to `file.txt` should have been made in a dev branch.

No matter. You stash the work you have, open a dev branch, and apply the stash there.

```text
> git stash -m "My exciting work"
Saved working directory and index state On main: My exciting work

> git status
On branch main
nothing to commit, working tree clean

> git switch -c dev-branch
Switched to a new branch 'dev-branch'

> git stash pop
On branch dev-branch
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   file.txt

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (c39ef47fb2a7bcd21a316e0c604ced62b92d491d)
```

Now the changes to `file.txt` are on the branch `dev-branch`. You commit the changes in this branch and push the dev branch to remote. 

Then open a pull request for your team to see your sensational code!

**Scenario 3**: Pulling into a stale branch

TODO: flesh this scenario out

You've been working on a dev branch with your teammate. The branch is tracked to follow a remote branch. You make changes to the dev branch... only to realize you haven't gotten your teammate's latest changes. You run `git pull` only to get this message:

[ INSERT uncommit warning? ]

That's okay. You stash your changes, run git pull to get the latest version of the branch. Then you pop the stash to make your own commit.

```text
git stash -m "Wait for me"
git pull
git stash pop
git add .
git commit -m "Here's my change, Tommy"
git push
```


## How does it work?

To create a stash, run `git stash`. Git will take any changes you've made to tracked files and move them to the stash list. It will also revert the working directory to the last commit. Include untracked files by running `git stash -u` (u for untracked). Include a message with the `-m` flag.

Run `git stash list` to see the stash objects:

```text
> git stash list
stash@{0}: On main: Super secret new feature
stash@{1}: On main: Oops, worked on main
stash@{2}: WIP on new-feature: a45c0a7 Initial commit
```

Here, you have 3 stashes. The newest stash has an index of 0 and is identified as `stash@{0}`. The next most recent stash has an index of 1, and so on. When a new stash is created, all existing stashes move down the list, and the new stash takes the place of `stash@{0}`.

You have a few ways to manage your stashes. To re-apply the changes from a stash, hit `git stash pop`. That will apply the latest stash to the working directory AND remove the stash from the list.

Or you can hit `git stash apply`. That will apply the latest stash like `git stash pop` but still keep the change in the stash list.

Without any arguments, `git stash pop` and `git stash apply` will apply the 0th stash. To target another stash, pass the stash index to the command. For example, `git stash apply stash@{2}` applies the stash at index 2.

Not sure what a stash contains? Check it out with `git stash show`:

```text
> git stash show stash@{1}
 file.txt | 2 ++
 1 file changed, 2 insertions(+)
```

You can even see the specific changes with the patch flag (`-p`):

```text
> git stash show stash@{1} -p
diff --git a/file.txt b/file.txt
index ce01362..bc47e45 100644
--- a/file.txt
+++ b/file.txt
@@ -1 +1,3 @@
 hello
+
+making a change here
```

Ready to clean up your stash list? Run `git stash drop stash@{2}` to remove the stash in the 2nd index position from the list.

```text
> git stash drop stash@{2}
Dropped stash@{2} (74994016db843c9f3ff2b7c8d355afe084db1ec2)
```

Or run `git stash clear` to remove all stashes. Obviously, be careful with this command. You don't want to delete stashes too quickly.



---

That's all you need to know about `git stash` for day-to-day work. `git stash` makes it easy to save your current unfinished work without mucking up the commit history. Without stashes, you'd have to make temporary commits, switch branches, and then run git gymnastics with `git reset` to clean up the commit history. 😬

[ add better closer]



