Title: sed Command
Date: 2026-09-15
Slug: sed-command
Tags: command-line, linux
Summary: Edit lines of text on-the-fly with sed!
Status: draft


Check out this file. It has comments to help a human like me.

```bash
> cat spells_messy.txt
     Lumos # nightlight

# for dem bad guys
Expelliarmus
Expecto Patronum


Accio
Alohomora  # unlock doors
```

But the computer? It doesn't need them. 🤖

In fact, the comments get in the way of my script.

How do I get the best of both worlds? Comments for a dummy like me and no comments for my sweet script?

The `sed` command is the glue between my humanity and the computer's superiority.

## Basics

`sed` is a **s**tream **ed**itor. It applies some instructions to every line it receives.

We'll explore `sed`'s magic with a simpler `spells.txt` file, which has 5 well-formatted lines:

```txt
> cat spells.txt
Lumos
Expelliarmus
Expecto Patronum
Accio
Alohomora
```

To run `sed`, do three things:

1. Type the `sed` command.
2. Enter some instructions in quotes. (i.e. What you want to do to each line)
3. Give the file to be processed.

The most common command is replacing some text with something else. To replace `Lumos` with `LUMOS MAXIMA`, use this:

```bash
> sed 's/Lumos/LUMOS MAXIMA/' spells.txt
LUMOS MAXIMA
Expelliarmus
Expecto Patronum
Accio
Alohomora
```

Let's break that down.

```txt
sed 's/Lumos/LUMOS MAXIMA/' spells.txt
     ^   ^        ^
     |   |      with this phrase
     |   this phrase
     substitute
```

The `s` command stands for "substitute" and expects two parts: the substring to remove and the substring to insert in its place. These parts are separated with the `/` delimiter.

But almost any delimiter can be used. Instead of the forward slash `/`, the pipe delimiter `|` works.

Also, `sed` is not limited to reading lines from a file. It can also read files from `stdin`. 

Above, `sed` reads lines from the file `spells.txt`, and the substitute command uses the `/` delimiter. Just for kicks, here's `sed` capturing lines from `stdin` with the `|` delimiter. The result is the same:

```bash
> cat spells.txt | sed 's|Lumos|LUMOS MAXIMA|'
LUMOS MAXIMA
Expelliarmus
Expecto Patronum
Accio
Alohomora
```

## What actually happened?

`sed` handles one line at a time. Each line goes through these steps:

1. **Read**: `sed` reads the line into a buffer called "pattern space."
2. **Execute**: `sed` runs the command you give for the line currently in pattern space.
3. **Output**: If applicable, the processed line is sent to `stdout`, and the pattern space is cleared. Then the cycle repeats for the next line.

For the `spells.txt` file, the first line "Lumos" was read into pattern space. `sed` replaced "Lumos" with "LUMOS MAXIMA" and then sent that to `stdout` (the terminal in this case).

Then the second line "Expelliarmus" was read into the buffer. But since "Lumos" is not found within this line, no substitution was performed. The unchanged line was sent to `stdout`. The same thing happened for the remaining lines in the files.

Understanding these basic 3 steps unlocks advanced `sed` wizardry. 🪄

## More Commands

### Line Numbers

`sed` remembers how many lines it's already seen. To emit the line number with each line use the `=` command:

```bash
> sed '=' spells.txt
1
Lumos
2
Expelliarmus
3
Expecto Patronum
4
Accio
5
Alohomora
```

### Deleting Lines

Sometimes you want to target a specific line number. To delete the 3rd line, use `3d`. The `3` targets the 3rd line, and `d` stands for "delete":

```bash
> sed '3d' spells.txt
Lumos
Expelliarmus
Accio
Alohomora
```

The 3rd line is gone but lines 1, 2, 4, and 5 get to stay.

Target a range of lines by separating two addresses with a comma. Here's how you delete lines 1 to 3:

```bash
> sed '1,3 d' spells.txt
Accio
Alohomora
```

Technically, the space between the address and the command is not needed, but it improves readability. So a command loosely has this structure: `<address> <command-to-run-on-address>`.

But here's the thing: sometimes you don't know the address. You don't know which line numbers you want to process. More often, you want to apply commands to lines that match some criteria. Fear not! `sed` can figure out the address by using a search pattern.

Here's how to delete any line matching the pattern "Expecto":

```bash
> sed '/Expecto/ d' spells.txt
Lumos
Expelliarmus
Accio
Alohomora
```

Instead of giving a line number, like 3, as an address, you give a search pattern wrapped in `/`. When `sed` sees `/Expecto/ d`, it only executes the delete command (`d`) if the line matches the pattern "Expecto".

### Just Quit!

There's no need to process a ton of lines once your objective is met. `sed` features the `q` command to quit after a certain line has been reached. 

Want to quit after the line 4? No problem: 

```bash
> sed '4 q' spells.txt
Lumos
Expelliarmus
Expecto Patronum
Accio
```

Or are you interested in stopping after finding the pattern "Expelliarmus"? Here you go:

```bash
> sed '/Expelliarmus/ q' spells.txt
Lumos
Expelliarmus
```

### Printing Lines

Often, you just want to filter lines and only capture a subset. That's where `sed`'s print command (`p`) comes in. Let's see what happens if we target lines beginning containing "Exp":

```bash
> sed '/Exp/ p' spells.txt
Lumos
Expelliarmus
Expelliarmus
Expecto Patronum
Expecto Patronum
Accio
Alohomora
```

Whoa! What happened? "Expelliarmus" and "Expecto Patronum" printed twice while the non-matching lines printed once. 

Remember the 3 steps `sed` goes through for each line. After processing, `sed` sends the line from the pattern space to `stdout`. That's why each line appears at least once in the output. The two "Exp..." lines appear a second time due to the `p` command. To only return the lines of interest, you need to turn off `sed`'s auto-printing of the pattern space. That's done with the `-n` flag: 

```bash
> sed -n '/Exp/ p' spells.txt
Expelliarmus
Expecto Patronum
```

Ah...that's better.

## Change File in Place
-i 

PICK UP HERE

Up to now, these `sed` snippets have not modified the original file.

## Cleaning Up Messy Files

Back to that original example: How could `sed` remove comments and format this file?

```bash
> cat spells_messy.txt
     Lumos # nightlight

# for dem bad guys
Expelliarmus
Expecto Patronum


Accio
Alohomora  # unlock doors


```

It has comments prefixed by `#`, some blank lines, and some indentation. But the script needs no blank lines and no comments. Swish and flick!:

```bash
> sed 's/\s*#.*// ; /^$/d ; s/^\s*//' spells_messy.txt
Lumos
Expelliarmus
Expecto Patronum
Accio
Alohomora
```

Did I tell you that `sed` allows multiple commands separated by semicolon? Well now you know. This command is not so bad once you break it down:

```txt
sed 's/\s*#.*// ; /^$/d ; s/^\s*//' spells_messy.txt
     ^            ^       ^
     |            |       substitute leading spaces with empty string
     |            delete empty lines
     substitute comments with empty string
```


[insert cheatsheet of common commands and flags] - link to man page


## Real World Example: Bookmarks - maybe nix, this is getting long


You target specific lines with addresses. Addresses can be line numbers or search criteria.

You give commands to tell `sed` what to do with each line. The most common one is `s` for substitute.

Use `s` with `-n` to only get the lines you want

flags: -i, -f, -n, -E

commands:
- p
- d and !d
- q
- i
- a
- =
- y
