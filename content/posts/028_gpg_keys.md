Title: gpg Keys
Date: 2026-10-16
Slug: gpg-keys
Tags: command-line, linux, privacy
Summary: Stop trusting big tech to encrypt your communication. Do it yourself with gpg keys.
Status: draft


I send messages to my boo. 🥰

But I don't want tech giants (I'm looking at you Zuck) to access the message content.

I could let channels like WhatsApp provide "end-to-end encryption" between me and my contacts.

But I'm a control freak. I must take privacy into my own hands. So I encrypt the message myself. 🤓

That means instead of sending a message like this...

`I love you.`

I send one that looks like this:

```text
-----BEGIN PGP MESSAGE-----

hF4DoBxCn15WHfQSAQdABqYNAxKtFoVM5BiQmn7AClJnQ2E8b9vRdOrx/OPuEwow
CyNEwZvmaLKEfz/s1eEwHxEzBu/hUCZh/TV6aUxJ9uTmAtWbX3AUXt1CSYatlEtm
1FEBCQIQRBtuWDufM2PHpfOdhn9399if7OyixHfVX+4bF/sPXXgTfhW/7NJtrMBE
4SwJXq98GJFfeGIqmPUHIrTCRCCRdnjq40yI9VLnv4ClcXk=
=09MP
-----END PGP MESSAGE-----
```

No one but the intended recipient can decrypt that gobbledegook and understand my message. 

I don't have to trust Meta, Apple, or Google to supposedly keep the message private. 

Today we'll look at `gpg`, a Linux tool for handling encryption tasks. 

By the end, you'll be running some Jason-Bourne-like espionage. 😎

## Basics

First some terminology: GPG and OpenPGP. These are two different things. OpenPGP stands for Open **P**retty-**G**ood-**P**rivacy. It's a collection of standards for how data should be encrypted, decrypted, and signed. GPG, on the other hand, stands for **G**NU **P**rivacy **G**uard. GPG is the GNU implementation of OpenPGP. 

Hopefully you have some knowledge of key pairs. If you don't, here's the crash course. 

One of the most secure encryption techniques is asymmetric encryption, which requires 2 related keys: a private key 🗝️ and a public key 🔑. What one key encrypts only the other key can decrypt. That is, if a public key encrypts a message, only the corresponding private key can decrypt it. Ideally, each person has a public key and a private key. The public key is available for anyone to use (that's why it's "public"). But the private key is super secret and held only by the person it belongs to.

Why is that helpful? Well say Harry has a message for Ginny. He wants only her to be able to read that message. So Harry encrypts the message with Ginny's public key. When Ginny receives the encrypted message, she decrypts it with her private key. In fact, ONLY Ginny's private key can decrypt the message. So when big brother Ron tries to intervene, he can't read the message! 

## Create GPG Key Pairs

Let's create a key pair and encrypt some messages. On Linux, look for the `gpg` command to access the GnuPG suite. 

Enter this command to generate a new key:

```text
> gpg --full-generate-key
```

`gpg` asks questions before building the key pair:

- For the kind of key, choose the default of `ECC (sign and encrypt)`. 
- For the algorithm, choose the default elliptic curve of `Curve 25519`. 
    - This is the modern recommended encryption algorithm, but RSA is also a decent option.
- Choose how long the key should be valid before expiration. 
- Enter your name and email address. 
    - No messages will be sent to the email address. You can enter an inactive address. The email address serves as a user ID to distinguish one key from another.
- Finally you'll be prompted for a passphrase. 
    - Choose something difficult to guess but easy to remember. You must have this passphrase to use the key!

Boom! You have a GPG key pair. You can view the private key summary with the `--list-secret-keys` command:

```text
> gpg --list-secret-keys
...
sec   ed25519 2026-10-12 [SC] [expires: 2027-10-12]
      6F9FC456AF0968078DD68C3ED9F6A60E2A0735D8
uid           [ultimate] Harry Potter <harry@hogwarts.edu>
ssb   cv25519 2026-10-12 [E] [expires: 2027-10-12]
```

This gives a fingerprint of the key pair: `6F9FC456AF0968078DD68C3ED9F6A60E2A0735D8`. The fingerprint identifies the key and is safe to share. Often, two people compare fingerprints to check if they've properly exchanged public keys.

## Encrypt Message

Now let's encrypt a message that Harry (you 🪄) is sending to Ginny. Assume you have Ginny's public key 🔑 saved in your GPG public keyring. (Your public keyring is a collection of public keys you've gathered from your friends.)

Here's the unencrypted file `message.txt`: 

```text
> cat message.txt
I love you, Ginny.
```

Time to encrypt the file with the `--encrypt` command. `gpg` also expects the intended recipient, which is passed with the `--recipient` option. With the below command, `gpg` will use Ginny's public key (stored in your keyring) to encrypt the file.

```text
> gpg --recipient ginny@hogwarts.edu --encrypt message.txt
> ls
message.txt  message.txt.gpg
```

Aaand... a new file `message.txt.gpg` is created. This .gpg file contains the encrypted contents of the original .txt file. You can try viewing the encrypted message...

```text
> cat message.txt.gpg
^B^V@yg$//]̲QJ053܎r4Mۙ{W]oߑEL{@+\*|M\'c   щ5gtE7wk߫        P%5yI?d ʸ:(͠Rg6 2lolU\%FP<"
```

But you get this. Yep, the encrypted file is in binary. Only Ginny's private key can make sense of the .gpg file.

## Decrypt Message

Harry sends `message.txt.gpg` to Ginny. Ginny uses her private key 🗝️ to decrypt the love note with the `--decrypt` command:

```text
> gpg --decrypt message.txt.gpg
gpg: encrypted with cv25519 key, ID A01C429F5E561DF4, created 2026-10-12
      "Ginny Weasley <ginny@hogwarts.edu>"
I love you, Ginny.
```

Ginny will be prompted for her private key's passphrase. Assuming she enters the passphrase correctly, `gpg` will decrypt the message and send that back to the terminal (`stdout`).

## Encrypt and Decrypt with Readable Characters (No Binary)

But wait, maybe sending an encrypted binary file is inconvenient. What if you want a text representation of the encrypted file? That's where the `--armor` flag comes in. This cool sounding option encrypts the file in a readable format instead of binary. Specifically, the encrypted message is represented as ASCII characters.

```text
> gpg --armor --recipient ginny@hogwarts.edu --encrypt message.txt
> ls
message.txt  message.txt.asc  message.txt.gpg
```

This creates another file: `message.txt.asc`.

```text
> cat message.txt.asc
-----BEGIN PGP MESSAGE-----

hF4DoBxCn15WHfQSAQdA1stl7u5UQMjVN/SphFpYWKwO096EA3Xjsp/s5Puyqw0w
G9MO4gLpRiairNgpNOs4QaM03ASvpwZ8CwdKocSuPcrZcw64VdS+H0K/4eHWF/6i
1GMBCQIQFGrJqgq90VAtk+1BceKoQeZqF5I89/kWHtlN1hrFDuv5Yygbg/X9aH8X
s1U+SNJ1VMLLn07a1Ytehdw7cddneTUX3JSc3PkhapN+bTarIBzEj489pBmeuc6X
O8y/5bI=
=qPYz
-----END PGP MESSAGE-----
```

The header and footer indicate this block of text is an encrypted message in the PGP protocol. 

Now Harry can copy-paste the text into whatever channel he wants (text message, WhatsApp, owls, etc). 

Ginny can take the plain text, copy-paste it into some file, and decrypt it as before with `gpg`:

```text
> gpg --decrypt message.txt.asc
gpg: encrypted with cv25519 key, ID A01C429F5E561DF4, created 2026-10-12
      "Ginny Weasley <ginny@hogwarts.edu>"
I love you, Ginny.
```

Or she can pipe the text into `gpg`: 

```text
> echo '-----BEGIN PGP MESSAGE-----

hF4DoBxCn15WHfQSAQdA1stl7u5UQMjVN/SphFpYWKwO096EA3Xjsp/s5Puyqw0w
G9MO4gLpRiairNgpNOs4QaM03ASvpwZ8CwdKocSuPcrZcw64VdS+H0K/4eHWF/6i
1GMBCQIQFGrJqgq90VAtk+1BceKoQeZqF5I89/kWHtlN1hrFDuv5Yygbg/X9aH8X
s1U+SNJ1VMLLn07a1Ytehdw7cddneTUX3JSc3PkhapN+bTarIBzEj489pBmeuc6X
O8y/5bI=
=qPYz
-----END PGP MESSAGE-----' | gpg --decrypt
gpg: encrypted with cv25519 key, ID A01C429F5E561DF4, created 2026-10-12
      "Ginny Weasley <ginny@hogwarts.edu>"
I love you, Ginny.
```

It's worth repeating that the encrypted message can be sent in literally any channel, no matter how insecure the channel is. It doesn't matter who's snooping on your communication. Because no one can unencrypt the message without Ginny's private key. 🔒

## Sign Messages

Closely related to encrypting data is signing it. When you sign data, you're saying "I genuinely created this data" (authenticity). The recipient also uses the signature to verify the data hasn't been tampered with while in-flight (integrity). 


Here's how signing works: `gpg` hashes the data and uses your private signing key 🗝️ to create a signature from the hash. The encrypted hash (i.e. the signature) is included with the file to be sent.

Upon receiving the file, the recipient verifies the signature against the file content using your public key 🔑. If verification passes, the received file matches the original file that was signed, proving the data has not been tampered with. Successful verification also tells the recipient that your private key was involved in the signing process, suggesting you wrote the file.

Of course, `gpg` handles both signing and verification for you. Let's clear the directory and have Harry (you) sign the message he's sending to Ginny. The `--local-user` flag indicates which private key should be used for signing. The `--detach-sign` command tells `gpg` to create a separate file for the signature.

```text
> ls
message.txt
> gpg --local-user harry@hogwarts.edu --detach-sign message.txt
> ls
message.txt  message.txt.sig
```

Now there's a 2nd file `message.txt.sig` that contains the signature. Harry sends `message.txt.sig` along with the original `message.txt`. Ginny verifies the signature is good using the `--verify` command. Specifically, she passes the signature file and the message file to the `gpg --verify` command:

```text
> gpg --verify message.txt.sig message.txt
gpg: Signature made Tue 13 Oct 2026 02:06:24 PM CDT
gpg:                using EDDSA key 6F9FC456AF0968078DD68C3ED9F6A60E2A0735D8
gpg:                issuer "harry@hogwarts.edu"
gpg: Good signature from "Harry Potter <harry@hogwarts.edu>" [ultimate]
```

`gpg` compares the signature with the file content. When it says "Good signature," `gpg` is saying the signature is legitimate for the associated file. That is, Harry's private key was used to sign the file, and the file content has not changed since signing.

But wait! The file itself is still in plain text! 😱

```text
> cat message.txt
I love you, Ginny.
```

Often, people choose to sign a file AND encrypt the file at the same time. Let's clear the directory and do that:

```text
> rm message.txt.sig
> ls
message.txt
> gpg --local-user harry@hogwarts.edu --recipient ginny@hogwarts.edu --sign --encrypt message.txt
> ls
message.txt  message.txt.gpg
```

Note the `--sign` and `--encrypt` commands since you want to do both. The `--local-user` option still says to use Harry's private key for signing. And the `--recipient` option says to use Ginny's public key for encryption.

Internally, `gpg` creates a signature with your private key, bundles the signature with the file content, and then encrypts the bundle with the recipient's public key.

You have a `message.txt.gpg` file again. But this version has both the encrypted file content and your signature in a single file. Harry sends this to Ginny, and when Ginny runs the `--decrypt` command, `gpg` both decrypts the file content and verifies the signature: 

```text
> gpg --decrypt message.txt.gpg
gpg: encrypted with cv25519 key, ID A01C429F5E561DF4, created 2026-10-12
      "Ginny Weasley <ginny@hogwarts.edu>"
I love you, Ginny.
gpg: Signature made Tue 13 Oct 2026 02:15:07 PM CDT
gpg:                using EDDSA key 6F9FC456AF0968078DD68C3ED9F6A60E2A0735D8
gpg:                issuer "harry@hogwarts.edu"
gpg: Good signature from "Harry Potter <harry@hogwarts.edu>" [ultimate]
```

The output says the content was encrypted with Ginny's key and the signature was signed using Harry's key.

Whew, that's a lot! Here's a summary of encrypting vs signing a file: 

1. **Encrypt Only**: Only the recipient with the corresponding private key can decrypt content. But encryption alone doesn't establish you created the content.
2. **Sign Only**: Anyone with your public key can verify you created the file. Anyone can read the file because the content is not encrypted.
3. **Encrypt and Sign**: Only the recipient with the corresponding private key can decrypt the content and verify your signature (i.e. that your private key created the signature)

There are use cases for each of the 3 scenarios. When in doubt, go with "encrypt and sign."

## Key maintenance

Like your car that broke down for the 5th time this year, GPG keys need some maintenance. Here are 3 common chores:

### 1. Change Passphrase

Your passphrase is the last line of defense for your private key. Even if someone gets a hold of your private key, they can't use it without the passphrase. Thus, it's a good idea to change the passphrase from time to time. 

Run the `--passwd` command with the user ID of the private key to update:


```text
> gpg --passwd harry@hogwarts.edu
```

`gpg` will prompt you for the current passphrase first. Then you enter the new passphrase.


### 2. Export Public Key

If you want others to send encrypted messages to you, they need your public key. Often, the ASCII version is shared.

Use `--armor --export` to generate the public key block:

```text
> gpg --armor --export harry@hogwarts.edu
-----BEGIN PGP PUBLIC KEY BLOCK-----

mDMEas0n9BYJKwYBBAHaRw8BAQdAkv0WBerOJhPHSWLNc4pIxt4W0NWosf0ihXac
NHc/Tnq0IUhhcnJ5IFBvdHRlciA8aGFycnlAaG9nd2FydHMuZWR1PoiZBBMWCgBB
FiEEb5/EVq8JaAeN1ow+2famDioHNdgFAmrNJ/QCGwMFCQHhM4AFCwkIBwICIgIG
FQoJCAsCBBYCAwECHgcCF4AACgkQ2famDioHNdiG6wD/cN0JrTcKL0/ms4vRN5gp
SoGi15Ukpb0CrrLXD4jI5fcBAPPDB+dkq9rTXJpWbB+etnlm7Vd/dZnyBXJiXFWU
v4YOuDgEas0n9BIKKwYBBAGXVQEFAQEHQGPv2HYEEDOMJMqQkbThxgY02ParS5+B
+vyWk2lpgfslAwEIB4h+BBgWCgAmFiEEb5/EVq8JaAeN1ow+2famDioHNdgFAmrN
J/QCGwwFCQHhM4AACgkQ2famDioHNdjqsgD+IxDBb+uw2eO1JcEYltl/zj5JN6WR
9ifm5A7NkicNYkcBAOBn983Vpzc90nPcVjYow6ImCktx+IPPTL5mCWef38UP
=rh+o
-----END PGP PUBLIC KEY BLOCK-----
```

Share this text with your friends using whichever channel you want. They would import this public key into their GPG keychain, enabling them to encrypt messages intended for you. Again, the public key is safe to share; only the private key should be guarded with your life. ⚔️

### 3. Edit Expiration Date

When your GPG key expires, you don't create a new one. Instead you extend the expiration date of the existing key.

First, let's talk more about Harry's secret key. Upon listing the key, you see a couple of keys associated with `harry@hogwarts.edu`:

```text
> gpg --list-secret-keys harry@hogwarts.edu
sec   ed25519 2026-10-12 [SC] [expires: 2027-10-12]
      6F9FC456AF0968078DD68C3ED9F6A60E2A0735D8
uid           [ultimate] Harry Potter <harry@hogwarts.edu>
ssb   cv25519 2026-10-12 [E] [expires: 2027-10-12]
``` 

`gpg` creates multiple private keys (or subkeys). Each key or subkey is used for a specific purpose. Check out the headers in the output to understand the two private keys here:

1. `sec`: This is the primary secret key ("sec" = "secret"). On the same line, `[SC]` indicates that this key is used for signing and certifying.
2. `ssb`: This is the subkey ("ssb" = "secret sub"). On this line, `[E]` indicates `gpg` uses this key for encryption.

This separation of concerns is a security measure. The primary key establishes your identity and is used for signing. It should be used infrequently to avoid being compromised. The subkey is used for more day-to-day encryption tasks.

Anyway, how do we extend the expiration date? Run the `--edit-key` command:

```text
> gpg --edit-key harry@hogwarts.edu
...
Secret key is available.

sec  ed25519/D9F6A60E2A0735D8
     created: 2026-10-12  expires: 2027-10-12  usage: SC
     trust: ultimate      validity: ultimate
ssb  cv25519/B50D74485E66A5DC
     created: 2026-10-12  expires: 2027-10-12  usage: E
[ultimate] (1). Harry Potter <harry@hogwarts.edu>

gpg>
```

This will drop you into an interactive `gpg` menu with a `gpg>` prompt. Here are the gpg menu commands you need:

1. `expire <i>`: change the expiration date of the selected key or subkey
2. `save`: save changes to disk

Notice that both the primary key and subkey expire on 2027-10-12 (about one year from now as I write this). Each key's expiration needs to be updated independently. The key list is 0-indexed. To change the expiration of the primary key (first in the list), run `expire 0`:

```text
gpg> expire 0
Changing expiration time for the primary key.
Please specify how long the key should be valid.
         0 = key does not expire
      <n>  = key expires in n days
      <n>w = key expires in n weeks
      <n>m = key expires in n months
      <n>y = key expires in n years
Key is valid for? (0) 10y
Key expires at Sun 12 Oct 2036 01:40:55 PM CDT
Is this correct? (y/N) y

sec  ed25519/D9F6A60E2A0735D8
     created: 2026-10-12  expires: 2036-10-12  usage: SC
     trust: ultimate      validity: ultimate
ssb  cv25519/B50D74485E66A5DC
     created: 2026-10-12  expires: 2027-10-12  usage: E
[ultimate] (1). Harry Potter <harry@hogwarts.edu>
```

Here the key is set to be valid for 10 years (`10y`). Note the primary key's expiration is updated from 2027-10-12 to 2036-10-12 while the subkey still expires on 2027-10-12. Run `expire 1` to update the subkey. Finally hit `save` to update the keys on disk and `quit` to exit the `gpg` menu.

Then distribute the updated public key with your friends so they know your key is valid for a bit longer. Otherwise, their instance of `gpg` won't use your expired public key for encryption... which means your friends won't talk to you. 😢

---

You made it! The `gpg` framework can be tough to learn at first. But once you've practiced some commands, you'll be encrypting and signing like a pro. Then you can secure your communication without wondering if apps really respect your privacy. 💪

Need more help with encryption or signing? Send me a message... securely. Here's my key fingerprint: `A61F 1F7C E5D1 5B1D 36C9  C03C 228A A3F8 CC9F 5E29`.

