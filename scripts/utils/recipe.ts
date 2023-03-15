import { Ingredient } from '../types.ts';

const units: string[] = [
	'oz',
	'cup',
	'cups',
	'quart',
	'quarts',
	'tsp',
	'teaspoon',
	'teaspoons',
	'tbsp',
	'tablespoon',
	'tablespoons',
	'dash',
	'dashes',
	'g',
	'lb',
	'lbs',
];

export function parseIngredients(ingredients: string[] = []): Ingredient[] {
	// Parse recognizable <quantity> <unit> <name> ingredient strings into variables
	const ingredientRegExp = new RegExp(
		`^(?<quantity>[0-9½¼⅛⅓⅔¾]*)\\s?(?<unit>${
			units.join(
				'|',
			)
		})?\\s(?<name>.*)$`,
	);

	const parsedIngredients = ingredients.map((ingredient) => {
		// Convert fractions to unicode
		ingredient = ingredient
			.replace(/\b1\/2|0?\.5\b/, '½')
			.replace(/\b1\/4|0?\.25\b/, '¼')
			.replace(/\b3\/4|0?\.75\b/, '¾')
			.replace(/\b1\/3|0?\.33\b/, '⅓')
			.replace(/\b2\/3|0?\.66\b/, '⅔')
			.replace(/\b1\/8|0?\.125\b/, '⅛');

		const ingredientGroups = ingredient.match(ingredientRegExp);
		const parsedIngredient: Ingredient = ingredientGroups?.groups
			? ingredientGroups.groups as Ingredient
			: ingredient;

		return parsedIngredient;
	});

	return parsedIngredients;
}
