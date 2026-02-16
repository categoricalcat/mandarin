/**
 * Simple slugify implementation to replace the slugify package.
 * Removes non-alphanumeric characters, converts to lowercase, and replaces spaces/multiple dashes with a single dash.
 */
export function slugify(text: string): string {
    return text
        .toString()
        .normalize('NFD') // split accented characters into their base characters and diacritical marks
        .replace(/[\u0300-\u036f]/g, '') // remove all the accents
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // replace spaces with -
        .replace(/[^\w.-]+/g, '') // remove all non-word chars except . and -
        .replace(/--+/g, '-'); // replace multiple - with single -
}

export default slugify;
