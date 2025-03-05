import { input } from '@inquirer/prompts';
import childProcess from 'child_process';

const trackName = await input({
	message: 'Enter the name of the track',
});

const trackId = trackName.toLowerCase().replace(/[\W_]+/g," ").replace(/ /g, '_');

const trackArtist = await input({
	message: 'Enter the artist(s) of the track',
});

const trackItemId = await input({
	message: 'Enter the item id for the recipe',
});

console.log(`  ${trackArtist} - ${trackName}
	Item ID: ${trackItemId}
	Track ID: ${trackId}`);

let trackAudio;
do {
	trackAudio = (await input({
		message: 'Enter the path to the audio file',
	})).replace(/"/g, "");
} while (!(await Bun.file(trackAudio).exists()));

let trackImage;
do {
	trackImage = (await input({
		message: 'Enter the path to the image file',
	})).replace(/"/g, "");
} while (!(await Bun.file(trackImage).exists()));

/***
 * FFmpeg commands
 * 1) Convert audio to ogg with 120kbps bitrate
 * 2) Convert image to png
 * 3) Get duration of audio
 */
childProcess.execSync(`ffmpeg -i "${trackAudio}" -map 0:a:0 -b:a 120k ../assets/minecraft/sounds/records/music_disc_${trackId}.ogg`);
childProcess.execSync(`ffmpeg -i "${trackImage}" ../assets/minecraft/textures/item/music_disc_${trackId}.png`);
const trackDuration = childProcess.execSync(`ffprobe -i ../assets/minecraft/sounds/records/music_disc_${trackId}.ogg -show_entries format=duration -v quiet -of csv="p=0"`).toString();

if (Number.isNaN(Number(trackDuration))) {
	throw new Error("Invalid audio file");
}

// JSONs
const jukeboxSong = await Bun.file("./resources/base_jukebox_song.json").json();

jukeboxSong["description"] = `${trackArtist} - ${trackName}`;
jukeboxSong["length_in_seconds"] = Number(trackDuration);
jukeboxSong["sound_event"]["sound_id"] += trackId;

Bun.write(`../data/flowsmp/jukebox_song/${trackId}.json`, JSON.stringify(jukeboxSong, null, 4));

const item = await Bun.file("./resources/base_item.json").json();

item["textures"]["layer0"] += trackId;

Bun.write(`../assets/minecraft/models/item/${trackId}.json`, JSON.stringify(item, null, 4));

const recipe = await Bun.file("./resources/base_recipe.json").json();

recipe["ingredients"][1][0] = trackItemId;
recipe["result"]["components"]["minecraft:jukebox_playable"]["song"] += trackId;
recipe["result"]["components"]["minecraft:custom_model_data"]["strings"][0] = trackId;

Bun.write(`../data/flowsmp/recipe/${trackId}.json`, JSON.stringify(recipe, null, 4));

const sounds = await Bun.file("../assets/minecraft/sounds.json").json();

sounds[`music_disc.${trackId}`] = {
	"sounds": [
		{
			"name": `records/music_disc_${trackId}`,
			"stream": true
		}
	]
};

Bun.write("../assets/minecraft/sounds.json", JSON.stringify(sounds, null, 4));

const discRegistry = await Bun.file("../assets/minecraft/items/music_disc_13.json").json();

discRegistry["model"]["cases"].push({
	"when": trackId,
	"model": {
		"type": "model",
		"model": `item/${trackId}`
	}
});

Bun.write("../assets/minecraft/items/music_disc_13.json", JSON.stringify(discRegistry, null, 4));

console.log("Done! YIPEEEEE");