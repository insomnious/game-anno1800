import * as path from "path";
import { fs, log, util } from "vortex-api";
import {
  IDiscoveryResult,
  IExtensionApi,
  IExtensionContext,
  IGameStoreEntry,
  IInstruction,
  IState,
  ISupportedResult
} from "vortex-api/lib/types/api";
import { VortexCommands } from "./VortexCommands";
import { VortexEvents } from "./VortexEvents";

// Fix a bug making unfetch not being properly bound with webpack.
//import unfetch from "unfetch";
//const fetch = unfetch;

// GAME IDS
const NEXUS_ID: string = "anno1800";
const STEAM_ID: string = "916440";
const UPLAY_ID: string = "4553";

const GITHUB_URL = "https://api.github.com/repos/xforce/anno1800-mod-loader";

const EXECUTABLE_PATH = path.join("Bin", "Win64", "Anno1800.exe");

const MODLOADER_DLL_NAME = "python35.dll";
const MODLOADER_BACKUPDLL_NAME = "python35_ubi.dll";

let vortexCommands: VortexCommands;
let vortexEvents: VortexEvents;

async function findGame() {
  try {
    const game: IGameStoreEntry = await util.GameStoreHelper.findByAppId([UPLAY_ID, STEAM_ID]);
    console.log("ANNO1800: " + game.gamePath);
    return Promise.resolve(game.gamePath);
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
}

//This is the main function Vortex will run when detecting the game extension.
function main(context: IExtensionContext) {
  // register a whole game, basic metadata and folder paths
  context.registerGame({
    id: NEXUS_ID,
    name: "Anno 1800",
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: () => "mods",
    logo: "gameart.jpg",
    executable: () => EXECUTABLE_PATH,
    requiredFiles: [EXECUTABLE_PATH],
    setup: prepareForModding
  });

  // register a new mod type as the modloader needs to be in a diff folder to the regular mods
  context.registerModType(
    "anno1800-modtype-modloader",
    10,
    (gameId) => gameId === NEXUS_ID,
    () => getModLoaderPath(context.api),
    () => false
  );

  // register installer to check mod when it installs and then use the above mod type
  context.registerInstaller("anno1800-installer-modloader", 25, testSupportedContent, installContent);

  //context.api.events.on('gamemode-activated',  async (gameMode: string) => onGameModeActivated(context.api, gameMode));

  context.once(() => {
    log("debug", "initialising your new extension!");
    vortexCommands = new VortexCommands(context.api);
    vortexEvents = new VortexEvents(context.api);
    vortexEvents.onGameModeActivated.subscribe(OnGameModeActivated);
  });

  return true;
}

async function OnGameModeActivated(api: IExtensionApi, gameId: string) {
  if (gameId !== NEXUS_ID) return; // if this isn't our game, then skip

  console.log("onGameModeActivated " + gameId);

  // check for loader exists here?!

  // get executable directory
  const executableFolderPath = getModLoaderPath(api);

  // get paths
  const modLoaderBackupDllPath = path.join(executableFolderPath, MODLOADER_BACKUPDLL_NAME);

  // check if backup dll exists. if it does, then either they've installed before vortex or vortex has installed.
  // if before vortex, then do we really want vortex to keep attempting it?

  // i could also check to see python35.dll.vortex_backup exists to show that the mod loader has been done by vortex?

  try {
    await fs.statAsync(modLoaderBackupDllPath);
    console.log(modLoaderBackupDllPath + " exists. No need to do anything.");
    return;
  } catch (error) {
    console.error(error);
    console.log("need to download the mod loader!");
  }

  // get download url of latest release from github api
  const downloadUrl: string = await getLatestDownloadUrlFromGitHub(GITHUB_URL, "/releases");

  if (downloadUrl === undefined) {
    console.log("downloadUrl couldn't be found in the github");
    return;
  }

  // tell Vortex to download and install the mod loader

  //await api.emitAndAwait("start-download-url", downloadUrl, path.basename(downloadUrl));

  // lets do download and install seperately (doesn't really matter, defuatls to install after download automatically anyway)

  console.log("start download " + downloadUrl);

  // not sure await is doing much on these functions?

  //const downloadId:string = await Vortex_StartDownloadAsync(api, downloadUrl, { game: gameId}, undefined, "always");
  const downloadId: string = await vortexCommands.StartDownloadAsync(downloadUrl, { game: gameId }, undefined, "always");

  console.log("after download id='" + downloadId + '"');

  /*
  await api.emitAndAwait("start-download", [downloadUrl], { game: gameId }, undefined, (error: Error, id: string) => { 
    
    if (error) {      
      console.error(error)
      return;
    }

    console.log("download finished with id=" + id);
  
    api.sendNotification({
      type: "success",
      message: "Mod loader has downloaded."
    });

  });*/
}

function getModLoaderPath(api: IExtensionApi): string {
  const state: IState = api.getState();
  //const discovery:IDiscoveryResult = state.settings.gameMode.discovered;

  // not sure what util.getSafe does :/ maybe provides a better way to handle null values? above seems to work for now
  const discovery = util.getSafe(state, ["settings", "gameMode", "discovered", NEXUS_ID], undefined);

  //console.log(discovery);

  // return an absolute path to the directory that contains the exectuable
  return path.dirname(path.join(discovery.path, EXECUTABLE_PATH));
}

module.exports = {
  default: main
};

function prepareForModding(discovery: IDiscoveryResult) {
  // chekc to see iof loader is installed
  // if not, then it needs to download
  //throw new Error("Function not implemented.");
}

function testSupportedContent(files: string[], gameId: string): Promise<ISupportedResult> {
  // Make sure we're able to support this mod.
  // make sure the archive is for this game and
  // we also make sure the archive contains the specific DLL files
  const supported =
    gameId === NEXUS_ID &&
    files.find((file) => path.basename(file).toLowerCase() === MODLOADER_DLL_NAME) !== undefined &&
    files.find((file) => path.basename(file).toLowerCase() === MODLOADER_BACKUPDLL_NAME) !== undefined;

  console.log(files);
  console.log(supported);

  return Promise.resolve({
    supported,
    requiredFiles: []
  });
}

function installContent(files: string[]) {
  // can't type function return type as the return resolve needs to return an inline object

  // loops through the array and maps the old string array into new instructions array
  // everything inside the zip just needs putting into a diff directory than default /mods
  const instructions: IInstruction[] = files.map((file) => {
    return {
      type: "copy",
      source: file,
      destination: file
    };
  });

  // dinput means put it in the executable folder
  instructions.push({
    type: "setmodtype",
    value: "anno1800-modtype-modloader"
  });

  return Promise.resolve({ instructions });
}

async function getLatestDownloadUrlFromGitHub(baseUrl: string, request: string): Promise<string> {
  try {
    // after this line, our function will wait for the `fetch()` call to be settled
    // the `fetch()` call will either return a Response or throw an error
    const response = await fetch(baseUrl + request);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    // response.json() call will either return the parsed JSON object or throw an error
    const data = await response.json();

    // asset[1] is the main zip that contains what we need for the latest release which is data[0]
    const downloadUrl: string = data[0].assets[1].browser_download_url;

    console.log("getLatestDownloadUrlFromGitHub = " + downloadUrl);

    return downloadUrl;
  } catch (error) {
    console.error(error);
  }
}

/*
const sendGetRequest = async () => {
  try {
      const response = await axios.get(GITHUB_URL + "/releases");
      console.log(response.data);

      downloadImage();


  } catch (err) {
      // Handle Error Here
      console.error(err);
  }
};



async function downloadImage () {  
  const url = "https://github.com/xforce/anno1800-mod-loader/releases/download/v0.9.4/loader.zip"
  const savePath = path.join(executableDir, path.basename(url))
  //const writer = fs.createWriteStream(savePath);

  console.log(savePath);

  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'arraybuffer'
  })

  console.log(response);

  await nodeFs.promises.writeFile(savePath, Buffer.from(response.data));

  await decompress(Buffer.from(response.data), executableDir);


/*
  const unzip = zlib.createUnzip();
  const read = Readable.from(Buffer.from(response.data));
  read.pipe(unzip).pipe(fs.createWriteStream(executableDir));

}





function prepareForModding(discovery: IDiscoveryResult): Promise<void> {
  
  const fullExePath = path.join(discovery.path, executablePath);
  executableDir = path.dirname(fullExePath);
  const dllBackupPath = path.join(executableDir, modLoaderBackupDll)

  sendGetRequest();

  console.log(discovery);


  // if the xforce mod loader backup file exists, then we assume that the original python.dll has been replaced by the
  // mod loader download, and so we don't need to download and extract etc in the background 
  if (nodeFs.existsSync(dllBackupPath)) {  

    console.log(dllBackupPath + " exists");  
    
    
  } else {

    console.log(dllBackupPath + " doesn't exist"); 

    // so download?!
    
    const downloadUrl = query(GITHUB_URL, "/releases");

    /*
    downloadUrl
    .then( resolve => downloadFile(resolve, path.join(executableDir, path.basename(resolve))))
    .catch(error => console.error(error))  

  }


  //const url = new URL("releases", GITHUB_URL);

  //log("debug", url.toString());

  return fs.ensureDirWritableAsync(path.join(discovery.path, "Mods"));
}
*/
