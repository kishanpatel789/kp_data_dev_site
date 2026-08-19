Title: Neovim Diff Mode
Date: 2026-08-20
Slug: neovim-diff-mode
Tags: neovim, command-line
Summary: One of these things is not like other and I'm too lazy to find out. Use Neovim's diff mode to easily hunt down how files have changed!
Status: draft


"One of these things is not like the other... one of these things doesn't belong." 🎶🎵

The Sesame Street song agonizes me as I stare at two near-identical files.

By myself, I can't see the differences.

But I'm not alone. My best bud Neovim is here. 🤗 And he has a diff tool in his pocket.

Let's see how "diff mode" reveals file differences before Elmo runs me out out of here.

## Basics

First, let's do it the hard way -- open two files in Neovim side-by-side: `nvim -O file1.txt file2.txt` Can you see spot the differences?

![Basic comparison with no diff](/static/images/post026/basic_split_view.png)

Okay, this is a simple example. I'm sure you can see how the two config files differ. 

But now check out how Neovim spots differences for you. Open Neovim in diff mode with the `-d` option. For example, to compare two files by name, enter `nvim -d file1.txt file2.txt`.

![Diff mode with 2 files](/static/images/post026/diff_mode_view.png)

This is looking good. There's still a split view: file 1 on the left and file 2 on the right.

But now there's color-coding! Green bars show lines that are present in one file but not the other. For example, file 2 has new lines for `retry_attempts` and `log_rotation`. 

Red bars in file 1 are fillers, showing there are lines in file 2 that file 1 is missing. The dashes within the red lines (`---`) don't actually exist in file 1. They're just a visual aid.

Like traffic lights keeping you from that Dunkin coffee, red and green complement each other. If one file has green bars indicating new lines, Neovim will place red bars in the other file. This aligns any lines that are in both files, making it easier to compare portions of files.

Neovim also marks lines that are similar but with slight differences. Check out `db_host` at line 14 on the left and line 16 on the right. The two values in quotes (`localhost` and `db.internal.hogwarts.edu`) are highlighted. It looks like someone pushed the database config to production in file 2 while also adding `snape` to the `admins` list.

## Navigating Differences

As you move from to line to line, you'll see the cursor is synced between the two files. Scrolling within one file causes the other file to scroll as well.

I hear you whining, "But scrolling takes so long." Listen, this is Neovim. There are shortcuts for everything! There's no need to manually move from line to line in diff mode. Usually you just want to jump from one difference to the next. Hit `]c` to jump to the next change. Throw a `[c` to go back to the last change.

## Transferring Differences

Cool! After studying the differences, you may want to transfer a section from one file to the other. This can be done in Neovim too.

Assume you're in file1.txt, and you see a sweet change in file2.txt. Make sure two things are true: The cursor is over the changed region, and Neovim is in normal mode (i.e. you're not editing text in insert mode). Then press `do`, which stands for "diff obtain." The `do` command overwrites the current file's diff section with content from the other file.

Conversely, to push the current file's version to the other file, run `dp` for "diff put."

Here's how things look after you "obtain" the `log_rotation` from file 2 and "put" the `db_host` into file 2: 

![After diffobtain and diffput while in file1.txt](/static/images/post026/diffobtain_diffput.png)

## Another Way to Start Diff Mode

You've seen how to start diff mode from outside Neovim. But what if you already have a single file open and want to enter diff mode with another file? That's done by calling `:diffsplit` and then the name of the file. For example, when having file1.txt open, call `:diffsplit file2.txt` to open the 2nd file and enter diff mode. Well... this will actually open the two files in horizontal orientation, with one window above the other. To enter diff mode with a vertical split (like what we've seen above), call `:vert diffsplit file2.txt`.

It's worth noting that each window in Neovim can be a part of "diff mode" or not. To add an active window to the "windows being diffed," enter the command `:diffthis`. To remove an active window from diff mode, enter `:diffoff`.

Ready to be done with diff mode entirely? Hit `:diffoff!` to deactive diff mode for all windows. Without the exclamation mark, `:diffoff` only removes the current window from diff mode.

## More Files to Diff

PICK UP HERE

Two's fun but three's a party. Neovim's diff mode is not limited to comparing only two files. It can compare up to eight! Let's settle with three for now: `nvim -d file1.txt file2.txt file3.txt`.

[ INSERT 3 FILE DIFF IMAGE ]

Now transferring content gets a bit tricky. Running `:do` and `:dp` confuse Neovim because it doesn't know which buffer to interact with. That's when the complement `diffget` and `diffput` functions come in handy.

## Data Engineering Example

As a data engineer, people keep giving me files, even when it's not my birthday. Usually, the files match the format I expect. But every now and then, something changes. The sender generously adds a new column I wasn't expecting. Or worse, an existing column name changes. And of course, it's a surprise. I'm not told about the change.

So when the production pipeline inevitably breaks, it's time to do some reconnaissnance. That's where Neovim comes in.

Here's an example of a huge file with hundreds of rows. Yeah, I'm not reading through that manually.

[ INSERT DE EXAMPLE WITH MANY COLS ]

---

[ insert cheatsheet ]
