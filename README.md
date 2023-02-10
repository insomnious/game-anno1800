# Vortex Extension for Anno 1800

This is an extension for [Vortex](https://www.nexusmods.com/about/vortex/) to add support for Anno 1800. This is available for the PC on [Steam](https://store.steampowered.com/app/916440/Anno_1800/), [Epic](https://store.epicgames.com/en-US/p/anno-1800) and [Ubisoft](https://store.ubi.com/uk/game?pid=5b647010ef3aa548048c5958&dwvar_5b647010ef3aa548048c5958_Platform=pcdl&edition=Standard%20Edition&source=detail).

# Features

- Support for managing mods that use the [Xforce Mod Loader](https://github.com/xforce/anno1800-mod-loader) (see below).

- Automatic game detection.
<!-- - Installation of archives which include more than one mod.
- Automatic detection of ModBuddy (the XCOM 2 modding toolkit).
  Load order management (including Steam Workshop entires) -->

# Game detection

The Anno 1800 game extension enables Vortex to automatically locate installs from Steam and Ubisoft Connect apps.

It is also possible to manually set the game folder if the auto detection doesn't find the correct installation. A valid Anno 1800 game folder contains:

- `/Bin/Win64/Anno1800.exe`

If your game lacks these files/folders then it is likely that your installation has become corrupted somehow.

# Mod Management

This extension will automatically download and install the Xforce Mod Loader from GitHub if it isn't detected as nearly all mods require it. See [Xforce's GitHub](https://github.com/xforce/anno1800-mod-loader) for information.

The mods will be deployed to the game's mod folder (`/mods`) and will respect the folder structure within the archive file as this is necessary for the mod loader to work. Any files that are overwritten are backed up for when the mod is disabled or removed.

<!--Individual mod entries can be enabled/disabled from the load order section.


## Load Order Management

This extension utilises the "File Based Load Order (FBLO)" framework provided by the core Vortex application. A list of `XComMod` installations present in the game folder is generated and each entry can be re-ordered, enabled or disabled.

A list of enabled mods in the load order is automatically written to the `DefaultModOptions.ini` file, which tells the game which mods to load and in what order.

## Steam Workshop detection

The load order section will also detect mods installed from the Steam Workshop and display them in the load order. These entries can be managed like any other, however, the mod files themselves are not managed by Vortex and must be managed by Steam. You can also use the [Import from Steam Workshop](https://www.nexusmods.com/site/mods/114) extension to import these mods into Vortex.-->

# See also

- [Xforce's Mod Loader (GitHub)](https://github.com/xforce/anno1800-mod-loader)
- [Mods for Anno 1800 (Nexus Mods)](https://www.nexusmods.com/anno1800)
- [Download Vortex (Nexus Mods)](https://www.nexusmods.com/about/vortex/)
- [Vortex Knowledge Base (Nexus Mods)](https://wiki.nexusmods.com/index.php/Category:Vortex)
