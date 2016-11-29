---
layout: post
title: How Rsync Works - A Practical Overview
category: [Linux工具]
tags: [Rsync, Remote Server, Data Synchronization]
description: >
    This document describes in general terms the construction and behaviour of Rsync. In some cases details and exceptions that would contribute to specific accuracy have been sacrificed for the sake meeting the broader goals.
excerpt: >
    In this document I hope to describe: 1) A non-mathematical overview of the rsync algorithm. 2) How that algorithm is implemented in the rsync utility. 3) The protocol, in general terms, used by the rsync utility. 4) The identifiable roles the rsync processes play.
---

## Foreword

The original [Rsync technical report](http://rsync.samba.org/tech_report/) and Andrew Tridgell's [Phd thesis (pdf)](http://samba.org/~tridge/phd_thesis.pdf) are both excellent documents for understanding the theoretical mathematics and some of the mechanics of the rsync algorithm. Unfortunately they are more about the theory than the implementation of the rsync utility (hereafter referred to as Rsync).

In this document I hope to describe...

- A non-mathematical overview of the rsync algorithm.
- How that algorithm is implemented in the rsync utility.
- The protocol, in general terms, used by the rsync utility.
- The identifiable roles the rsync processes play.

This document be able to serve as a guide for programmers needing something of an entré into the source code but the primary purpose is to give the reader a foundation from which he may understand:

- Why rsync behaves as it does.
- The limitations of rsync.
- Why a requested feature is unsuited to the code-base.

This document describes in general terms the construction and behaviour of Rsync. In some cases details and exceptions that would contribute to specific accuracy have been sacrificed for the sake meeting the broader goals.

## Processes and Roles

When we talk about **Rsync** we use specific terms to refer to various processes and their roles in the task performed by the utility. For effective communication it is important that we all be speaking the same language; likewise it is important that we mean the same things when we use certain terms in a given context. On the rsync mailing list there is often some confusion with regards to role and processes. For these reasons I will define a few terms used in the role and process contexts that will be used henceforth.

> ### \# client - role
> The client initiates the synchronisation.

> ### \# server - role
> The remote rsync process or system to which the client connects either within a local transfer, via a remote shell or via a network socket.  
> This is a general term and should not be confused with the daemon.  
> Once the connection between the client and server is established the distinction between them is superseded by the sender and receiver roles.

> ### \# daemon - role and process
> An Rsync process that awaits connections from clients. On a certain platform this would be called a service.

> ### \# remote shell - role and set of processes
> One or more processes that provide connectivity between an Rsync client and an Rsync server on a remote system.

> ### \# sender - role and process
> The Rsync process that has access to the source files being synchronised.

> ### \# receiver - role and process
> As a role the receiver is the destination system. As a process the receiver is the process that receives update data and writes it to disk.

> ### \# generator - process
> The generator process identifies changed files and manages the file level logic.

## Process Startup

When an Rsync client is started it will first establish a connection with a server process. This connection may be through pipes or over a network socket.

When Rsync communicates with a remote non-daemon server via a remote shell the startup method is to fork the remote shell which will start an Rsync server on the remote system. Both the Rsync client and server are communicating via pipes through the remote shell. As far as the rsync processes are concerned there is no network. In this mode the rsync options for the server process are passed on the command-line that is used to start the remote shell.

When Rsync is communicating with a daemon it is communicating directly with a network socket. This is the only sort of Rsync communication that could be called network aware. In this mode the rsync options must be sent over the socket, as described below.

At the very start of the communication between the client and the server, they each send the maximum protocol version they support to the other side. Each side then uses the minimum value as the the protocol level for the transfer. If this is a daemon-mode connection, rsync options are sent from the client to the server. Then, the exclude list is transmitted. From this point onward the client-server relationship is relevant only with regards to error and log message delivery.

Local Rsync jobs (when the source and destination are both on locally mounted filesystems) are done exactly like a push. The client, which becomes the sender, forks a server process to fulfill the receiver role. The client/sender and server/receiver communicate with each other over pipes.

## The File List

The file list includes not only the pathnames but also ownership, mode, permissions, size and modtime. If the --checksum option has been specified it also includes the file checksums.
The first thing that happens once the startup has completed is that the sender will create the file list. While it is being built, each entry is transmitted to the receiving side in a network-optimised way.

When this is done, each side sorts the file list lexicographically by path relative to the base directory of the transfer. (The exact sorting algorithm varies depending on what protocol version is in effect for the transfer.) Once that has happened all references to files will be done by their index in the file list.

If necessary the sender follows the file list with id→name tables for users and groups which the receiver will use to do a id→name→id translation for every file in the file list.

After the file list has been received by the receiver, it will fork to become the generator and receiver pair completing the pipeline.

## The Pipeline

Rsync is heavily pipelined. This means that it is a set of processes that communicate in a (largely) unidirectional way. Once the file list has been shared the pipeline behaves like this:

> generator → sender → receiver

The output of the generator is input for the sender and the output of the sender is input for the receiver. Each process runs independently and is delayed only when the pipelines stall or when waiting for disk I/O or CPU resources.

## The Generator

The generator process compares the file list with its local directory tree. Prior to beginning its primary function, if --delete has been specified, it will first identify local files not on the sender and delete them on the receiver.

The generator will then start walking the file list. Each file will be checked to see if it can be skipped. In the most common mode of operation files are not skipped if the modification time or size differs. If --checksum was specified a file-level checksum will be created and compared. Directories, device nodes and symlinks are not skipped. Missing directories will be created.

If a file is not to be skipped, any existing version on the receiving side becomes the "basis file" for the transfer, and is used as a data source that will help to eliminate matching data from having to be sent by the sender. To effect this remote matching of data, block checksums are created for the basis file and sent to the sender immediately following the file's index number. An empty block checksum set is sent for new files and if --whole-file was specified.

The block size and, in later versions, the size of the block checksum are calculated on a per file basis according to the size of that file.

## The Sender

The sender process reads the file index numbers and associated block checksum sets one at a time from the generator.
For each file id the generator sends it will store the block checksums and build a hash index of them for rapid lookup.

Then the local file is read and a checksum is generated for the block beginning with the first byte of the local file. This block checksum is looked for in the set that was sent by the generator, and if no match is found, the non-matching byte will be appended to the non-matching data and the block starting at the next byte will be compared. This is what is referred to as the “rolling checksum”

If a block checksum match is found it is considered a matching block and any accumulated non-matching data will be sent to the receiver followed by the offset and length in the receiver's file of the matching block and the block checksum generator will be advanced to the next byte after the matching block.

Matching blocks can be identified in this way even if the blocks are reordered or at different offsets. This process is the very heart of the rsync algorithm.

In this way, the sender will give the receiver instructions for how to reconstruct the source file into a new destination file. These instructions detail all the matching data that can be copied from the basis file (if one exists for the transfe), and includes any raw data that was not available locally. At the end of each file's processing a whole-file checksum is sent and the sender proceeds with the next file.

Generating the rolling checksums and searching for matches in the checksum set sent by the generator require a good deal of CPU power. Of all the rsync processes it is the sender that is the most CPU intensive.

## The Receiver

The receiver will read from the sender data for each file identified by the file index number. It will open the local file (called the basis) and will create a temporary file.

The receiver will expect to read non-matched data and/or to match records all in sequence for the final file contents. When non-matched data is read it will be written to the temp-file. When a block match record is received the receiver will seek to the block offset in the basis file and copy the block to the temp-file. In this way the temp-file is built from beginning to end.

The file's checksum is generated as the temp-file is built. At the end of the file, this checksum is compared with the file checksum from the sender. If the file checksums do not match the temp-file is deleted. If the file fails once it will be reprocessed in a second phase, and if it fails twice an error is reported.

After the temp-file has been completed, its ownership and permissions and modification time are set. It is then renamed to replace the basis file.

Copying data from the basis file to the temp-file make the receiver the most disk intensive of all the rsync processes. Small files may still be in disk cache mitigating this but for large files the cache may thrash as the generator has moved on to other files and there is further latency caused by the sender. As data is read possibly at random from one file and written to another, if the working set is larger than the disk cache, then what is called a seek storm can occur, further hurting performance.

## The Daemon

The daemon process, like many daemons, forks for every connection. On startup, it parses the rsyncd.conf file to determine what modules exist and to set the global options.

When a connection is received for a defined module the daemon forks a new child process to handle the connection. That child process then reads the rsyncd.conf file to set the options for the requested module, which may chroot to the module path and may drop setuid and setgid for the process. After that it will behave just like any other rsync server process adopting either a sender or receiver role.

## The Rsync Protocol

A well-designed communications protocol has a number of characteristics.

- Everything is sent in well defined packets with a header and an optional body or data payload.
- In each packet's header a type and or command specified.
- Each packet has a definite length.

In addition to these characteristics, protocols have varying degrees of statefulness, inter-packet independence, human readability, and the ability to reestablish a disconnected session.

Rsync's protocol has none of these good characteristics. The data is transferred as an unbroken stream of bytes. With the exception of the unmatched file-data, there are no length specifiers nor counts. Instead the meaning of each byte is dependent on its context as defined by the protocol level.

As an example, when the sender is sending the file list it simply sends each file list entry and terminates the list with a null byte. Within the file list entries, a bitfield indicates which fields of the structure to expect and those that are variable length strings are simply null terminated. The generator sending file numbers and block checksum sets works the same way.

This method of communication works quite well on reliable connections and it certainly has less data overhead than the formal protocols. It unfortunately makes the protocol extremely difficult to document, debug or extend. Each version of the protocol will have subtle differences on the wire that can only be anticipated by knowing the exact protocol version.

## Notes

This document is a work in progress. The author expects that it has some glaring oversights and some portions that may be more confusing than enlightening for some readers. It is hoped that this could evolve into a useful reference.
Specific suggestions for improvement are welcome, as would be a complete rewrite.

> This document is from Rsync official site：[https://rsync.samba.org/how-rsync-works.html](https://rsync.samba.org/how-rsync-works.html)