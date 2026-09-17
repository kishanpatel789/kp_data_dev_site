Title: sed Command
Date: 2026-09-18
Slug: sed-command
Tags: command-line, linux
Summary: Edit lines of text on-the-fly with sed!
Status: draft


Check out this file. It has comments to help a human like me. 😀

```bash
> cat messy_spells.txt
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

The most common use-case is replacing text with something else. To replace `Lumos` with `LUMOS MAXIMA`, use this:

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
     |   |        with this phrase
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

For the `spells.txt` file, the first line "Lumos" is read into pattern space. `sed` replaces "Lumos" with "LUMOS MAXIMA" and then sends that to `stdout` (the terminal in this case).

Then the second line "Expelliarmus" is read into the buffer. But since "Lumos" is not within this line, no substitution is performed. The unchanged line is sent to `stdout`. The same thing happens for the remaining lines in the files.

Understanding these basic 3 steps unlocks advanced `sed` wizardry. 🪄 Let's explore other instructions in `sed`.

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

Sometimes you want to target a specific line number. To delete the 3rd line, use `3d`. The `3` calls out the 3rd line, and `d` stands for "delete":

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

Technically, the space between the address and the command is not needed, but it improves readability. A command loosely has this structure: `<address> <command-to-run-on-address>`.

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

Often, you want to filter lines and only capture a subset. That's where `sed`'s print command (`p`) comes in. Let's see what happens if we target lines beginning containing "Exp":

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

Remember the 3 steps of `sed` for each line. After applying the command to the line, `sed` kicks the line out of pattern space and sends it to `stdout`. That's why each line appears in the output. The "Exp..." lines appear a second time due to the the print command (`p`).

But you want to output only the lines of interest, which means you need to turn off `sed`'s auto-printing of the pattern space. That's done with the `-n` flag: 

```bash
> sed -n '/Exp/ p' spells.txt
Expelliarmus
Expecto Patronum
```

Ah...that's better. The `-n` flag serves as a silencer. With `-n`, `sed` won't print any line unless the `p` command is found.

## Change File in Place

`sed` is a **stream** editor. That means it processes lines of text that are "in flight." The original lines stored in the file are untouched. 

Don't believe me? Here's a quick check where lines 1 to 3 are deleted again.

```bash
> sed '1,3 d' spells.txt
Accio
Alohomora
> cat spells.txt
Lumos
Expelliarmus
Expecto Patronum
Accio
Alohomora
```

`sed` reads the lines into memory, processes them, and returns the output. "Catting" the file shows no lines were deleted there.

But sometimes, you want to update the original file with the processed lines. `sed` allows in-place editing with the `-i` flag ("`i`" for "in-place").

```bash
> sed -i '1,3 d' spells.txt
> cat spells.txt
Accio
Alohomora
```

This time, `sed` does not emit any output to `stdout`. Instead, the source file is overwritten with the processed lines. 

The `-i` flag should be used carefully! You just saw here how the command deleted lines from the original file. Triple check your `sed` command before letting it change your files.

## Cleaning Up Messy Files

Back to that original example: How could `sed` remove comments and format the file `messy_spells.txt`?

```bash
> cat messy_spells.txt
     Lumos # nightlight

# for dem bad guys
Expelliarmus
Expecto Patronum


Accio
Alohomora  # unlock doors


```

It has comments prefixed by `#`, some blank lines, and some indentation. But the script needs no blank lines and no comments. Swish and flick! 🪄

```bash
> sed 's/\s*#.*// ; /^$/d ; s/^\s*//' messy_spells.txt
Lumos
Expelliarmus
Expecto Patronum
Accio
Alohomora
```

Did I tell you that `sed` allows multiple commands separated by semicolon? Well now you know. This command is not so bad once you break it down:

```txt
sed 's/\s*#.*// ; /^$/d ; s/^\s*//' messy_spells.txt
     ^            ^       ^
     |            |       substitute leading spaces with empty string
     |            delete empty lines
     substitute comments with empty string
```

For this to make sense, you need to know some [regular expressions](https://en.wikipedia.org/wiki/Regular_expression). Here's the cheatsheet for today:

| Pattern | Meaning                                                     |
| :-:     | ---                                                         | 
| `\s`    | Match any white space character                             | 
| `.`     | Match any single character                                  | 
| `*`     | Repeat the character that comes before any number of times. | 
| `^`     | Start of a line                                             | 
| `$`     | End of a line                                               | 

The `*` symbol is a modifier. `\s*` means "match 0 or more white spaces" while `.*` means "match 0 or more of any character you want." 

1. `s/\s*#.*//`: The search pattern is `\s*#.*`, which says find 0 or more spaces, then a hash (`#`), then any number of characters. This captures any comments that appear after a `#`. The replacement string is nothing, which effectively removes the comment.
2. `/^$/d`: This deletes any empty lines. If `^` is the beginning of a line and `$` is the end of the line, then `^$` means you have no characters on the line (i.e. empty line).
3. `s/^\s*//`: This search pattern targets spaces at the beginning of the line and effectively deletes them.

Whew! That's a doozy. But hopefully this example shows how powerful `sed` can be. Each of the 3 subcommands are applied one after the other. 


PICK UP HERE

---

For more, check out the handy [man page](https://man7.org/linux/man-pages/man1/sed.1.html).


[insert cheatsheet of common commands and flags] - link to man page
