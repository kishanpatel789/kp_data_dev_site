Title: Neovim Diff Mode
Date: 2026-08-20
Slug: neovim-diff-mode
Tags: neovim, command-line
Summary: One of these things is not like other and I'm too lazy to find out. Use Neovim's diff mode to easily hunt down how files have changed!
Status: draft


"One of these things is not like the other... one of these things doesn't belong." 🎶🎵

The Sesame Street song agonizes me as I stare at two near-identical files.

By myself, I can't see the differences between the files.

But my best bud Neovim is here. 🤗 Neovim has a built-in diff tool to compare files.

Let's see how Neovim shows the subtle differences before Elmo runs me out out of here.

## Basics

First, let's just open two files and see if you can spot the differences: `nvim -O file1.txt file2.txt`

![Basic comparison with no diff](/static/images/post026/basic_split_view.png)

PICK UP HERE

Okay, this is a simple example. I'm sure you can see the differences. But now let's see how Neovim makes the difference spotting easier.

Open Neovim in diffmode by using the `-d` option. For example, to compare two files by name, enter `nvim -d file1.txt file2.txt`.

[ INSERT INITIAL DIFF IMAGE ]

Hmm... this is looking good. You see a split view with file 1 on the left and file 2 on the right. See that color-coding? The green lines are present in one file but in the other. Red lines mean something's missing in that file that's in the other file. Like those traffic lights holding you back from that Dunkin coffee, red and green complement each other.

Lines that are similar but with a few changes are highlighted. For example, the file on the right has highlighted space around the equals sign to show that the left file does not have such spacing.

If you try moving from to line to line, you'll see the cursor is synced between the two files. Scrolling in one line scrolls the other as well.

## Navigating Differences

I hear you whining, "But scrolling takes so long." Listen, this is Neovim. There are shortcuts for everything! Hit `]c` to jump to the next change. Throw a `[c` to go back to the last change.

## Transferring Differences

Cool! But sometimes you want to transfer the diff from one file to the other. This can be done in neovim as well.
Assume you're in file1.txt and you see a sweet change in file2.txt. Grab it and with by running `:do`, which stands for "diff obtain." This will transfer the current diff in the other file to the current file.

[ INSERT IMAGE BEFORE AND AFTER SHOTS ]

Conversely, to push the current file's version to the other file, run `:dp` for "diff put."

Ready to be done with diff mode? Hit `:diffoff!` to deactive diffmode for all windows currently visible. Without the exclamation mark, `:diffoff` only removes the current buffer from diff mode.

We've talked about how to start diff mode when on the outside. But what if you already have a single file open and want to enter diff mode with another file from within vim? That's done by calling `:diffsplit` and then the name of the file. For example, when having file1.txt open, call `:diffsplit file2.txt` to open the 2nd file and enter diff mode.

Two's fun but three's a party. Neovim's diff mode is not limited to comparing only two files. I think it can compare up to eight! Let's settle with three for now: `nvim -d file1.txt file2.txt file3.txt`.

[ INSERT 3 FILE DIFF IMAGE ]

Now transferring content gets a bit tricky. Running `:do` and `:dp` confuse Neovim because it doesn't know which buffer to interact with. That's when the complement `diffget` and `diffput` functions come in handy.

- navigating differences
  - show lines added or removed
  - show lines changed
- transferring changes
- enabling and disabling diff mode
- more than two buffers in diff

## Data Engineering Example

As a data engineer, people keep giving me files, even when it's not my birthday. Usually, the files match the format I expect. But every now and then, something changes. The sender generously adds a new column I wasn't expecting. Or worse, an existing column name changes. And of course, it's a surprise. I'm not told about the change.

So when the production pipeline inevitably breaks, it's time to do some reconnaissnance. That's where Neovim comes in.

Here's an example of a huge file with hundreds of rows. Yeah, I'm not reading through that manually.

[ INSERT DE EXAMPLE WITH MANY COLS ]


## Resources
- [marco peluso](https://www.youtube.com/watch?v=b9K8BgPvAxE)
  - `nvim -d file1 file2`
  - ]c and [c
  - do
    - diffget <buffer>
  - dp
    - diffput <buffer>
  - :diffthis
  - :diffoff
    - :windo diffoff
