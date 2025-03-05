import { readdir } from "node:fs/promises";
import clipboard from "clipboardy";

let usedItems = [];

const recipes = await readdir("../data/flowsmp/recipe");
for (const recipe of recipes) {
	const recipeData = await Bun.file(`../data/flowsmp/recipe/${recipe}`).json();
	const ingredient = recipeData["ingredients"][1];

	const jukeboxSong = await Bun.file(`../data/flowsmp/jukebox_song/${recipe}`).json();
	const name = jukeboxSong["description"].split(" - ")[1];

	usedItems.push(`- **${name}** | \`\`${ingredient}\`\``);
}

clipboard.writeSync(usedItems.join("\n"));